"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { claimLessonXp } from "@/lib/db/actions/gamification/lesson_xp_action";
import { tierForLevel } from "@/lib/gamification/levels";
import { XpAwardToast, LevelUpToast } from "./XpToast";

/**
 * How long the lesson has to stay open before it counts.
 *
 * Guards against two things: a mis-click that bounces straight back out, and
 * Next.js prefetching the route. Set to 0 to award the instant the page mounts.
 */
const AWARD_DWELL_MS = 5000;

/**
 * Gap between reward cards when one lesson closes out a module too. Landing
 * them together reads as one event; spacing them lets each win register.
 */
const STAGGER_MS = 520;
/** Level-up lands after the meter has had time to overflow into the new level. */
const LEVEL_UP_DELAY_MS = 900;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Awards lesson XP when a learner opens a lesson. Renders nothing.
 *
 * The award runs from the client rather than during the server render on
 * purpose: Next.js prefetches the RSC payload for links in the viewport, and
 * the sidebar links to every lesson in the open module — awarding at render
 * time would pay out for lessons that were never opened.
 *
 * Safe to fire more than once. The ledger's unique index means a repeat call
 * returns no awards, so nothing appears on a refresh.
 */
const LessonXpAward = ({
  course_id,
  module_item_id,
}: {
  course_id: string;
  module_item_id: string;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!course_id || !module_item_id) return;

    // StrictMode double-invokes this in dev, but the cleanup below clears the
    // first timer before the second is set, so exactly one call survives. The
    // server is idempotent regardless.
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const result = await claimLessonXp({ course_id, module_item_id });
        if (cancelled) return;

        if (result?.serverError) {
          console.warn("[gamification] XP award rejected:", result.serverError);
          return;
        }

        const data = result?.data;
        if (!data || data.awards.length === 0) return;

        // Start the meter filling at the same moment the first card lands, so
        // the toast and the bar read as one event.
        queryClient.invalidateQueries({ queryKey: ["modules", course_id] });

        for (const [index, award] of data.awards.entries()) {
          if (cancelled) return;
          if (index > 0) await sleep(STAGGER_MS);

          toast.custom(
            () => <XpAwardToast source={award.source} amount={award.amount} />,
            {
              // Keyed on the award itself, so a duplicated effect can't stack cards.
              id: `xp-${award.source}-${award.source_id}`,
              duration: 3600,
            }
          );
        }

        if (data.levelAfter > data.levelBefore) {
          await sleep(LEVEL_UP_DELAY_MS);
          if (cancelled) return;

          toast.custom(
            () => (
              <LevelUpToast
                level={data.levelAfter}
                tier={tierForLevel(data.levelAfter)}
                totalXp={data.totalXp}
              />
            ),
            { id: `level-${data.levelAfter}`, duration: 6000 }
          );
        }
      } catch (error) {
        // A background reward is never worth interrupting a lesson over.
        console.warn("[gamification] could not award lesson XP:", error);
      }
    }, AWARD_DWELL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [course_id, module_item_id, queryClient]);

  return null;
};

export default LessonXpAward;

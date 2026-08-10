"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { levelFromXp, levelProgress } from "@/lib/gamification/levels";

/**
 * The XP meter.
 *
 * The whole animation comes from one idea: tween the raw XP *number* and derive
 * the bar and the level from it every frame, rather than easing the bar to a
 * new percentage. When a gain crosses a level boundary the bar fills to full,
 * wraps to zero and refills into the next level on its own, and the level
 * numeral flips at exactly the right moment — the overflow is the reward.
 *
 * Because the width is written fresh each frame there is deliberately no CSS
 * transition on it; a transition would animate the 100%→0% wrap backwards.
 */

/** Base fill time, plus this much again for each level crossed. */
const FILL_SECONDS = 0.9;
const PER_LEVEL_SECONDS = 0.45;
const MAX_FILL_SECONDS = 2.4;
/** How long the crossing flash lingers. */
const FLASH_MS = 900;

export type XpMeterVariant = "compact" | "full";

const XpMeter = ({
  totalXp,
  variant = "compact",
  className,
}: {
  totalXp: number;
  variant?: XpMeterVariant;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();
  const [displayXp, setDisplayXp] = useState(totalXp);
  const [crossing, setCrossing] = useState(false);

  /** Tracks what's on screen, so an interrupted fill resumes instead of jumping. */
  const displayed = useRef(totalXp);
  /** The last total we animated toward — how a real gain is told from a re-run. */
  const lastTarget = useRef<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only a changed total is a real gain, and only a real gain may flash. The
    // check is against the target rather than "has this effect run", because
    // StrictMode runs it twice on mount — keying off the run would make every
    // page load celebrate for anyone who already has XP.
    const isFirstRun = lastTarget.current === null;
    const isRealGain = !isFirstRun && lastTarget.current !== totalXp;
    const from = isFirstRun ? 0 : displayed.current;
    lastTarget.current = totalXp;

    if (reduceMotion || from === totalXp) {
      displayed.current = totalXp;
      setDisplayXp(totalXp);
      return;
    }

    const levelsCrossed = Math.max(0, levelFromXp(totalXp) - levelFromXp(from));
    const duration = Math.min(
      MAX_FILL_SECONDS,
      FILL_SECONDS + levelsCrossed * PER_LEVEL_SECONDS
    );

    let lastLevel = levelFromXp(from);

    const controls = animate(from, totalXp, {
      duration,
      // easeOutQuint: quick off the mark, long settle. Makes the fill feel
      // like it has weight rather than snapping.
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        displayed.current = value;
        setDisplayXp(value);

        const level = levelFromXp(value);
        if (level > lastLevel) {
          lastLevel = level;
          if (isRealGain) {
            setCrossing(true);
            if (flashTimer.current) clearTimeout(flashTimer.current);
            flashTimer.current = setTimeout(() => setCrossing(false), FLASH_MS);
          }
        }
      },
      onComplete: () => {
        displayed.current = totalXp;
        setDisplayXp(totalXp);
      },
    });

    return () => controls.stop();
  }, [totalXp, reduceMotion]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const { level, tier, xpIntoLevel, xpForThisLevel, xpRemaining, pct } =
    levelProgress(Math.floor(displayXp));

  const bar = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-neutral-800/80",
        variant === "full" ? "h-2" : "h-1.5"
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[#ec4e39]",
          // No transition on width: it is rewritten every frame, and a
          // transition would play the level wrap in reverse. Only the colour
          // eases — the bar goes white as the level caps out, which is the one
          // signal that a threshold was crossed.
          "transition-colors duration-300",
          crossing && "bg-white"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-lg border px-3 py-2 transition-colors duration-500",
          crossing
            ? "border-white/40 bg-white/[0.08]"
            : "border-[#ec4e39]/20 bg-[#ec4e39]/[0.06]",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Zap
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors duration-500",
                crossing ? "text-white" : "text-[#ec4e39]"
              )}
            />
            <span className="text-xs font-bold tabular-nums text-white">
              Nivel {level}
            </span>
            <span className="truncate text-[10px] uppercase tracking-wider text-neutral-500">
              {tier}
            </span>
          </div>
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-neutral-500">
            {xpIntoLevel}/{xpForThisLevel}
          </span>
        </div>
        <div className="mt-1.5">{bar}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-colors duration-500 sm:min-w-[300px]",
        crossing
          ? "border-[#ec4e39]/50 bg-[#ec4e39]/[0.08]"
          : "border-neutral-800 bg-neutral-950/60",
        className
      )}
    >
      {/* Glow behind the numeral, only while a level is landing. */}
      {crossing && !reduceMotion && (
        <div
          className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(236,78,57,0.55) 0%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black leading-none tabular-nums text-white">
              {level}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
              nivel
            </span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-[#ec4e39]">
            {tier}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Zap className="h-3.5 w-3.5 text-[#ec4e39]" />
            <span className="text-lg font-black tabular-nums text-white">
              {Math.floor(displayXp).toLocaleString("es-AR")}
            </span>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-neutral-500">
            XP total
          </p>
        </div>
      </div>

      <div className="relative mt-3">{bar}</div>

      <p className="relative mt-2 text-[11px] tabular-nums text-neutral-500">
        {xpIntoLevel}/{xpForThisLevel} XP ·{" "}
        {xpRemaining > 0 ? (
          <>
            faltan{" "}
            <span className="font-semibold text-neutral-300">{xpRemaining}</span>{" "}
            para el nivel {level + 1}
          </>
        ) : (
          <>listo para subir de nivel</>
        )}
      </p>
    </div>
  );
};

export default XpMeter;

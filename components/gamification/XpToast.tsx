"use client";

import { motion, useReducedMotion } from "motion/react";
import { GraduationCap, Layers, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { XpSource } from "@/lib/db/schema/gamification";

/**
 * Reward cards for the course player.
 *
 * Sonner's stock `toast.success` reads as a system notification — fine for
 * "changes saved", wrong for a reward. These use the player's own surface and
 * put the XP number where the eye lands first.
 *
 * The accent escalates with the size of the win: vermilion for a lesson, amber
 * once a module or a course closes out.
 */

const SOURCE_COPY: Record<
  XpSource,
  { title: string; Icon: typeof Zap; tone: "accent" | "gold" }
> = {
  lesson: { title: "Lección completada", Icon: Zap, tone: "accent" },
  module: { title: "Módulo completado", Icon: Layers, tone: "gold" },
  course: { title: "Curso completado", Icon: GraduationCap, tone: "gold" },
};

const TONES = {
  accent: {
    rail: "bg-[#ec4e39]",
    icon: "text-[#ec4e39]",
    amount: "text-[#ec4e39]",
    border: "border-[#ec4e39]/25",
    glow: "rgba(236,78,57,0.35)",
  },
  gold: {
    rail: "bg-amber-400",
    icon: "text-amber-400",
    amount: "text-amber-400",
    border: "border-amber-400/25",
    glow: "rgba(251,191,36,0.35)",
  },
} as const;

const enter = (reduce: boolean | null) =>
  reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: -14, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { type: "spring" as const, stiffness: 420, damping: 30 },
      };

export const XpAwardToast = ({
  source,
  amount,
}: {
  source: XpSource;
  amount: number;
}) => {
  const reduceMotion = useReducedMotion();
  const { title, Icon, tone } = SOURCE_COPY[source];
  const t = TONES[tone];

  return (
    <motion.div
      {...enter(reduceMotion)}
      className={cn(
        "flex w-[300px] items-center gap-3 overflow-hidden rounded-xl border bg-[#0a0a0a]/95 pr-4 shadow-xl backdrop-blur",
        t.border
      )}
    >
      <div className={cn("h-full w-1 self-stretch", t.rail)} />
      <Icon className={cn("h-4 w-4 shrink-0", t.icon)} />
      <span className="flex-1 truncate text-sm font-medium text-white">
        {title}
      </span>
      <span className={cn("text-sm font-black tabular-nums", t.amount)}>
        +{amount}
        <span className="ml-0.5 text-[10px] font-bold uppercase tracking-widest opacity-70">
          xp
        </span>
      </span>
    </motion.div>
  );
};

export const LevelUpToast = ({
  level,
  tier,
  totalXp,
}: {
  level: number;
  tier: string;
  totalXp: number;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...enter(reduceMotion)}
      className="relative w-[300px] overflow-hidden rounded-xl border border-[#ec4e39]/40 bg-[#0a0a0a]/95 p-4 shadow-2xl backdrop-blur"
    >
      {/* One glow, sized to sit behind the numeral. */}
      <div
        className="pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(236,78,57,0.5) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex items-center gap-3">
        <motion.div
          initial={reduceMotion ? undefined : { scale: 0.5, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 380, damping: 18 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#ec4e39]/40 bg-[#ec4e39]/10"
        >
          <span className="text-lg font-black tabular-nums text-white">
            {level}
          </span>
        </motion.div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span className="truncate text-sm font-bold text-white">
              Subiste al nivel {level}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] uppercase tracking-widest text-[#ec4e39]">
            {tier}
          </p>
          <p className="mt-0.5 text-[11px] tabular-nums text-neutral-500">
            {totalXp.toLocaleString("es-AR")} XP en total
          </p>
        </div>
      </div>
    </motion.div>
  );
};

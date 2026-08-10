"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "motion/react";
import { Users, Calendar, BookOpen } from "lucide-react";
import CrossedSwords from "@/components/spartan/CrossedSwords";

interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  icon: React.ReactNode;
}

function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    let frame: number;
    const duration = 2000;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setDisplay(value);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsStrip({ stats }: { stats: StatItem[] }) {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#0a0a0a]">
      {/* Subtle red glow behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[200px] bg-red-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative crossed swords */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none hidden lg:block" style={{ filter: "brightness(0) saturate(100%) invert(19%) sepia(86%) saturate(5765%) hue-rotate(355deg) brightness(100%) contrast(95%)" }}>
        <CrossedSwords size={120} />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none hidden lg:block" style={{ filter: "brightness(0) saturate(100%) invert(19%) sepia(86%) saturate(5765%) hue-rotate(355deg) brightness(100%) contrast(95%)" }}>
        <CrossedSwords size={120} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative flex flex-col items-center text-center ${
                i < stats.length - 1
                  ? "md:border-r md:border-white/[0.06]"
                  : ""
              }`}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                {stat.icon}
              </div>
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                />
              </span>
              <span className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsStripServer({
  users,
  sales,
}: {
  users: number;
  sales: number;
}) {
  const roundDown = (n: number) => Math.floor(n / 100) * 100;

  const stats: StatItem[] = [
    {
      value: 1500,
      label: "Alumnos recibidos",
      suffix: "+",
      icon: <Users className="w-5 h-5 text-red-400" />,
    },
    {
      value: 8,
      label: "Años de experiencia",
      suffix: "",
      icon: <Calendar className="w-5 h-5 text-red-400" />,
    },
    {
      value: 50,
      label: "Dentro del coaching",
      suffix: "+",
      icon: <BookOpen className="w-5 h-5 text-red-400" />,
    },
  ];

  return <StatsStrip stats={stats} />;
}

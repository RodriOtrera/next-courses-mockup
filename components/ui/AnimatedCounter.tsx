"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

interface AnimatedCounterProps {
  value: number;
  label: string;
  duration?: number;
  prefix?: string;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export default function AnimatedCounter({
  value,
  label,
  duration = 1,
  prefix = "",
  icon,
  className = "",
  labelClassName = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    let frame: number;
    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value, duration]);

  return (
    <div
      ref={ref}
      className={`border border-neutral-800/50 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] text-neutral-500 ${labelClassName}`}>
          {label}
        </span>
        {icon}
      </div>
      <span
        style={{ fontVariantNumeric: "tabular-nums" }}
        className="text-2xl font-semibold text-white"
      >
        {prefix}{displayValue.toLocaleString()}
      </span>
    </div>
  );
}

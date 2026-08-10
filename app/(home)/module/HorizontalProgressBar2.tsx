"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
export const ProgressBar = ({
  percentage = 75,
  fillColor = "#3b82f6",
  backgroundColor = "#e5e7eb",
  height = 12,
  duration = 1.5,
  showLabel = true,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          backgroundColor: backgroundColor,
          height: `${height}px`,
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: fillColor }}
          initial={{ width: 0 }}
          animate={{ width: isVisible ? `${clampedPercentage}%` : 0 }}
          transition={{
            duration: duration,
            ease: "easeOut",
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-sm font-semibold text-neutral-500">
            Progreso
          </span>
          <span className="text-sm font-semibold text-neutral-500">
            {clampedPercentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};

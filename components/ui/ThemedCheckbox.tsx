"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ThemedCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  /** Optional leading icon rendered between the box and the label */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Checkbox + label row using the platform accent (red-500).
 * Use this instead of the raw shadcn Checkbox so toggles stay consistent
 * with the rest of the dark UI.
 */
export function ThemedCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  icon,
  disabled = false,
  className,
}: ThemedCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 transition-all",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-red-500/30 hover:bg-white/[0.06]",
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="h-4 w-4 border-white/20 ring-offset-black data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white focus-visible:ring-red-500/40"
      />
      {icon}
      <span className="text-xs text-white/50 transition-colors group-hover:text-white/70">
        {label}
      </span>
    </label>
  );
}

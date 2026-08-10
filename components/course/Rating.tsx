"use client";
import React, { useState } from "react";
import Icon, { type IconStylesProps, type StarStylesProps } from "./Star";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RatingProps extends StarStylesProps, IconStylesProps {
  initialValue?: number;
  color?: string;
  borderColor?: string;
  textColor?: string;
  readonly?: boolean;
  showValue?: boolean;
  onValueChanges?: (value: number) => void;
}

export const Rating: React.FC<RatingProps> = ({
  initialValue = 0,
  size = "medium",
  borderColor = "grey",
  textColor = "grey",
  icon,
  readonly = false,
  showValue = false,
  color,
  onValueChanges,
}) => {
  const [starsValue, setStarsValue] = useState<number>(initialValue);
  const [valueAlreadySelected, setValueAlreadySelected] = useState(readonly);
  useEffect(() => {
    console.log("Value changed to", starsValue);
    if (onValueChanges != undefined) {
      onValueChanges(starsValue);
    }
  }, [starsValue, onValueChanges]);

  return (
    <div className="flex items-center">
      {Array.from(Array(5).keys()).map((_, index) => (
        <Icon
          icon={icon}
          borderColor={borderColor}
          color={!color ? "orange" : color}
          setAlreadySelectedValue={setValueAlreadySelected}
          alreadySelectedValue={valueAlreadySelected}
          key={index}
          size={size}
          changeStarValue={setStarsValue}
          currentStarsValue={starsValue}
          value={index + 1}
        />
      ))}
      {showValue && (
        <h1
          style={{ color: !color ? "orange" : color }}
          className={cn("pl-2 text-sm color font-bold ")}
        >
          {starsValue.toFixed(1)}
        </h1>
      )}
    </div>
  );
};

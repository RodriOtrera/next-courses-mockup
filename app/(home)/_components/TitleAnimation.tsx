"use client";
import React from "react";
import { twMerge } from "tailwind-merge";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TitleTextProps {
  title: string;
  classname?: string;
  delay?: number;
}

const TitleText: React.FC<TitleTextProps> = ({
  title,
  classname,
  delay = 0.5,
}) => {
  return (
    <div className=" relative overflow-hidden py-2">
      <motion.h2
        transition={{ duration: 0.8, delay: delay, type: "tween" }}
        initial={{
          top: "150px",
        }}
        animate={{
          top: 0,
        }}
        className={cn(
          "  relative text-5xl font-bold  tracking-wide text-[#B7AB98] md:text-7xl xl:text-8xl  2xl:text-9xl ",
          classname
        )}
      >
        {title}
      </motion.h2>
    </div>
  );
};

export default TitleText;

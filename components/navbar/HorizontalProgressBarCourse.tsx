"use client";
import useWindowDimensions from "@/lib/utils/useWindowDimensions";
import { motion } from "motion/react";

interface HorizontalProgressBarProps {
  percentage: number;
  thickness: number;
  maxWidth?: number;
}

const HorizontalProgressBar: React.FC<HorizontalProgressBarProps> = ({
  percentage,
  thickness,
  maxWidth,
}) => {
  const { width } = useWindowDimensions();

  return (
    <div className=" relative mt-2 h-3">
      <div className="flex flex-row items-center">
        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width:
              maxWidth == undefined
                ? (width - 70) * percentage
                : maxWidth * percentage,
          }}
          className={`absolute  h-3 rounded-xl bg-red-500  duration-500 ease-out`}
        />
        <div className="h-3 w-[100%] mr-2 rounded-xl bg-[#464646]" />
        <h1 className="pl-2 w-6 text-xs font-bold text-red-500 mr-2">
          {(percentage * 100).toFixed(1)}%
        </h1>
      </div>
    </div>
  );
};

export default HorizontalProgressBar;

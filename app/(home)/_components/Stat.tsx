"use client;";
import React from "react";
import HorizontalProgressBar from "./horizontal_progressbar";

interface StatProps {
  title: string;
  percentage: number;
  percentageColor: string;
}
//This is the stat
const Stat: React.FC<StatProps> = ({ title, percentage, percentageColor }) => {
  return (
    <div className="mt-2  ">
      <h1
        className={`text-start text-[10px] font-bold tracking-[2px] text-slate-400 `}
      >
        {title == "" ? "Habilidad" : title.toUpperCase()}
      </h1>
      <HorizontalProgressBar
        color={percentageColor}
        percentage={percentage}
        percentageColor={percentageColor}
      />
    </div>
  );
};

export default Stat;

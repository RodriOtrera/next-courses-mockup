import React from "react";
import { twMerge } from "tailwind-merge";
import { pageStyles } from "./pagestyles";

interface HoverTextProps {
  title: string;
  classname?: string;
  childTextComponent: React.ReactNode;
  titleClassname?: string;
}

const HoverText: React.FC<HoverTextProps> = ({
  title,
  classname,
  titleClassname,
  childTextComponent,
}) => {
  return (
    <div
      className={`flex h-screen flex-col justify-around ${pageStyles.padding}`}
    >
      <div className="flex justify-center">
        <div className="  h-0 w-[300px]  rounded-lg bg-[#2b2823]" />
      </div>
      <div>
        <p
          className={twMerge(
            "tracking-wide font-semibold mb-8 self-start text-left text-2xl text-[#ff4e4e]",
            titleClassname
          )}
        >
          {title.toUpperCase()}
        </p>
        <div
          className={twMerge(
            "h-[400px] text-xl font-semibold leading-[35px] md:text-3xl md:leading-[45px] lg:text-4xl lg:text-[3rem] lg:leading-[70px]",
            classname
          )}
        >
          {childTextComponent}
        </div>
      </div>
    </div>
  );
};

export default HoverText;

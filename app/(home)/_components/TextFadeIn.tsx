import React, { useState } from "react";
import { motion, useScroll, type Variants } from "motion/react";
import { twMerge } from "tailwind-merge";

interface TextFadeInProps {
  text: string;
  className?: string;
  delay: number;
  viewport?: number;
  extraDelay?: number;
}

const variantsAnimation: Variants = {
  initial: { scale: 0.94, filter: "blur(4px)", opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
  },
};
const TextFadeIn: React.FC<TextFadeInProps> = ({
  text,
  className,
  delay,
  extraDelay,
  viewport = 1,
}) => {
  const listOfText: string[] = text.split(" ");
  const [variant, setVariant] = useState(false);

  return (
    <motion.section
      className=" flex flex-wrap justify-center"
      viewport={{ amount: viewport }}
      onViewportEnter={() => {
        setVariant(true);
      }}
    >
      {...listOfText.map((text, index) => (
        <motion.p
          initial="initial"
          variants={variantsAnimation}
          animate={variant ? "animate" : "initial"}
          transition={{
            delay: delay * (extraDelay ? index + extraDelay : index),
            duration: 0.6,
            ease: "easeInOut",
          }}
          className={twMerge("mr-1 inline-block  text-[#afa18f]", className)}
          key={index}
        >
          {text}
        </motion.p>
      ))}
    </motion.section>
  );
};

export default TextFadeIn;

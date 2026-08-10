"use client";
import { useInView } from "motion/react";
import { useState, useEffect, useRef } from "react";

const Typewriter = ({
  text,
  speed,
  className,
}: {
  text: string;
  speed: number;
  className: string;
}) => {
  const [displayText, setDisplayText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (isInView) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText((prevText) => prevText + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
    } else {
      setDisplayText("");
    }
  }, [isInView, text, speed]);

  return (
    <p ref={ref} className={className}>
      {displayText}
    </p>
  );
};

export default Typewriter;

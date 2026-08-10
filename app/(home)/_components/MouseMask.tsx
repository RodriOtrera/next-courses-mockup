"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import HoverText from "./HoverText";
import useMousePosition from "../hooks/useMousePosition";

const MouseMask = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y } = useMousePosition();
  const size = isHovered ? 400 : 40;
  return (
    <motion.div
      className="mask z-15  min-h-[500vh]"
      transition={{ type: "tween", ease: "backOut" }}
      // Unprefixed: Motion v12 tightened its animate types and no longer
      // accepts `WebkitMaskSize`. Standard mask-size/mask-position are
      // supported everywhere this app targets, and globals.css already pairs
      // prefixed with unprefixed for `.mask-image`.
      animate={{
        maskSize: `${size}px`,
        maskPosition: `${x - size / 2}px ${y - size / 2}px`,
      }}
    >
      <div className="h-screen" />
      <div>
        <HoverText
          titleClassname="text-black"
          classname="text-black"
          title="Quien soy?"
          childTextComponent={
            <p
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Esta disciplina me dio razón de vivir, me enseñó valores y
              principios para una vida plena, y me ayudó a comprender que el
              éxito reside en ayudar a los demás.
            </p>
          }
        />
      </div>

      <div className="h-screen" />
      <div>
        <HoverText
          titleClassname="text-black"
          childTextComponent={
            <p
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Quiero ayudarte a que aproveches tu potencial para alcanzar esos
              objetivos dentro de la disciplina. Mediante mis programas de
              entrenamiento, Ebooks, y capacitaciones para todos los niveles.
              Aquí vas a encontrar una guía para tu camino.
            </p>
          }
          title="Objetivo"
        />
      </div>
    </motion.div>
  );
};

export default MouseMask;

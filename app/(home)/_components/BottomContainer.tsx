"use client";
import Link from "next/link";
import { pageStyles } from "./pagestyles";
import localfont from "next/font/local";
import TextFadeIn from "./TextFadeIn";
const RoadRage = localfont({ src: "../../app/font/Road_Rage.otf" });

const BottomContainer = () => {
  return (
    <div
      className={`relative flex h-screen flex-col items-center justify-center overflow-hidden  ${pageStyles.padding} `}
    >
      <TextFadeIn
        delay={0.8}
        viewport={0.8}
        text="¿ESTAS PREPARADO?"
        className="mb-5 mr-6 text-3xl md:text-5xl tracking-wide text-red-500 lg:text-8xl font-bold text-center"
      />

      <p className=" py-1 text-lg  md:text-xl text-center mt-8">
        {`¿Estás preparado para romper tus falsos límites? ¿Estás preparado para alcanzar tu máximo potencial, para cada día estar más cerca de tu mejor versión, para conseguir tus objetivos dentro de la Calistenia, para dominar la Plancha, el Front Lever, la Vertical aun brazo, y mucho más? Entonces dale click al botón que dice "SUPERA TUS LÍMITES" y comencemos juntos este camino hacia tus metas!.
`}
      </p>
      {/* <TextFadeIn
        delay={0.12}
        extraDelay={4}
        text={` ¿Estás preparado para romper tus falsos límites? ¿Estás preparado para alcanzar tu máximo potencial, para cada día estar más cerca de tu mejor versión, para conseguir tus objetivos dentro de la Calistenia, para dominar la Plancha, el Front Lever, la Vertical aun brazo, y mucho más? Entonces dale click al botón que dice "SUPERA TUS LÍMITES" y comencemos juntos este camino hacia tus metas!.`}
        className=" py-1 text-lg  md:text-xl "
      /> */}

      <Link
        href="/productos"
        className={`relative md:text-xl text-center mt-12 z-20 w-[250px]  md:w-[400px] rounded-full border border-red-500 px-4 py-4 lg:text-3xl tracking-wide text-red-500 hover:bg-[#3f0000]  ${RoadRage.className}`}
      >
        SUPERA TUS LIMITES
      </Link>
    </div>
  );
};

export default BottomContainer;

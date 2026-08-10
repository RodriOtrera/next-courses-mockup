"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { featuredCoursePath } from "@/lib/seo/site";

interface Slide {
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
}

const slides: Slide[] = [
  {
    image: "/hero-curso.jpeg",
    title: "CURSO DE INSTRUCTOR DE CALISTENIA",
    description:
      "Formá tu carrera como instructor profesional de calistenia con el mejor programa de capacitación.",
    buttonText: "ADQUIRIR EL CURSO",
    buttonHref: featuredCoursePath(),
  },
  {
    image: "/IMG_0406.JPEG",
    title: "COACHING PERSONALIZADO",
    description:
      "Entrenamiento a medida con seguimiento profesional para alcanzar tus objetivos.",
    buttonText: "SER PARTE",
    buttonHref: "/coaching",
  },
];

const INTERVAL = 6000;

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl font-black uppercase leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-4 text-base text-neutral-300 sm:text-lg md:text-xl max-w-lg">
                {slide.description}
              </p>
              <motion.div
                className="mt-8 inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link
                  href={slide.buttonHref}
                  className="group relative inline-block overflow-hidden bg-red-600 px-10 py-4 font-black text-lg uppercase tracking-widest text-white border-none"
                >
                  <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center gap-3 group-hover:text-black transition-colors duration-300">
                    {slide.buttonText}
                    <svg
                      className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-3 w-3 rounded-full transition-all ${
              i === current ? "bg-red-500 w-8" : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeTestimonial } from "@/lib/db/schema/home_testimonials";
import { LaurelWreath } from "@/components/spartan";
import { YoutubePlayerCourse } from "./YoutubeVideo";

const redFilter =
  "brightness(0) saturate(100%) invert(19%) sepia(86%) saturate(5765%) hue-rotate(355deg) brightness(100%) contrast(95%)";

function StackedCard({
  testimonial,
  index,
  total,
  active,
}: {
  testimonial: HomeTestimonial;
  index: number;
  total: number;
  active: number;
}) {
  const offset = index - active;

  // Only render cards near the active one
  if (offset < 0 || offset > 3) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{
        opacity: offset === 0 ? 1 : 0.6 - offset * 0.15,
        scale: 1 - offset * 0.05,
        y: offset * 16,
        zIndex: total - offset,
      }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute inset-0"
    >
      <div className="h-full border border-white/[0.06] bg-[#0e0e0e] overflow-hidden flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-[280px] h-[200px] sm:h-auto shrink-0">
          <Image
            src={testimonial.user_img_url}
            alt={testimonial.user_name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0e0e0e]/80 hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent sm:hidden" />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center p-6 sm:p-10">
          <Quote className="mb-4 h-6 w-6 text-red-500/50" />

          <p className="text-base sm:text-lg leading-relaxed text-neutral-300 mb-6">
            &ldquo;{testimonial.content}&rdquo;
          </p>

          <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-red-500/30">
              <Image
                src={testimonial.user_img_url}
                alt={testimonial.user_name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <span className="block text-sm font-bold uppercase tracking-wide text-white">
                {testimonial.user_name}
              </span>
              <span className="text-xs text-neutral-500">Alumno</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* Reusable stacked cards + navigation (used in both sections) */
export function TestimonialCards({
  testimonials,
  cardHeight = "h-[400px] sm:h-[280px]",
}: {
  testimonials: HomeTestimonial[];
  cardHeight?: string;
}) {
  const [active, setActive] = useState(0);

  if (testimonials.length === 0) return null;

  const prev = () =>
    setActive((a) => (a > 0 ? a - 1 : testimonials.length - 1));
  const next = () =>
    setActive((a) => (a < testimonials.length - 1 ? a + 1 : 0));

  return (
    <div>
      <div className={`relative ${cardHeight}`}>
        <AnimatePresence mode="popLayout">
          {testimonials.map((t, i) => (
            <StackedCard
              key={t.id}
              testimonial={t}
              index={i}
              total={testimonials.length}
              active={active}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 bg-red-500"
                  : "w-3 bg-white/10 hover:bg-white/20"
              }`}
              aria-label={`Testimonio ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03] hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4 text-neutral-400" />
          </button>
          <button
            onClick={next}
            className="flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03] hover:border-red-500/40 hover:bg-red-500/10 transition-all duration-300"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsStacked({
  testimonials,
  videoId,
}: {
  testimonials: HomeTestimonial[];
  videoId?: string;
}) {
  if (testimonials.length === 0 && !videoId) return null;

  return (
    <section className="relative overflow-hidden bg-[#050505] py-20 md:py-28">
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 md:px-12 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div style={{ filter: redFilter }}>
              <LaurelWreath size={32} className="opacity-50" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">
              Testimonios
            </span>
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-black uppercase text-white">
            Lo que dicen nuestros alumnos
          </h2>
          <div className="mt-4 h-[2px] w-12 bg-red-500 rounded-full" />
        </motion.div>
      </div>

      {/* Stacked cards */}
      {testimonials.length > 0 && (
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <TestimonialCards testimonials={testimonials} />
        </div>
      )}

      {/* Video de testimonios */}
      {videoId && (
        <div className="mx-auto max-w-4xl px-6 md:px-12 mt-16 flex flex-col items-center">
          <h3 className="text-2xl md:text-4xl font-black uppercase text-white mb-2">
            Video de testimonios
          </h3>
          <div className="h-[2px] w-12 bg-red-500 rounded-full mb-10" />
          <YoutubePlayerCourse videoId={videoId} />
        </div>
      )}
    </section>
  );
}

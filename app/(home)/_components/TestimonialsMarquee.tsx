"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Quote } from "lucide-react";
import type { HomeTestimonial } from "@/lib/db/schema/home_testimonials";
import { LaurelWreath } from "@/components/spartan";

function TestimonialCard({ testimonial }: { testimonial: HomeTestimonial }) {
  return (
    <div className="group relative mx-3 w-[340px] shrink-0 border border-white/[0.06] bg-[#0a0a0a] p-6 transition-colors duration-300 hover:border-red-500/30">
      {/* Quote icon */}
      <Quote className="mb-4 h-5 w-5 text-red-500/40" />

      {/* Content */}
      <p className="text-sm leading-relaxed text-neutral-400 line-clamp-4">
        {testimonial.content}
      </p>

      {/* Author */}
      <div className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/[0.1]">
          <Image
            src={testimonial.user_img_url}
            alt={testimonial.user_name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <span className="block text-sm font-semibold text-white">
            {testimonial.user_name}
          </span>
          <span className="text-[11px] text-neutral-600">Alumno</span>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsMarquee({
  testimonials,
}: {
  testimonials: HomeTestimonial[];
}) {
  if (testimonials.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="relative overflow-hidden bg-[#050505] py-20 md:py-28">
      {/* Section header */}
      <div className="mx-auto max-w-7xl px-6 md:px-12 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div style={{ filter: "brightness(0) saturate(100%) invert(19%) sepia(86%) saturate(5765%) hue-rotate(355deg) brightness(100%) contrast(95%)" }}>
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

      {/* Marquee */}
      <div className="relative">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#050505] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#050505] to-transparent" />

        <motion.div
          className="flex"
          animate={{ x: [0, -(testimonials.length * 364)] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: testimonials.length * 8,
              ease: "linear",
            },
          }}
        >
          {doubled.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} testimonial={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SpartanHelmet } from "@/components/spartan";
import { featuredCoursePath } from "@/lib/seo/site";

interface Product {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  accent?: string;
  span?: string;
}

const products: Product[] = [
  {
    title: "CURSO DE INSTRUCTOR",
    subtitle: "Formación profesional en calistenia con certificación oficial",
    href: featuredCoursePath(),
    image: "/hero-curso.jpeg",
    span: "md:col-span-4 md:row-span-2",
  },
  {
    title: "COACHING",
    subtitle: "Entrenamiento personalizado con seguimiento profesional",
    href: "/coaching",
    image: "/hero-coaching.jpeg",
    span: "md:col-span-2",
  },
  {
    title: "EBOOKS",
    subtitle: "Guías completas de entrenamiento y nutrición",
    href: "/productos",
    image: "/ebooks.jpeg",
    span: "md:col-span-2",
  },
  {
    title: "OTROS CURSOS",
    subtitle: "Explorá más opciones de formación en calistenia",
    href: "/productos",
    image: "/otros-cursos.jpeg",
    span: "md:col-span-3",
  },
  {
    title: "PROGRAMAS",
    subtitle: "Planes estructurados para cada nivel",
    href: "/productos",
    image: "/programas.jpeg",
    span: "md:col-span-3",
  },
];

export function FeaturedProducts() {
  return (
    <section className="relative bg-[#050505] py-20 md:py-28">
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
              <SpartanHelmet size={28} className="opacity-60" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">
              Productos
            </span>
          </div>
          <h2 className="mt-3 text-3xl md:text-5xl font-black uppercase text-white">
            Elegí tu camino
          </h2>
          <div className="mt-4 h-[2px] w-12 bg-red-500 rounded-full" />
        </motion.div>
      </div>

      {/* Bento grid */}
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 auto-rows-[240px] md:auto-rows-[220px]">
          {products.map((product, i) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={product.span || ""}
            >
              <Link
                href={product.href}
                className="group relative block h-full w-full overflow-hidden border border-white/[0.06] bg-[#0a0a0a]"
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20 transition-opacity duration-500 group-hover:from-black group-hover:via-black/80" />

                {/* Red line accent on hover */}
                <div className="absolute top-0 left-0 h-[2px] w-0 bg-red-500 transition-all duration-500 group-hover:w-full" />

                {/* Content */}
                <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
                  <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className="text-lg md:text-2xl font-black uppercase tracking-wide text-white">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-400 max-w-sm leading-relaxed opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                      {product.subtitle}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.05] opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:bg-red-500 group-hover:border-red-500">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

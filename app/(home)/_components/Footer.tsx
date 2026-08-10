import React from "react";
import Link from "next/link";
import { Instagram, Phone, Youtube, ArrowUpRight, Mail } from "lucide-react";

const socialLinks = [
  {
    href: "https://www.instagram.com/axeel_dubin/",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://www.youtube.com/@axeel_dubin",
    label: "YouTube",
    icon: Youtube,
  },
  {
    href: "https://wa.me/message/VXF6JNGEW5FNP1",
    label: "WhatsApp",
    icon: Phone,
  },
];

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/productos", label: "Productos" },
  { href: "/coaching", label: "Coaching" },
];

const Footer = () => {
  return (
    <footer className="relative bg-[#0a0a0a] overflow-hidden">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8">
        {/* Main footer content */}
        <div className="py-16 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-wide text-white">
                AXEL DUBIN
              </h2>
              <div className="h-[2px] w-10 bg-red-500 mt-3 rounded-full" />
            </div>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
              Atleta e instructor de Calistenia profesional. Formando atletas y
              transformando vidas desde 2018.
            </p>

            {/* Social icons row */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex items-center justify-center w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.03] hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
                >
                  <social.icon className="w-[18px] h-[18px] text-neutral-500 group-hover:text-red-400 transition-colors duration-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation column */}
          <div className="md:col-span-3 md:col-start-7">
            <h3 className="text-xs font-bold tracking-[0.2em] text-neutral-500 uppercase mb-5">
              Navegacion
            </h3>
            <nav aria-label="Footer">
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white transition-colors duration-200"
                    >
                      <span className="h-px w-3 bg-neutral-700 group-hover:w-5 group-hover:bg-red-500 transition-all duration-300" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact / CTA column */}
          <div className="md:col-span-4 md:col-start-10">
            <h3 className="text-xs font-bold tracking-[0.2em] text-neutral-500 uppercase mb-5">
              Contacto
            </h3>
            <div className="space-y-4">
              <a
                href="https://wa.me/message/VXF6JNGEW5FNP1"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition-colors" />
                Escribime por WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-y-0.5 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300 text-red-400" />
              </a>
              <a
                href="https://www.instagram.com/axeel_dubin/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors duration-200"
              >
                <Instagram className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition-colors" />
                @axeel_dubin
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-y-0.5 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300 text-red-400" />
              </a>
            </div>

            {/* Mini CTA */}
            <Link
              href="/coaching"
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 text-xs font-bold tracking-widest uppercase bg-red-500 text-black rounded hover:bg-red-400 transition-colors duration-200"
            >
              Empezar ahora
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} Axel Dubin. Todos los derechos
            reservados.
          </p>
          <p className="text-xs text-neutral-700">
            Atleta e instructor profesional
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

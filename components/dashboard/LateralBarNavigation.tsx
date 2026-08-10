"use client";
import React, { useState, useEffect } from "react";
import UserDashboard from "./UserDashboard";
import DashboardNavigationItem from "./DashboarNavigationItem";
import {
  BookOpenIcon,
  CreditCard,
  Crown,
  FileTextIcon,
  HomeIcon,
  Library,
  MailIcon,
  MessageCircleIcon,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

const LateralBarNavigation = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const mainNav = [
    { icon: <HomeIcon className="w-4 h-4" />, title: "Inicio", href: "/dashboard" },
    { icon: <BookOpenIcon className="w-4 h-4" />, title: "Cursos", href: "/dashboard/cursos" },
    { icon: <Crown className="w-4 h-4" />, title: "Coachings", href: "/dashboard/coaching" },
    { icon: <CreditCard className="w-4 h-4" />, title: "Suscripciones", href: "/dashboard/subscripciones" },
  ];

  const contentNav = [
    { icon: <MailIcon className="w-4 h-4" />, title: "Email", href: "/dashboard/email" },
    { icon: <MessageCircleIcon className="w-4 h-4" />, title: "Testimonios", href: "/dashboard/testimonios" },
    { icon: <FileTextIcon className="w-4 h-4" />, title: "Ebook", href: "/dashboard/ebook" },
    { icon: <Library className="w-4 h-4" />, title: "Programas", href: "/dashboard/program" },
    { icon: <Trophy className="w-4 h-4" />, title: "Gamificación", href: "/dashboard/gamificacion" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-sm font-medium text-neutral-300">Admin</span>
        <div className="w-8" />
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
          w-[220px] h-screen
          bg-neutral-950 border-r border-neutral-800/50
          flex flex-col
          transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-1">
          <p className="text-[13px] font-semibold text-red-400">Axel Dubin</p>
          <p className="text-[9px] text-neutral-600 tracking-widest uppercase">Admin</p>
        </div>

        <div className="mx-4 my-3 h-px bg-neutral-800/50" />

        <div className="px-2">
          <UserDashboard />
        </div>

        {/* Navigation */}
        <div className="px-2 mt-4 flex-1 overflow-y-auto">
          <p className="px-3 mb-1.5 text-[9px] font-medium text-neutral-600 tracking-[0.15em] uppercase">
            Principal
          </p>
          <nav className="space-y-px">
            {mainNav.map((item) => (
              <DashboardNavigationItem
                key={item.href}
                icon={item.icon}
                title={item.title}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </nav>

          <p className="px-3 mt-5 mb-1.5 text-[9px] font-medium text-neutral-600 tracking-[0.15em] uppercase">
            Contenido
          </p>
          <nav className="space-y-px">
            {contentNav.map((item) => (
              <DashboardNavigationItem
                key={item.href}
                icon={item.icon}
                title={item.title}
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default LateralBarNavigation;

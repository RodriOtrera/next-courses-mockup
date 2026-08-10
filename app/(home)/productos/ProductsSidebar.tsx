"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Crown,
  Dumbbell,
  GraduationCap,
  Home,
  LogIn,
  Menu,
  User,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth/client";
import Image from "next/image";

const sidebarLinks = [
  {
    icon: Home,
    label: "Inicio",
    href: "/",
  },
  {
    icon: User,
    label: "Mis Cursos",
    href: "#mis-cursos",
  },
  {
    icon: Crown,
    label: "Mi Coaching",
    href: "#mi-coaching",
  },
  {
    icon: GraduationCap,
    label: "Cursos",
    href: "#cursos",
  },
  {
    icon: BookOpen,
    label: "Ebooks",
    href: "#ebooks",
  },
  {
    icon: Dumbbell,
    label: "Programas",
    href: "#programas",
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;

  const handleClick = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
      onNavigate?.();
    }
  };

  return (
    <div className="flex h-full flex-col py-6">
      <div className="px-6 mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold text-white">Productos</span>
        </Link>
      </div>

      <nav className="flex flex-col space-y-1 px-4">
        {sidebarLinks.map((link) => {
          const isExternal = !link.href.startsWith("#");
          const isActive = isExternal && pathname === link.href;

          if (isExternal) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className={twMerge(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-500/10 text-red-500"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          }

          return (
            <button
              key={link.href}
              onClick={() => handleClick(link.href)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Account at bottom */}
      <div className="mt-auto border-t border-neutral-800 px-4 pt-4">
        {!isPending && user ? (
          <Link
            href="/productos/micuenta"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-neutral-800"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "Avatar"}
                width={28}
                height={28}
                className="rounded-full shrink-0"
              />
            ) : (
              <User className="h-5 w-5 text-neutral-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name ?? "Mi cuenta"}
              </p>
              <p className="text-[11px] text-neutral-500 truncate">
                {user.email}
              </p>
            </div>
          </Link>
        ) : !isPending ? (
          <Link
            href="/login"
            onClick={() => onNavigate?.()}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <LogIn className="h-5 w-5" />
            Iniciar sesion
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function ProductsSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-neutral-800 bg-[#0a0a0a]">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 bottom-4 z-50 h-12 w-12 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 border-neutral-800 bg-[#0a0a0a] p-0"
        >
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

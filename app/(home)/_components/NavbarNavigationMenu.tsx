"use client";
import { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const navLinks = [
  { href: "/", label: "HOME" },
  { href: "/productos", label: "PRODUCTOS" },
  { href: "/coaching", label: "COACHING" },
];

const linkClass =
  "group inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-wide transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20";

// "MIS CURSOS" is the user's personal entry point, so it gets an outlined pill
// instead of a plain link to stand apart from the rest of the navigation.
const triggerClass =
  "group h-9 gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-white/[0.08] hover:text-white focus:bg-white/[0.08] focus:text-white data-[state=open]:bg-white/[0.08] data-[state=open]:text-white";

const NavbarNavigationMenu = ({
  isSignedIn,
  children,
}: {
  isSignedIn: boolean;
  children: ReactNode;
}) => {
  const pathname = usePathname();

  return (
    <div className="hidden flex-1 justify-center xl:flex">
      <NavigationMenu>
        <NavigationMenuList className="gap-0.5">
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.href}>
              <NavigationMenuLink asChild active={pathname === link.href}>
                <Link
                  href={link.href}
                  className={twMerge(
                    linkClass,
                    pathname === link.href ? "text-white" : "text-neutral-500"
                  )}
                >
                  {link.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

          {isSignedIn && (
            <>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={triggerClass}>
                  <GraduationCap className="h-4 w-4 text-[#EC4E39]" />
                  MIS CURSOS
                </NavigationMenuTrigger>
                <NavigationMenuContent>{children}</NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild active={pathname === "/micuenta"}>
                  <Link
                    href="/micuenta"
                    className={twMerge(
                      linkClass,
                      pathname === "/micuenta"
                        ? "text-white"
                        : "text-neutral-500"
                    )}
                  >
                    MI CUENTA
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default NavbarNavigationMenu;

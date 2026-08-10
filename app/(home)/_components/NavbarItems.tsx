"use client";
import { CourseProgressContainer } from "@/components/navbar/CourseProgressContainer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import styles from "./components.module.css";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
const NavbarItems = ({
  user,
  children,
}: {
  user: { id: string } | null;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogRegisterOpen, setDialogRegisterOpen] = useState(false);

  // console.log(session);
  return (
    <div
      className={twMerge(
        "relative flex flex-col items-end space-y-2 pointer-events-auto",
        styles.navbarRight
      )}
    >
      <Link
        className={twMerge(
          " transition hover:text-white font-semibold text-sm md:text-md",
          pathname == "/" ? "text-[#dbcdb7]" : "text-[#999999]"
        )}
        href={"/"}
      >
        HOME
      </Link>
      <Link
        className={twMerge(
          " transition hover:text-white font-semibold text-sm md:text-md",
          pathname == "/productos" ? "text-[#dbcdb7]" : "text-[#999999]"
        )}
        href={"/productos"}
      >
        PRODUCTOS
      </Link>

      <div className="flex">
        {!!user ? (
          <Link
            href="/micuenta"
            className={twMerge(
              "cursor-pointer tracking-wide text-[#999999] transition hover:text-white font-semibold text-sm md:text-md",
              pathname == "/micuenta" && "text-[#dbcdb7]"
            )}
          >
            MI CUENTA
          </Link>
        ) : (
          <Link
            href="/signup"
            className="bg-transparent cursor-pointer tracking-wide text-[#999999] transition hover:text-white font-semibold text-sm md:text-md"
          >
            REGISTRARSE
          </Link>
        )}
        {!user && <p className="text-[#999999] mx-1">/</p>}
        {!user && (
          <Link
            href="/login"
            className="bg-transparent cursor-pointer tracking-wide text-[#999999] transition hover:text-white font-semibold text-sm md:text-md"
          >
            INGRESAR
          </Link>
        )}
      </div>

      <Link
        className={twMerge(
          " transition hover:text-white font-semibold text-sm md:text-md",
          pathname == "/coaching" ? "text-[#dbcdb7]" : "text-[#999999]"
        )}
        href={"/coaching"}
      >
        COACHING
      </Link>
      {children}
    </div>
  );
};

export default NavbarItems;

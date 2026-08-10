"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth/client";
import { Dumbbell, HomeIcon, MenuIcon, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NavbarLogo from "./NavbarLogo";

export function LateralMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();

  const links = [
    { href: "/", icon: HomeIcon, label: "HOME" },
    { href: "/productos", icon: ShoppingBag, label: "PRODUCTOS" },
    { href: "/coaching", icon: Dumbbell, label: "COACHING" },
    ...(user != null
      ? [{ href: "/micuenta", icon: UserRound, label: "MI CUENTA" }]
      : []),
  ];

  return (
    <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-white/10 bg-white/[0.04] text-neutral-400 hover:bg-white/[0.08] hover:text-white"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle>
            <NavbarLogo />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegacion
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-1">
          {links.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSheetOpen(false)}
              className="group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <Icon
                className="text-neutral-600 transition-colors group-hover:text-[#EC4E39]"
                size={20}
              />
              {label}
            </Link>
          ))}
        </div>

        <SheetFooter className="flex flex-1">
          {user == null ? (
            <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-2.5">
              <Link
                href="/signup"
                onClick={() => setSheetOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-black transition-colors hover:bg-neutral-200"
              >
                REGISTRARSE
              </Link>
              <Link
                href="/login"
                onClick={() => setSheetOpen(false)}
                className="flex w-full items-center justify-center rounded-xl border border-white/10 px-4 py-3.5 text-sm font-semibold tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                INGRESAR
              </Link>
            </div>
          ) : (
            <button
              onClick={async () => {
                setSheetOpen(false);
                await authClient.signOut();
                router.push("/");
                router.refresh();
              }}
              className="mt-8 flex w-full cursor-pointer items-center justify-center rounded-xl border border-white/10 px-4 py-3.5 text-sm font-semibold tracking-wide text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              CERRAR SESION
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

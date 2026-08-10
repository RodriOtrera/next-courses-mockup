"use client";
import Image from "next/image";
import Link from "next/link";

import { CourseProgressContainer } from "@/components/navbar/CourseProgressContainer";
import DrawerCourses from "@/components/navbar/DrawerCourses";
import { authClient } from "@/lib/auth/client";
import { getUserCourseProgress } from "@/lib/db/actions/courses_progress_actions";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { LateralMenu } from "./LateralMenu";
import NavbarLogo from "./NavbarLogo";
import NavbarNavigationMenu from "./NavbarNavigationMenu";
import SignOutButton from "./SignOutButton";

const Navbar = () => {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const { data: progress } = useQuery({
    queryKey: ["course-progress", user?.id],
    queryFn: () => getUserCourseProgress(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="fixed inset-x-0 top-3 z-50 px-3 sm:px-5">
      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/[0.06] bg-[#0a0a0a]/80 py-2 pl-4 pr-2 backdrop-blur-xl",
          "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.85)]"
        )}
      >
        <NavbarLogo />

        <NavbarNavigationMenu isSignedIn={user != null}>
          <div className="custom-scrollbar max-h-72 w-[380px] overflow-y-auto px-2 py-3">
            <CourseProgressContainer progress={progress} />
          </div>
        </NavbarNavigationMenu>

        <div className="flex items-center gap-1.5">
          <div className="xl:hidden">
            {user != null && <DrawerCourses progress={progress} />}
          </div>

          {isPending ? (
            // Reserve space while the session resolves so the auth buttons
            // don't flash on navigation.
            <div className="h-10" aria-hidden />
          ) : user != null ? (
            <div className="flex items-center gap-1.5">
              <Link href="/micuenta" className="shrink-0">
                <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-white/10 transition-all duration-300 hover:ring-[#EC4E39]">
                  {user.image ? (
                    <Image
                      fill={true}
                      src={user.image}
                      className="object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-sm font-medium text-neutral-300">
                      {user.name?.charAt(0) ?? "?"}
                    </div>
                  )}
                </div>
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 lg:flex">
              <Link
                href="/login"
                className="flex cursor-pointer items-center justify-center rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-neutral-500 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                INGRESAR
              </Link>
              <Link
                href="/signup"
                className="flex cursor-pointer items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-wide text-black transition-colors duration-200 hover:bg-neutral-200"
              >
                REGISTRARSE
              </Link>
            </div>
          )}

          <div className="xl:hidden">
            <LateralMenu />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

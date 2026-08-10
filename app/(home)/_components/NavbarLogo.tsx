import Link from "next/link";

const NavbarLogo = () => {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <span className="text-lg font-bold tracking-wide text-white">AD</span>
      <span className="hidden h-7 w-px bg-white/10 sm:block" />
      <span className="ff-mono hidden text-[0.58rem] uppercase tracking-[0.18em] text-neutral-500 sm:block">
        Cursos online
      </span>
    </Link>
  );
};

export default NavbarLogo;

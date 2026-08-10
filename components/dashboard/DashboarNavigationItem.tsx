import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardNavigationItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

const DashboardNavigationItem: React.FC<DashboardNavigationItemProps> = ({
  icon,
  title,
  href,
  active = false,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-3 py-2 rounded-lg transition-colors text-left text-[12px]",
        active
          ? "bg-red-500/10 text-red-400"
          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30"
      )}
    >
      <span className="mr-2.5">{icon}</span>
      <span className="font-medium">{title}</span>
    </Link>
  );
};

export default DashboardNavigationItem;

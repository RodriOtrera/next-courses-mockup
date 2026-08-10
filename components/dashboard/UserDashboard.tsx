"use client";
import { authClient } from "@/lib/auth/client";

export default function UserDashboard() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const initial = !isPending && user?.name ? user.name.charAt(0) : "?";
  const fullName = !isPending ? user?.name : undefined;
  const email = !isPending ? user?.email : undefined;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[11px] font-medium text-neutral-300">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-neutral-200 truncate">
          {fullName}
        </p>
        <p className="text-[10px] text-neutral-600 truncate">{email}</p>
      </div>
    </div>
  );
}

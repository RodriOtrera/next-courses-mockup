import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import "../../app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import LateralBarNavigation from "@/components/dashboard/LateralBarNavigation";
import { auth } from "@/lib/auth";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panel",
  // A self-referencing canonical on a private page is worse than nothing: it
  // actively nominates the URL as canonical while nothing tells Google to stay
  // away. Robots directives replace it.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session && process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  return (
    <div
      className={`${montserrat.variable} ${montserrat.className} antialiased font-sans bg-neutral-950 text-white min-h-screen`}
    >
      <div className="flex min-h-screen">
        <LateralBarNavigation />
        <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#171717",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

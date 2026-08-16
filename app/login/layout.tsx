import type { Metadata } from "next";

/**
 * The page itself is a client component and cannot export metadata, so the tab
 * title lives here. `robots` already disallows this path, so this is about the
 * browser tab and history entries, not search.
 */
export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresá a tu cuenta con un código de un solo uso.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

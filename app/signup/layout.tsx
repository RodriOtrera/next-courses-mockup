import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Creá tu cuenta y empezá a aprender hoy.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

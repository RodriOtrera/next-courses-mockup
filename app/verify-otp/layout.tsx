import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar correo",
  description: "Ingresá el código de 6 dígitos que te enviamos.",
};

export default function VerifyOtpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

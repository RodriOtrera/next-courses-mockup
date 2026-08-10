import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "./_components/Navbar";

export default function HomeGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Navbar />
      {children}
      <Toaster position="top-center" />
    </QueryProvider>
  );
}

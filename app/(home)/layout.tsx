import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";

export default function HomeGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Navbar />
      {children}
      {/* `Footer` was fully built but mounted nowhere, so the newsletter opt-in
          and the preferences link it now carries had no surface to appear on. */}
      <Footer />
      <Toaster position="top-center" />
    </QueryProvider>
  );
}

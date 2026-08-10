import { Loader2 } from "lucide-react";

export default function SubscripcionesLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="w-10 h-10 animate-spin" />
    </div>

  );
}
import AdminEditor from "@/app/(home)/admin/AdminEditor";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function CreateEbookPage() {
  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/ebook"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Ebooks
        </Link>
        <h1 className="text-xl font-semibold text-white">
          Crear Ebook <span className="text-red-400">.</span>
        </h1>
      </div>

      <AdminEditor />
    </div>
  );
}

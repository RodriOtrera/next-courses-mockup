"use client";

import { DeleteProgramDialog } from "@/components/program/DeleteProgramDialog";
import { ProgramOutput } from "@/lib/db/actions/products_actions";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DollarSignIcon, LayoutGridIcon } from "lucide-react";

const ProgramDashboardCard = ({
  id,
  title,
  description,
  price,
  img_url,
}: ProgramOutput) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/program/${id}/edit`)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] shadow-sm transition-all hover:shadow-md hover:border-neutral-700"
    >
      <div className="relative aspect-video overflow-hidden">
        <DeleteProgramDialog program_id={id} program_title={title} />

        {img_url && (
          <Image
            src={img_url}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <span className="rounded-lg bg-black/80 px-2.5 py-1 text-sm font-bold text-white flex items-center gap-1">
            <DollarSignIcon className="h-3 w-3" />
            {price.toLocaleString()} ARS
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1.5 line-clamp-1 text-lg font-semibold text-white transition-colors group-hover:text-red-500">
          {title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
          {description}
        </p>

        <div className="pt-3 border-t border-neutral-800 flex items-center">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <LayoutGridIcon className="h-3 w-3" />
            Programa
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgramDashboardCard;

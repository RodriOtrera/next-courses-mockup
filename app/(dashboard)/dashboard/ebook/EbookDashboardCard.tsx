"use client";

import { DeleteEbookDialog } from "@/components/ebook/DeleteEbookDialog";
import { EbookOutput } from "@/lib/db/actions/products_actions";
import { cardColors, KeysOfCardColors } from "@/app/(home)/_components/cardColors";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpenIcon, DollarSignIcon } from "lucide-react";

const EbookDashboardCard = ({
  id,
  title,
  description,
  price,
  img_url,
  card_color,
  stats_names,
  stats_values,
}: EbookOutput) => {
  const router = useRouter();
  const colors = cardColors[card_color as KeysOfCardColors] ?? cardColors.red;

  return (
    <div
      onClick={() => router.push(`/dashboard/ebook/${id}/edit`)}
      className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] shadow-sm transition-all hover:shadow-md hover:border-neutral-700"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <DeleteEbookDialog ebook_id={id} ebook_title={title} />

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

        <div
          className="absolute left-2 bottom-2 h-1.5 w-8 rounded-full"
          style={{ backgroundColor: colors.primaryColor }}
        />
      </div>

      <div className="p-4">
        <h3 className="mb-1.5 line-clamp-1 text-lg font-semibold text-white transition-colors group-hover:text-red-500">
          {title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
          {description}
        </p>

        <div className="space-y-2">
          {(["stat1", "stat2", "stat3"] as const).map((key) => {
            const name = stats_names[key];
            const value = stats_values[key];
            if (!name) return null;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 w-20 truncate">
                  {name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${value}%`,
                      backgroundColor: colors.primaryColor,
                    }}
                  />
                </div>
                <span className="text-[11px] text-neutral-500 w-6 text-right font-mono">
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <BookOpenIcon className="h-3 w-3" />
            Ebook
          </span>
        </div>
      </div>
    </div>
  );
};

export default EbookDashboardCard;

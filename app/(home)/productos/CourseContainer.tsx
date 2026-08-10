"use client";
import { Course } from "@/lib/db/actions/courses/get_courses";
import { DeleteCourseDialog } from "@/components/course/DeleteCourseDialog";
import { AlbumIcon, Clock8Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import PriceTag from "../_components/PriceTag";

const CourseContainer: React.FC<
  PartialBy<Course, "img_url"> & {
    isAdmin?: boolean;
  }
> = ({
  id,
  slug,
  img_url,
  price,
  price_usd,
  title,
  descripcion,
  isAdmin = false,
  modules,
  duracion,
}) => {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        if (isAdmin) {
          router.push(`/editarCurso/${id}`);
          return;
        }
        router.push(`/cursos/${slug}`);
      }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-[18/6] overflow-hidden">
        {isAdmin && <DeleteCourseDialog course_id={id} course_title={title} />}
        {img_url && (
          <Image
            src={img_url}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <PriceTag
          priceArs={price}
          priceUsd={price_usd ?? 0}
          className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-sm font-bold text-white"
        />
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-red-500">
          {title}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-gray-400">
          {descripcion.slice(0, 155)}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <AlbumIcon className="h-3 w-3" />
            {modules.length} Modulos
          </span>
          <span className="flex items-center gap-1">
            <Clock8Icon className="h-3 w-3" />
            {duracion}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseContainer;

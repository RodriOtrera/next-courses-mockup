import { Course } from "@/lib/db/actions/courses/get_courses";
import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Rating } from "./Rating";

const fmt = (n: number) => new Intl.NumberFormat("es-AR").format(n);

const CourseContainer = ({
  id,
  slug,
  price,
  title,
  descripcion,
  duracion,
  isAdmin,
  rating,
  img_url,
}: Course & { isAdmin: boolean }) => {
  const hasRating = rating != null && rating > 0;
  return (
    <Link
      // Public URLs use the slug; admin routes stay keyed on the id.
      href={!isAdmin ? `/cursos/${slug}` : `/editarCurso/${id}`}
      className="ep-card group flex h-full w-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[18/6] overflow-hidden bg-[var(--ep-surface)]">
        {img_url && (
          <Image
            loading="lazy"
            decoding="async"
            src={img_url}
            fill={true}
            alt={title}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="ff-display text-xl text-[var(--ep-fg)]">{title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {hasRating && (
            <Rating
              readonly={true}
              initialValue={rating ?? 0}
              color="#c6ff3e"
              size="small"
              showValue={true}
            />
          )}
          {duracion && (
            <span className="ff-mono flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--ep-muted)]">
              <Clock size={13} />
              {duracion}
            </span>
          )}
        </div>

        <p className="cutoff-text mt-3 flex-1 text-sm leading-6 text-[var(--ep-muted)]">
          {descripcion}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--ep-line)] pt-4">
          {price > 0 ? (
            <span className="ff-display text-lg text-[var(--ep-fg)]">
              ${fmt(price)}
            </span>
          ) : (
            <span className="ff-mono text-xs uppercase tracking-[0.14em] text-[var(--ep-muted)]">
              Consultar
            </span>
          )}

          <span className="ff-mono inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--ep-muted)] transition-colors group-hover:text-[var(--ep-volt)]">
            Ver curso
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseContainer;

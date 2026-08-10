import BeneficiosCurso from "@/components/course/BeneficiosCurso";
import DescripcionCuso from "@/components/course/DescripcionCurso";
import ModuleItemContainer from "@/components/course/ModuleItemContainer";
import PreguntaFrecuenteContainer from "@/components/course/PreguntaFrecuenteContainer";
import TestimonialCarousel from "@/components/course/TestimonialCarousel";
import YoutubePlayerCourse from "@/components/course/YoutubePlayer";
import BackGroundCourse from "@/components/course/backgroundCourse";
import TrackProductView from "@/components/analytics/TrackProductView";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { resolveCourseRoute } from "@/lib/db/queries/courses";
import { SITE, toMetaDescription } from "@/lib/seo/site";
import { buildCourseGraph } from "@/lib/seo/jsonld";
import JsonLd from "@/components/seo/JsonLd";

import { youtube_parser } from "@/lib/utils/youtubeParset";
import { notFound, permanentRedirect } from "next/navigation";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  LightbulbIcon,
  ListVideoIcon,
  MessageCircleHeartIcon,
  PlayCircleIcon,
  SparklesIcon,
  YoutubeIcon,
  CircleHelpIcon,
} from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata(
  props: PageParams<{ slug: string }>
): Promise<Metadata> {
  const { slug } = await props.params;
  // Same cached resolver the page body uses, so this costs no extra query.
  const resolved = await resolveCourseRoute(slug);

  // The page component handles the redirect and the 404; emitting metadata for
  // those branches would just race it.
  if (resolved.kind !== "slug") return {};

  const { course } = resolved;
  const description = toMetaDescription(course.descripcion);
  const path = `/cursos/${course.slug}`;

  return {
    title: course.title,
    description,
    // Root-relative, resolved against the root layout's metadataBase. Literal
    // paths rather than "./" — "./" resolves against the request URL and would
    // echo back a trailing slash, which is exactly what the canonical is here
    // to disambiguate (skipTrailingSlashRedirect is on for the PostHog proxy).
    alternates: { canonical: path },
    openGraph: {
      title: course.title,
      description,
      url: path,
      images: [
        {
          // img_url is nullable; without the fallback an imageless course
          // emitted og:image with url: undefined.
          url: course.img_url ?? SITE.defaultOgImage,
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      type: "website",
    },
  };
}

const CoursePage = async (props: PageParams<{ slug: string }>) => {
  const { slug } = await props.params;

  // Resolved at the very top, before any JSX. `permanentRedirect` degrades to a
  // client-side meta refresh if it runs inside a streaming context, and most
  // crawlers won't follow that — keeping it here guarantees a real HTTP 308.
  const resolved = await resolveCourseRoute(slug);
  if (resolved.kind === "legacy-id") {
    permanentRedirect(`/cursos/${resolved.slug}`);
  }
  if (resolved.kind === "missing") {
    // A thrown Error here would render as a 500, which Google treats as
    // "temporarily broken" and keeps re-crawling. 404 gets it deindexed.
    notFound();
  }

  const course = resolved.course;

  const totalItems = course.modules.reduce(
    (acc, m) => acc + m.items.length,
    0
  );

  return (
    <div className="min-h-screen pt-16">
      <JsonLd data={buildCourseGraph(course)} />
      {/* First step of the purchase funnel. Renders nothing. */}
      <TrackProductView
        productId={course.id}
        productType="course"
        productName={course.title}
        price={course.price}
        currency="ARS"
      />

      {/* Hero Section */}
      <BackGroundCourse {...course} />

      {/* Welcome / Tips Section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex md:flex-row flex-col items-center gap-12">
          <div className="relative h-[300px] w-[250px] rounded-2xl overflow-hidden shrink-0 shadow-2xl shadow-red-500/10 ring-1 ring-white/[0.08]">
            <Image
              fill={true}
              src="https://utfs.io/f/0ff3fccd-2a8d-4b2f-955e-86f74714dfd0-u24bo0.png"
              alt="Curso"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-center md:items-start gap-5">
            <div className="flex items-center gap-2.5">
              <LightbulbIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-lg md:text-xl font-bold text-white/90 tracking-tight">
                Tips para sacarle el maximo provecho
              </h2>
            </div>
            <ul className="space-y-3.5 text-white/50 text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle2Icon className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                Ver los modulos y las clases de forma progresiva sin saltearse
                ninguna
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2Icon className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                Tomar nota y aplicar cada conocimiento aprendido clase tras
                clase
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2Icon className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                Volver a ver todo el contenido una vez finalizado el curso antes
                de rendir el examen
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2Icon className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                Entender que los resultados solo llegaran cuando nos enfocamos
                en cumplir cada dia con el proceso
              </li>
            </ul>
            <span className="bg-gradient-to-r text-transparent bg-clip-text from-red-500 to-orange-400 italic font-extrabold mt-1 text-xl tracking-wide">
              VAMOS CON TODO!
            </span>
          </div>
        </div>
      </section>

      {/* Course Stats Bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-8 md:gap-14">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20">
              <BookOpenIcon className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-neutral-400">
              <strong className="text-white font-bold">{course.modules.length}</strong>{" "}
              Modulos
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20">
              <PlayCircleIcon className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm text-neutral-400">
              <strong className="text-white font-bold">{totalItems}</strong> Clases
            </span>
          </div>
          {course.duracion && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20">
                <ClockIcon className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-white/80 font-semibold">
                {course.duracion}
              </span>
            </div>
          )}
          {course.certifications.length > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600/20">
                <GraduationCapIcon className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm text-neutral-400">
                <strong className="text-white font-bold">Certificacion</strong> incluida
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Modules & Introductory Video — side by side on desktop */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Modules / Classes — left side */}
          <div className="lg:w-1/2 w-full">
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <LayersIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white tracking-tight lg:text-2xl">
                Contenido del curso
              </h2>
              <span className="ml-2 text-xs font-bold text-neutral-400 bg-white/[0.06] px-2.5 py-1 rounded-full">
                {course.modules.length} modulos
              </span>
            </div>
            <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
              {course.modules.map((e, index) => (
                <Accordion type="single" collapsible key={e.id}>
                  <AccordionItem
                    value="item-1"
                    className="border border-white/[0.06] rounded-xl px-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <AccordionTrigger className="text-sm font-semibold text-white/70 hover:text-white/90">
                      <span className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-red-600/20 text-red-500 text-xs font-extrabold shrink-0">
                          {index + 1}
                        </span>
                        {e.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-1">
                        {e.items.map((item, itemIndex) => (
                          <ModuleItemContainer
                            course_id={course.id}
                            module_index={index + 1}
                            index={itemIndex + 1}
                            key={item.id}
                            module_item={item}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>

          {/* Introductory Video — right side */}
          <div className="lg:w-1/2 w-full">
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <ListVideoIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white tracking-tight lg:text-2xl">
                Video introduccion
              </h2>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-neutral-900/50 border border-white/[0.06] sticky top-24 ring-1 ring-white/[0.04]">
              {course.introductory_video != null ? (
                <YoutubePlayerCourse
                  videoId={youtube_parser(course.introductory_video) as string}
                  courseId={course.id}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
                  <YoutubeIcon className="w-14 h-14" />
                  <span className="text-xs font-medium">Video no disponible</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <DescripcionCuso content={course.descripcion} />

      {/* Benefits */}
      <BeneficiosCurso content={course.beneficios} />

      {/* Testimonials Carousel */}
      {course.testimonials.length > 0 && (
        <section className="py-20 overflow-hidden">
          <div className="fade-in-view flex flex-col items-center gap-3 mb-12">
            <div className="flex items-center gap-2.5">
              <MessageCircleHeartIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white tracking-tight lg:text-2xl">
                Lo que dicen nuestros alumnos
              </h2>
            </div>
            <p className="text-sm text-neutral-400">
              {course.testimonials.length} testimonios verificados
            </p>
          </div>
          <TestimonialCarousel testimonials={course.testimonials} />
        </section>
      )}

      {/* FAQ */}
      {course.frequentlyAskedQuestions.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="flex items-center gap-2.5">
              <CircleHelpIcon className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white tracking-tight lg:text-2xl">
                Preguntas Frecuentes
              </h2>
            </div>
            <p className="text-sm text-neutral-400">
              Resolvemos tus dudas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.frequentlyAskedQuestions.map((e, i) => (
              <PreguntaFrecuenteContainer item={e} index={i + 1} key={e.id} />
            ))}
          </div>
        </section>
      )}

      <div className="pb-20" />
    </div>
  );
};

export default CoursePage;

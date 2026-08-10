import BeneficiosCurso from "@/components/course/BeneficiosCurso";
import DescripcionCuso from "@/components/course/DescripcionCurso";
import EditableCourseHero from "@/components/course/EditableCourseHero";
import ModuleItemContainer from "@/components/course/ModuleItemContainer";
import PreguntaFrecuenteContainer from "@/components/course/PreguntaFrecuenteContainer";
import YoutubePlayerCourse from "@/components/course/YoutubePlayer";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { youtube_parser } from "@/lib/utils/youtubeParset";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  ClipboardPlusIcon,
  ClockIcon,
  EyeIcon,
  GraduationCapIcon,
  ImagePlusIcon,
  LayersIcon,
  LightbulbIcon,
  ListVideoIcon,
  PlusCircleIcon,
  PlayCircleIcon,
  Trash2Icon,
  VideoIcon,
  YoutubeIcon,
} from "lucide-react";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { courses } from "@/lib/db/schema/course";
import { Input } from "@/components/ui/input";
import ActualizarDatosModal from "@/components/edit/ActualizarDatos";
import EditFloatingMenu from "@/components/edit/EditFloatingMenu";
import { Button } from "@/components/ui/button";
import { deleteModuleItem } from "@/lib/db/actions/test_action";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import EditDialog from "@/components/edit/EditDialog";
import { modules } from "@/lib/db/schema/modules";
import { Textarea } from "@/components/ui/textarea";
import ModuleModal from "@/components/edit/ModuleModal";
import { frequentlyAskedQuestions } from "@/lib/db/schema/frequently_asked_questions";
import { getCourse } from "@/lib/db/actions/courses/get_courses";
import TestimonialAdminCard from "@/components/edit/TestimonialAdminCard";
import Image from "next/image";
import Link from "next/link";
import { MessageSquareQuoteIcon } from "lucide-react";

import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Editar curso");

const EditarCursoPage = async (
  props: PageParams<{ id: string }>
) => {
  const { id } = await props.params;
  const course = await getCourse(id);

  const totalItems = course.modules.reduce(
    (acc, m) => acc + m.items.length,
    0
  );

  // Shared style for the floating menu action buttons (matches "Crear Examen").
  const menuButtonClass =
    "flex items-center gap-2 text-left border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white";

  return (
    <div className="min-h-screen">
      {/* Hero Section — editable cover image */}
      <EditableCourseHero
        id={course.id}
        title={course.title}
        img_url={course.img_url}
        rating={course.rating}
        duracion={course.duracion}
      />

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
                          <div className="flex items-center" key={item.id}>
                            <ModuleItemContainer
                              admin={true}
                              course_id={course.id}
                              module_index={index + 1}
                              index={itemIndex + 1}
                              module_item={item}
                            />
                            <form action={deleteModuleItem}>
                              <Button className="ml-1 text-red-500/60 hover:text-red-500 hover:bg-red-500/10" variant="ghost" size="icon" type="submit">
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                              <input hidden={true} name="module_id" defaultValue={item.id} />
                              <input hidden={true} name="course_id" defaultValue={course.id} />
                            </form>
                          </div>
                        ))}
                        <ModuleModal module={e} />
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

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="flex items-center gap-2.5">
            <MessageSquareQuoteIcon className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white tracking-tight lg:text-2xl">
              Testimonios
            </h2>
          </div>
          <p className="text-sm text-neutral-400">
            {course.testimonials.length} testimonios de alumnos
          </p>
        </div>
        {course.testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.testimonials.map((t) => (
              <TestimonialAdminCard
                key={t.id}
                testimonial={t}
                courseId={course.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-white/30">
            No hay testimonios aun
          </p>
        )}
      </section>

      {/* FAQ */}
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

      {/* Floating admin menu — all page-level edit controls in one place */}
      <EditFloatingMenu>
        <ActualizarDatosModal course={course} />

        <EditDialog
          buttonClassName={menuButtonClass}
          buttonTitle="Crear Modulo"
          dialogTitle="Nuevo Modulo"
          icon={<PlusCircleIcon className="w-4 h-4 shrink-0 text-red-500" />}
        >
          <form
            className="flex flex-col gap-2"
            action={async (formData: FormData) => {
              "use server";
              await db.insert(modules).values({
                course_id: course.id,
                id: crypto.randomUUID(),
                title: formData.get("name") as string,
              });
              revalidatePath(`/editarCurso/${course.id}`);
            }}
          >
            <Input placeholder="Nombre del modulo" name="name" />
            <DialogFooter>
              <Button type="submit" color="primary">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </EditDialog>

        <EditDialog
          buttonClassName={menuButtonClass}
          buttonTitle="Agregar Video"
          dialogTitle="Video Introductorio"
          icon={<VideoIcon className="w-4 h-4 shrink-0 text-red-500" />}
        >
          <form
            className="flex flex-col gap-4"
            action={async (formData: FormData) => {
              "use server";
              await db
                .update(courses)
                .set({
                  introductory_video: formData.get("video_url") as string,
                })
                .where(eq(courses.id, course.id));
              revalidatePath(`/editarCurso/${course.id}`);
            }}
          >
            <Input placeholder="Video Url" name="video_url" />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="submit" color="primary">
                  Actualizar
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </EditDialog>

        <EditDialog
          buttonClassName={menuButtonClass}
          buttonTitle="Agregar Pregunta Frecuente"
          dialogTitle="Nueva Pregunta frecuente"
          icon={<PlusCircleIcon className="w-4 h-4 shrink-0 text-red-500" />}
        >
          <form
            action={async (formData: FormData) => {
              "use server";
              const question = formData.get("question") as string;
              const response = formData.get("response") as string;

              await db.insert(frequentlyAskedQuestions).values({
                course_id: course.id,
                id: crypto.randomUUID(),
                question,
                response,
              });
              revalidatePath(`/editarCurso/${course.id}`);
            }}
          >
            <Input className="mb-2" placeholder="Pregunta" name="question" />
            <Textarea name="response" placeholder="Respuesta ">
              Respuesta
            </Textarea>
            <DialogFooter>
              <Button type="submit" color="success">
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </EditDialog>

        <form
          action={async () => {
            "use server";
            redirect(`/crearExamen?course_id=${course.id}&`);
          }}
        >
          <button className={menuButtonClass}>
            <ClipboardPlusIcon className="w-4 h-4 shrink-0 text-red-500" />
            Crear Examen
          </button>
        </form>

        {course.exam_id != null && (
          <form
            action={async () => {
              "use server";
              redirect(
                `/examen?course_id=${course.id}&exam_id=${course.exam_id}`
              );
            }}
          >
            <button className={menuButtonClass}>
              <EyeIcon className="w-4 h-4 shrink-0 text-red-500" />
              Ver Examen
            </button>
          </form>
        )}

        <Link
          href={`/editarCurso/${course.id}/preview`}
          className="flex items-center gap-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors rounded-xl px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300"
        >
          <PlayCircleIcon className="w-4 h-4" />
          Vista previa del curso
        </Link>
      </EditFloatingMenu>

      <div className="pb-20" />
    </div>
  );
};

export default EditarCursoPage;

import { getMyEbooks, getMyPrograms } from "@/lib/db/actions/products_actions";
import { getUserCourseProgress } from "@/lib/db/actions/courses_progress_actions";
import { currentUser } from "@/lib/auth/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import CardUI from "../../_components/CardUI";
import Program from "../Program";
import SignOutButton from "../../_components/SignOutButton";
import { ProductsSidebar } from "../ProductsSidebar";
import { TitleOfProduts } from "../../_components/TitleOfProducts";
import { MyCoursesClient } from "../MyCoursesAndCoachingClient";
import { getUserXp } from "@/lib/db/actions/gamification/award_xp";
import XpMeter from "@/components/gamification/XpMeter";
import { noindexMetadata } from "@/lib/seo/private-metadata";

export const metadata = noindexMetadata("Mi cuenta");

export default async function MiCuentaProductosPage() {
  const session = await currentUser();
  if (session === null) return redirect("/");

  const [ebooks, programs, courseProgress, totalXp] = await Promise.all([
    getMyEbooks(session.id),
    getMyPrograms(session.id),
    getUserCourseProgress(session.id),
    getUserXp(session.id),
  ]);

  return (
    <div className="flex min-h-screen pt-16">
      <ProductsSidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10">
        {/* Profile */}
        <div className="flex flex-col gap-5 mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 relative rounded-full overflow-hidden border-2 border-neutral-700 shrink-0">
              {session.image ? (
                <Image
                  fill
                  src={session.image}
                  className="object-cover"
                  alt={session.name ?? "Avatar"}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                  <User className="h-8 w-8 text-neutral-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">{session.name}</h1>
              <p className="text-sm text-neutral-400 truncate">
                {session.email}
              </p>
              <div className="mt-2">
                <SignOutButton />
              </div>
            </div>
          </div>

          <XpMeter totalXp={totalXp} variant="full" />
        </div>

        {/* My courses */}
        <section className="mb-10">
          <TitleOfProduts
            title="MIS CURSOS"
            content="TUS CURSOS COMPRADOS Y TU PROGRESO ACTUAL."
          />
          {courseProgress.length > 0 ? (
            <MyCoursesClient courseProgress={courseProgress} />
          ) : (
            <p className="text-sm text-neutral-500">
              No tienes ningun curso comprado.
            </p>
          )}
        </section>

        {/* Purchased ebooks */}
        <section className="mb-10">
          <TitleOfProduts
            title="MIS EBOOKS"
            content="TUS EBOOKS COMPRADOS DISPONIBLES PARA DESCARGAR."
          />
          {ebooks.length > 0 ? (
            <div className="flex flex-wrap">
              {ebooks.map((e) => (
                <CardUI
                  action={async () => {
                    "use server";
                    redirect(e.pdf_url);
                  }}
                  canBeOpen={false}
                  key={e.id}
                  {...e}
                  downloadLink={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No tienes ningun ebook comprado.
            </p>
          )}
        </section>

        {/* Purchased programs */}
        <section>
          <TitleOfProduts
            title="MIS PROGRAMAS"
            content="TUS PROGRAMAS COMPRADOS DISPONIBLES PARA ACCEDER."
          />
          {programs && programs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((e) => (
                <Program
                  action={async () => {
                    "use server";
                    if (e.pdf_url != undefined) {
                      redirect(e.pdf_url);
                    }
                  }}
                  key={e.id}
                  {...e}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No tienes ningun programa comprado.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

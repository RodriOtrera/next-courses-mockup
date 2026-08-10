import { currentUser } from "@/lib/auth/server";
import { getCoachings } from "@/lib/db/actions/subscription/subscriptions";
import { TitleOfProduts } from "../_components/TitleOfProducts";
import { MyCoachingClient } from "./MyCoursesAndCoachingClient";

export async function MyCoachingSection() {
  const user = await currentUser();
  if (!user) return null;

  const coaching = await getCoachings();
  if (!coaching) return null;

  return (
    <section>
      <TitleOfProduts
        title="MI COACHING"
        content="ACCEDE A TU COACHING ACTIVO Y TODAS SUS SALAS DISPONIBLES."
      />
      <MyCoachingClient coaching={coaching} />
    </section>
  );
}

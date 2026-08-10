import { getXpConfig } from "@/lib/db/actions/gamification/xp_config_actions";
import XpConfigForm from "./XpConfigForm";

export default async function GamificacionPage() {
  const config = await getXpConfig();

  return (
    <div className="min-h-screen py-10 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-black uppercase text-white">
            Gamificación
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Experiencia que gana el alumno por cada logro
          </p>
        </div>

        <XpConfigForm config={config} />
      </div>
    </div>
  );
}

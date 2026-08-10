"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Layers, Loader2, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateXpConfig } from "@/lib/db/actions/gamification/xp_config_actions";
import type { XpConfig } from "@/lib/db/schema/gamification";
import { levelFromXp, levelTable, totalXpForLevel } from "@/lib/gamification/levels";
import XpMeter from "@/components/gamification/XpMeter";

/** Shape of the imaginary course used by the preview. Tunable, not persisted. */
const DEFAULT_SIM_MODULES = 5;
const DEFAULT_SIM_LESSONS = 6;

const REWARDS = [
  {
    key: "lesson_xp",
    label: "Por lección completada",
    hint: "Se otorga una vez por cada ítem de módulo. No se repite si el alumno vuelve a abrirlo.",
    icon: BookOpen,
  },
  {
    key: "module_xp",
    label: "Por módulo completado",
    hint: "Bonus al terminar todas las lecciones de un módulo.",
    icon: Layers,
  },
  {
    key: "course_xp",
    label: "Por curso terminado",
    hint: "Bonus al aprobar el examen final, o al terminar la última lección si el curso no tiene examen.",
    icon: GraduationCap,
  },
] as const;

type RewardKey = (typeof REWARDS)[number]["key"];

const XpConfigForm = ({ config }: { config: XpConfig }) => {
  const [values, setValues] = useState<Record<RewardKey, number>>({
    lesson_xp: config.lesson_xp,
    module_xp: config.module_xp,
    course_xp: config.course_xp,
  });
  const [simModules, setSimModules] = useState(DEFAULT_SIM_MODULES);
  const [simLessons, setSimLessons] = useState(DEFAULT_SIM_LESSONS);

  const { execute, status } = useAction(updateXpConfig, {
    onSuccess: () => toast.success("Valores de experiencia actualizados"),
    onError: () => toast.error("No se pudieron guardar los valores"),
  });
  const isExecuting = status === "executing";

  const preview = useMemo(() => {
    const modules = Math.max(0, simModules);
    const lessons = Math.max(0, simLessons);
    const lessonTotal = modules * lessons * values.lesson_xp;
    const moduleTotal = modules * values.module_xp;
    const perCourse = lessonTotal + moduleTotal + values.course_xp;

    return {
      perCourse,
      lessonTotal,
      moduleTotal,
      courseTotal: values.course_xp,
      milestones: [1, 2, 3, 5, 10].map((courses) => ({
        courses,
        xp: perCourse * courses,
        level: levelFromXp(perCourse * courses),
      })),
      // Where the first level-up lands, in lessons — the number that decides
      // whether the loop feels rewarding in the first session.
      lessonsToLevel2:
        values.lesson_xp > 0
          ? Math.ceil(totalXpForLevel(2) / values.lesson_xp)
          : null,
    };
  }, [values, simModules, simLessons]);

  const table = useMemo(() => levelTable(10), []);
  const levelAfterOneCourse = levelFromXp(preview.perCourse);

  const setValue = (key: RewardKey, raw: string) => {
    const next = Number(raw);
    setValues((prev) => ({
      ...prev,
      [key]: Number.isFinite(next) && next >= 0 ? Math.floor(next) : 0,
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Rewards */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          execute(values);
        }}
        className="rounded-xl border border-white/[0.06] bg-[#050505] p-6"
      >
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-6">
          Recompensas
        </h2>

        <div className="space-y-6">
          {REWARDS.map(({ key, label, hint, icon: Icon }) => (
            <div key={key}>
              <Label
                htmlFor={key}
                className="flex items-center gap-2 text-sm font-medium text-white"
              >
                <Icon className="h-4 w-4 text-red-400" />
                {label}
              </Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id={key}
                  type="number"
                  min={0}
                  step={1}
                  value={values[key]}
                  onChange={(e) => setValue(key, e.target.value)}
                  className="max-w-[140px]"
                />
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
                  XP
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{hint}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-neutral-600">
          Poner un valor en <span className="text-neutral-400">0</span> desactiva
          esa recompensa. Cambiar estos números no afecta la experiencia ya
          otorgada: cada premio guarda el valor que tenía al momento de ganarse.
        </p>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isExecuting} variant="secondary">
            {isExecuting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* Live preview */}
      <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Simulación en vivo
          </span>
        </div>

        {/* Simulated course shape */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <Label htmlFor="sim_modules" className="text-xs text-neutral-500">
              Módulos por curso
            </Label>
            <Input
              id="sim_modules"
              type="number"
              min={0}
              value={simModules}
              onChange={(e) => setSimModules(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 max-w-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="sim_lessons" className="text-xs text-neutral-500">
              Lecciones por módulo
            </Label>
            <Input
              id="sim_lessons"
              type="number"
              min={0}
              value={simLessons}
              onChange={(e) => setSimLessons(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 max-w-[100px]"
            />
          </div>
        </div>

        {/* Headline */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-4 mb-5">
          <div className="flex items-baseline gap-2">
            <Trophy className="h-4 w-4 self-center text-red-400" />
            <span className="text-2xl font-black text-white">
              {preview.perCourse.toLocaleString("es-AR")}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              XP por curso completo
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {preview.lessonTotal.toLocaleString("es-AR")} de lecciones +{" "}
            {preview.moduleTotal.toLocaleString("es-AR")} de módulos +{" "}
            {preview.courseTotal.toLocaleString("es-AR")} del curso · lleva al{" "}
            <span className="text-red-400 font-semibold">
              nivel {levelAfterOneCourse}
            </span>
          </p>
          {preview.lessonsToLevel2 !== null && (
            <p className="mt-1 text-xs text-neutral-500">
              Primer nivel a las{" "}
              <span className="text-neutral-300 font-semibold">
                {preview.lessonsToLevel2}
              </span>{" "}
              lecciones.
            </p>
          )}
        </div>

        {/* What the learner actually sees, filling as these numbers change. */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
          Así lo ve el alumno al terminar un curso
        </h3>
        <div className="mb-6">
          <XpMeter totalXp={preview.perCourse} variant="full" />
        </div>

        {/* Milestones */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
          Progreso del alumno
        </h3>
        <div className="space-y-1 mb-6">
          {preview.milestones.map((m) => (
            <div
              key={m.courses}
              className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs odd:bg-white/[0.02]"
            >
              <span className="text-neutral-400">
                {m.courses} curso{m.courses !== 1 ? "s" : ""}
              </span>
              <span className="text-neutral-600">
                {m.xp.toLocaleString("es-AR")} XP
              </span>
              <span className="font-semibold text-white">Nivel {m.level}</span>
            </div>
          ))}
        </div>

        {/* Curve */}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-2">
          Curva de niveles
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {table.map((row) => {
            const reached = preview.perCourse >= row.totalXp;
            return (
              <div
                key={row.level}
                className="flex items-center justify-between text-xs"
              >
                <span className={reached ? "text-neutral-300" : "text-neutral-600"}>
                  Nivel {row.level}
                  <span className="ml-1.5 text-[10px] text-neutral-700">
                    {row.tier}
                  </span>
                </span>
                <span className={reached ? "text-red-400" : "text-neutral-700"}>
                  {row.totalXp.toLocaleString("es-AR")}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-600">
          Cada nivel cuesta 50 XP más que el anterior. La curva es fija: se
          ajusta el ritmo cambiando las recompensas de la izquierda.
        </p>
      </div>
    </div>
  );
};

export default XpConfigForm;

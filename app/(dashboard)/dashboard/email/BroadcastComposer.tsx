"use client";

import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUploader from "@/components/uploaders/ImageUploader";
import {
  getCohortCount,
  sendBroadcast,
  sendTestBroadcast,
  syncCohort,
} from "@/lib/db/actions/email/broadcast_actions";
import { broadcastCohortValues, type BroadcastCohort } from "@/lib/db/schema/email_consent";

/**
 * Broadcast composer.
 *
 * Two things the mailer this replaces got wrong are fixed in the UI itself:
 * the operator can see how many people a cohort actually resolves to *before*
 * sending, and sending is a two-step (test, then send) rather than one button
 * wired straight to every address in the database.
 */

const COHORT_LABELS: Record<BroadcastCohort, { label: string; hint: string }> = {
  allUsers: {
    label: "Todos los suscriptores",
    hint: "Todas las personas que confirmaron, tengan cuenta o no.",
  },
  usersWithCourses: { label: "Con cursos", hint: "Confirmados con al menos un curso." },
  usersWithEbookProgram: {
    label: "Con ebook o programa",
    hint: "Confirmados que compraron un ebook o un programa.",
  },
  usersWithCoaching: {
    label: "Con coaching activo",
    hint: "Confirmados con una suscripcion de coaching activa.",
  },
  test: { label: "Prueba (admins)", hint: "Solo las direcciones de ADMIN_EMAILS." },
};

const panel = "rounded-xl border border-white/[0.06] bg-[#050505] p-6";
const sectionTitle = "text-sm font-semibold uppercase tracking-widest text-neutral-500";

export default function BroadcastComposer() {
  const [cohort, setCohort] = useState<BroadcastCohort>("allUsers");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [buttonTitle, setButtonTitle] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [imgUrl, setImgUrl] = useState<string | undefined>(undefined);
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirming, setConfirming] = useState(false);

  const countAction = useAction(getCohortCount);
  const runCount = countAction.execute;

  /**
   * Derived, not stored. The action echoes back the cohort it counted, so a
   * result belonging to a cohort the operator has since moved away from reads
   * as "unknown" rather than as a number for the wrong audience.
   */
  const countData = countAction.result?.data;
  const recipients =
    countData && countData.cohort === cohort ? countData.count : null;

  const sync = useAction(syncCohort, {
    onSuccess: ({ data }) => {
      toast.success(
        `Publico sincronizado: ${data?.desired ?? 0} destinatarios (${data?.added ?? 0} nuevos, ${data?.removed ?? 0} quitados)`,
      );
      runCount({ cohort });
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "No se pudo sincronizar el publico"),
  });

  const test = useAction(sendTestBroadcast, {
    onSuccess: ({ data }) => toast.success(`Prueba enviada a ${data?.sentTo}`),
    onError: ({ error }) => toast.error(error.serverError ?? "No se pudo enviar la prueba"),
  });

  const send = useAction(sendBroadcast, {
    onSuccess: ({ data }) => {
      setConfirming(false);
      if (data?.status === "draft") {
        toast.success("Borrador creado en Resend. Todavia no se envio.");
      } else if (data?.scheduled) {
        toast.success(`Programado para ${data.recipientCount} destinatarios`);
      } else {
        toast.success(`Enviado a ${data?.recipientCount} destinatarios`);
      }
    },
    onError: ({ error }) => {
      setConfirming(false);
      toast.error(error.serverError ?? "No se pudo enviar el correo");
    },
  });

  // Recount whenever the target changes, so the number on screen always belongs
  // to the cohort currently selected.
  useEffect(() => {
    runCount({ cohort });
  }, [cohort, runCount]);

  const payload = {
    cohort,
    subject: subject.trim(),
    previewText: previewText.trim() || undefined,
    title: title.trim(),
    content: content.trim(),
    buttonTitle: buttonTitle.trim() || undefined,
    buttonUrl: buttonUrl.trim() || undefined,
    imgUrl,
  };

  const missing = !payload.subject || !payload.title || !payload.content;
  // A CTA needs both halves or neither — a label with no destination renders as
  // a dead button in someone's inbox.
  const brokenCta = Boolean(buttonTitle.trim()) !== Boolean(buttonUrl.trim());
  const busy = send.status === "executing" || test.status === "executing";
  const noRecipients = recipients === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Composer */}
      <div className={panel}>
        <h2 className={`${sectionTitle} mb-6`}>Contenido</h2>

        <div className="space-y-5">
          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-white">
              Asunto
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Lo que se lee en la bandeja de entrada"
              maxLength={200}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="previewText" className="text-sm font-medium text-white">
              Texto de vista previa <span className="text-neutral-600">(opcional)</span>
            </Label>
            <Input
              id="previewText"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="La linea gris que aparece al lado del asunto"
              maxLength={200}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-medium text-white">
              Titulo
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="El encabezado dentro del correo"
              maxLength={200}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-sm font-medium text-white">
              Mensaje
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Escribi el mensaje. Una linea en blanco separa parrafos."
              className="mt-2"
            />
            <p className="mt-2 text-xs text-neutral-600">
              Texto plano. Se escapa antes de enviarse, asi que el HTML que pegues
              se vera literal en vez de aplicarse.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="buttonTitle" className="text-sm font-medium text-white">
                Texto del boton
              </Label>
              <Input
                id="buttonTitle"
                value={buttonTitle}
                onChange={(e) => setButtonTitle(e.target.value)}
                placeholder="Ver el curso"
                maxLength={80}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="buttonUrl" className="text-sm font-medium text-white">
                Enlace del boton
              </Label>
              <Input
                id="buttonUrl"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://..."
                className="mt-2"
              />
            </div>
          </div>
          {brokenCta && (
            <p className="text-xs text-amber-400">
              Completa el texto y el enlace del boton, o deja los dos vacios.
            </p>
          )}

          <div>
            <Label className="text-sm font-medium text-white">
              Imagen <span className="text-neutral-600">(opcional)</span>
            </Label>
            <div className="mt-2">
              <ImageUploader onUploadComplete={setImgUrl} />
            </div>
            {imgUrl && (
              <p className="mt-2 truncate text-xs text-neutral-600" title={imgUrl}>
                {imgUrl}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Audience + send */}
      <div className="space-y-6">
        <div className={panel}>
          <h2 className={`${sectionTitle} mb-4`}>Publico</h2>

          <div className="space-y-2">
            {broadcastCohortValues.map((value) => {
              const active = cohort === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCohort(value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-red-500/40 bg-red-500/[0.08]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${active ? "text-white" : "text-neutral-300"}`}
                  >
                    {COHORT_LABELS[value].label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                    {COHORT_LABELS[value].hint}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500">
              <Users className="h-3.5 w-3.5" />
              Destinatarios
            </span>
            <span className="text-lg font-black text-white">
              {countAction.status === "executing" || recipients === null ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-500" />
              ) : (
                recipients.toLocaleString("es-AR")
              )}
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            Solo cuenta a quienes confirmaron que querian recibir novedades. Nadie
            mas recibe este correo.
          </p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            disabled={sync.status === "executing"}
            onClick={() => sync.execute({ cohort })}
          >
            {sync.status === "executing" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            Sincronizar con Resend
          </Button>
        </div>

        <div className={panel}>
          <h2 className={`${sectionTitle} mb-4`}>Envio</h2>

          <div>
            <Label htmlFor="scheduledAt" className="text-sm font-medium text-white">
              Programar <span className="text-neutral-600">(opcional)</span>
            </Label>
            <Input
              id="scheduledAt"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              placeholder="in 2 hours"
              className="mt-2"
            />
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Vacio envia ahora. Acepta una fecha ISO 8601 o texto relativo en
              ingles, como <span className="text-neutral-400">in 1 hour</span> o{" "}
              <span className="text-neutral-400">tomorrow at 9am</span>.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy || missing || brokenCta}
              onClick={() => test.execute(payload)}
            >
              {test.status === "executing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Enviarme una prueba
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={busy || missing || brokenCta || noRecipients}
              onClick={() => send.execute({ ...payload, draftOnly: true })}
            >
              Guardar como borrador
            </Button>

            {confirming ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] p-3">
                <p className="text-xs leading-relaxed text-white">
                  Se enviara a{" "}
                  <span className="font-bold">
                    {(recipients ?? 0).toLocaleString("es-AR")}
                  </span>{" "}
                  personas. Esto no se puede deshacer.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 bg-red-500 text-white hover:bg-red-600"
                    disabled={busy}
                    onClick={() =>
                      send.execute({
                        ...payload,
                        draftOnly: false,
                        scheduledAt: scheduledAt.trim() || undefined,
                      })
                    }
                  >
                    {send.status === "executing" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Si, enviar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => setConfirming(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full bg-red-500 text-white hover:bg-red-600"
                disabled={busy || missing || brokenCta || noRecipients}
                onClick={() => setConfirming(true)}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar a {COHORT_LABELS[cohort].label.toLowerCase()}
              </Button>
            )}
          </div>

          {noRecipients && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Este publico no tiene destinatarios confirmados todavia. Corre la
              campana de reconsentimiento o espera a que la gente se suscriba.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { SITE, absoluteUrl } from "@/lib/seo/site";
import { EMAIL_COLORS, button, escapeHtml, heading, layout, note } from "./shared";

/**
 * The double opt-in confirmation email.
 *
 * Sent through `emails.send`, not as a broadcast: it is transactional (a direct
 * response to someone typing their address) and it must reach people who are
 * not yet contacts — which is the whole point of it.
 */

export function confirmConsentSubject(): string {
  return `Confirma tu suscripcion a ${SITE.name}`;
}

export interface ConfirmConsentContent {
  /** Absolute `/email/confirmar?token=...` URL. */
  confirmUrl: string;
  /** Days until the link stops working, for the small print. */
  expiresInDays: number;
}

export function renderConfirmConsentHtml({
  confirmUrl,
  expiresInDays,
}: ConfirmConsentContent): string {
  const body = [
    heading("Confirma tu suscripcion"),
    `<p style="margin:0 0 16px;color:${EMAIL_COLORS.foreground};font-size:16px;line-height:1.6;">Alguien —esperamos que vos— pidio recibir novedades de ${escapeHtml(
      SITE.name,
    )} en esta direccion. Tocá el boton para confirmarlo.</p>`,
    button("Si, quiero recibir novedades", confirmUrl),
    `<p style="margin:0;color:${EMAIL_COLORS.muted};font-size:13px;line-height:1.6;">Si el boton no funciona, copia este enlace en tu navegador:<br /><span style="color:${EMAIL_COLORS.foreground};word-break:break-all;">${escapeHtml(
      confirmUrl,
    )}</span></p>`,
    note(
      `El enlace vence en ${expiresInDays} dias. Si no pediste esto, ignora el correo: sin confirmacion no te enviaremos nada.`,
    ),
  ].join("\n");

  return layout({
    title: confirmConsentSubject(),
    previewText: "Un toque y quedas suscripto.",
    bodyHtml: body,
  });
}

export function renderConfirmConsentText({
  confirmUrl,
  expiresInDays,
}: ConfirmConsentContent): string {
  return [
    "Confirma tu suscripcion",
    "",
    `Alguien pidio recibir novedades de ${SITE.name} en esta direccion.`,
    "Confirmalo abriendo este enlace:",
    confirmUrl,
    "",
    `El enlace vence en ${expiresInDays} dias.`,
    "Si no pediste esto, ignora el correo: sin confirmacion no te enviaremos nada.",
    "",
    absoluteUrl("/"),
  ].join("\n");
}

/**
 * "Manage your preferences" link, for people who are not signed in.
 *
 * Emailing the link rather than exposing a page that takes any address is what
 * stops the preferences page from becoming a way to unsubscribe someone else.
 */
export function preferencesLinkSubject(): string {
  return `Tus preferencias de correo en ${SITE.name}`;
}

export function renderPreferencesLinkHtml({
  manageUrl,
  expiresInDays,
}: {
  manageUrl: string;
  expiresInDays: number;
}): string {
  const body = [
    heading("Gestiona tus preferencias"),
    `<p style="margin:0 0 16px;color:${EMAIL_COLORS.foreground};font-size:16px;line-height:1.6;">Usa este enlace para elegir si queres seguir recibiendo novedades de ${escapeHtml(
      SITE.name,
    )}.</p>`,
    button("Abrir mis preferencias", manageUrl),
    note(`El enlace vence en ${expiresInDays} dias. Si no lo pediste, ignora este correo.`),
  ].join("\n");

  return layout({
    title: preferencesLinkSubject(),
    previewText: "Elegi que correos queres recibir.",
    bodyHtml: body,
  });
}

export function renderPreferencesLinkText({
  manageUrl,
  expiresInDays,
}: {
  manageUrl: string;
  expiresInDays: number;
}): string {
  return [
    "Gestiona tus preferencias",
    "",
    `Elegi si queres seguir recibiendo novedades de ${SITE.name}:`,
    manageUrl,
    "",
    `El enlace vence en ${expiresInDays} dias. Si no lo pediste, ignora este correo.`,
  ].join("\n");
}

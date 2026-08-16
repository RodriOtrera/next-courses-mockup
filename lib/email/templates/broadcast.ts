import { SITE, absoluteUrl } from "@/lib/seo/site";
import {
  EMAIL_COLORS,
  button,
  escapeHtml,
  heading,
  image,
  layout,
  paragraphs,
} from "./shared";

/**
 * The marketing broadcast template.
 *
 * Everything an operator types goes through `escapeHtml` / `safeUrl` on the way
 * in, so a broadcast can never inject markup into itself.
 */

export interface BroadcastContent {
  title: string;
  /** Plain text; blank lines become paragraphs. */
  content: string;
  buttonTitle?: string;
  buttonUrl?: string;
  imgUrl?: string;
}

/**
 * Resend's merge tag for the hosted unsubscribe link.
 *
 * Broadcasts must contain an unsubscribe link — Resend rejects them otherwise,
 * and Gmail/Yahoo bulk-sender rules require one-click unsubscribe. Resend also
 * flips the contact to `unsubscribed` when it is clicked, which reaches this
 * app as a `contact.updated` webhook.
 *
 * Three braces, not two: the tag must not be HTML-escaped by Resend's renderer.
 */
export const UNSUBSCRIBE_TAG = "{{{RESEND_UNSUBSCRIBE_URL}}}";

/**
 * Greeting merge tag, with a fallback for contacts whose first name is unknown
 * (footer subscribers never gave one).
 */
const GREETING_TAG = "{{{contact.first_name|Hola}}}";

function footer(): string {
  const preferencesUrl = absoluteUrl("/email/preferencias");
  return `
    <p style="margin:0;">
      Recibis este correo porque confirmaste que querias novedades de ${escapeHtml(SITE.name)}.
    </p>
    <p style="margin:8px 0 0;">
      <a href="${UNSUBSCRIBE_TAG}" style="color:${EMAIL_COLORS.muted};text-decoration:underline;">Darme de baja</a>
      &nbsp;·&nbsp;
      <a href="${preferencesUrl}" style="color:${EMAIL_COLORS.muted};text-decoration:underline;">Gestionar preferencias</a>
    </p>`;
}

/** Renders the HTML body sent to Resend as the broadcast content. */
export function renderBroadcastHtml(
  content: BroadcastContent,
  options: { previewText?: string } = {},
): string {
  const parts = [
    `<p style="margin:0 0 16px;font-size:16px;color:${EMAIL_COLORS.muted};">${GREETING_TAG},</p>`,
    heading(content.title),
    content.imgUrl ? image(content.imgUrl, content.title) : "",
    paragraphs(content.content),
    content.buttonTitle && content.buttonUrl
      ? button(content.buttonTitle, content.buttonUrl)
      : "",
  ];

  return layout({
    title: content.title,
    previewText: options.previewText,
    bodyHtml: parts.filter(Boolean).join("\n"),
    footerHtml: footer(),
  });
}

/**
 * Plain-text alternative.
 *
 * Worth the duplication: a multipart message scores better with spam filters
 * than HTML alone, and the merge tags resolve in text parts too.
 */
export function renderBroadcastText(content: BroadcastContent): string {
  const lines = [
    `${GREETING_TAG},`,
    "",
    content.title,
    "",
    content.content.trim(),
  ];

  if (content.buttonTitle && content.buttonUrl) {
    lines.push("", `${content.buttonTitle}: ${content.buttonUrl}`);
  }

  lines.push(
    "",
    "---",
    `Recibis este correo porque confirmaste que querias novedades de ${SITE.name}.`,
    `Darme de baja: ${UNSUBSCRIBE_TAG}`,
    `Gestionar preferencias: ${absoluteUrl("/email/preferencias")}`,
  );

  return lines.join("\n");
}

/**
 * Test-send variant.
 *
 * Merge tags only resolve inside a real broadcast, so a preview sent through
 * `emails.send` would show the raw `{{{...}}}` text. Substituting them keeps the
 * test looking like what recipients get, and the banner makes it unmistakable
 * that this copy did not go to the list.
 */
export function renderBroadcastPreview(content: BroadcastContent, previewText?: string): string {
  const banner = `<div style="margin:0 0 16px;padding:12px 16px;border:1px solid ${EMAIL_COLORS.accent};border-radius:8px;color:${EMAIL_COLORS.accent};font-size:13px;">PRUEBA — este correo no se envio a la lista.</div>`;

  return renderBroadcastHtml(content, { previewText })
    .replace(UNSUBSCRIBE_TAG, absoluteUrl("/email/preferencias"))
    .replace(GREETING_TAG, "Hola")
    .replace(
      /(<td style="background-color:[^"]*;border:1px solid [^"]*;border-radius:12px;padding:32px 24px;">)/,
      `$1${banner}`,
    );
}

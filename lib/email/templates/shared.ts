import { SITE, absoluteUrl } from "@/lib/seo/site";

/**
 * Shared building blocks for every email this app sends.
 *
 * Three rules the templates this replaces broke:
 *
 *  1. **Escape everything.** The old template interpolated the operator's
 *     subject and body straight into HTML, so a stray `<` silently mangled the
 *     mail and a crafted one rewrote it.
 *  2. **No hardcoded brand.** It shipped one client's logo, domain, signature
 *     and calisthenics copy, which followed this white-label base to every new
 *     deployment. Branding comes from `SITE` / `absoluteUrl()` only.
 *  3. **Tables and inline styles.** Outlook still renders with Word's engine;
 *     flexbox, grid and `<style>` blocks are unreliable. Everything below is a
 *     nested table with inline attributes.
 */

/**
 * Email palette, mirroring the app's de-facto dark UI (`app/globals.css` and
 * the `bg-neutral-950` / `border-white/[0.06]` / `red-500` classes the
 * dashboard actually uses).
 *
 * Kept as literal hex in one place because email clients support neither CSS
 * custom properties nor `hsl(var(--x))`. If the app is re-themed, this object
 * is the single edit.
 */
export const EMAIL_COLORS = {
  /** Page backdrop — matches `body { background-color: #0a0a0a }`. */
  ink: "#0a0a0a",
  /** Card surface. */
  surface: "#141414",
  border: "#262626",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  accent: "#ef4444",
  accentForeground: "#ffffff",
} as const;

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** HTML-escape a value destined for element content or an attribute. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Only `http(s)` and `mailto` survive. Operator-supplied URLs land in `href`
 * attributes, where `javascript:` and `data:` are the obvious abuse.
 */
export function safeUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^(https?:|mailto:)/i.test(trimmed)) return null;
  return escapeHtml(trimmed);
}

/** Operator-authored plain text → escaped paragraphs, blank line separated. */
export function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;color:${EMAIL_COLORS.foreground};font-size:16px;line-height:1.6;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

/** A centred call-to-action. Uses a table so Outlook honours the padding. */
export function button(label: string, url: string): string {
  const href = safeUrl(url);
  if (!href) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
      <tr>
        <td align="center" bgcolor="${EMAIL_COLORS.accent}" style="border-radius:8px;">
          <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${EMAIL_COLORS.accentForeground};text-decoration:none;border-radius:8px;">${escapeHtml(
            label,
          )}</a>
        </td>
      </tr>
    </table>`;
}

/** Full-width image block, e.g. the broadcast hero. */
export function image(url: string, alt = ""): string {
  const src = safeUrl(url);
  if (!src) return "";
  return `<img src="${src}" alt="${escapeHtml(
    alt,
  )}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border-radius:8px;margin:0 0 24px;" />`;
}

export interface LayoutOptions {
  /** Used for the `<title>` and screen-reader preheader. */
  title: string;
  /** Already-escaped HTML for the card body. */
  bodyHtml: string;
  /**
   * Already-escaped HTML for the small print under the card. Broadcasts pass an
   * unsubscribe block here; transactional mail passes nothing.
   */
  footerHtml?: string;
  /** Inbox preview line shown next to the subject. */
  previewText?: string;
}

/**
 * Wraps body HTML in the standard shell: dark backdrop, 600px card, site
 * wordmark, footer.
 */
export function layout({ title, bodyHtml, footerHtml, previewText }: LayoutOptions): string {
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
        previewText,
      )}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(SITE.lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark" />
<!--
  Apple Mail and Gmail on iOS treat a bare run of digits as a phone number and
  restyle it as a blue tappable link. That mangles the one-time code, which is
  the one thing in these emails that has to stay legible and copyable.
-->
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.ink};font-family:${FONT_STACK};">
${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_COLORS.ink};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="padding:0 0 24px;">
            <a href="${absoluteUrl("/")}" style="font-family:${FONT_STACK};font-size:18px;font-weight:700;letter-spacing:0.04em;color:${EMAIL_COLORS.foreground};text-decoration:none;">${escapeHtml(
              SITE.name,
            )}</a>
          </td>
        </tr>
        <tr>
          <td style="background-color:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.border};border-radius:12px;padding:32px 24px;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px 0;font-family:${FONT_STACK};font-size:12px;line-height:1.6;color:${EMAIL_COLORS.muted};">
            ${footerHtml ?? ""}
            <p style="margin:12px 0 0;">© ${new Date().getFullYear()} ${escapeHtml(SITE.name)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Heading for the top of a card body. */
export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:700;color:${EMAIL_COLORS.foreground};">${escapeHtml(
    text,
  )}</h1>`;
}

/** Small muted line, e.g. "this link expires in 7 days". */
export function note(text: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${EMAIL_COLORS.muted};">${escapeHtml(
    text,
  )}</p>`;
}

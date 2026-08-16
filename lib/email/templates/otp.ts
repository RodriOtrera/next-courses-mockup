import { SITE } from "@/lib/seo/site";
import { EMAIL_COLORS, escapeHtml, heading, layout, note } from "./shared";

/**
 * The one-time code mail — the first thing anyone ever receives from this app,
 * since signup and sign-in both run through it.
 *
 * It used to be sent as a bare `text:` string with no HTML at all, so the mail
 * that introduces the brand was the only one that carried none of it.
 *
 * Deliberately has **no call-to-action button**. A link back to `/verify-otp`
 * would drop the `name` and `marketing` params that `app/signup/page.tsx` puts
 * on the URL, so anyone finishing signup from the email would land in the
 * login funnel and get an account with no name on it. The code is the payload;
 * it is the only thing this email needs to deliver well.
 */

/**
 * Single source of truth for how long a code lives.
 *
 * `lib/auth/index.ts` derives `expiresIn` from this, so the sentence in the
 * mail cannot drift out of sync with what the server actually enforces — which
 * is exactly the kind of lie users notice and support tickets are made of.
 */
export const OTP_EXPIRY_MINUTES = 10;

/**
 * Mirrors better-auth's `emailOTP` verification types. All four are covered
 * even though this app only enables the first two today: the plugin picks the
 * type, so a missing case would mean a `undefined` subject line in production
 * the day someone turns on password reset or email changes.
 */
export type OtpPurpose =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

interface PurposeCopy {
  subjectTail: string;
  heading: string;
  lead: string;
  preview: string;
}

const COPY: Record<OtpPurpose, PurposeCopy> = {
  "sign-in": {
    subjectTail: "es tu codigo de acceso",
    heading: "Tu codigo de acceso",
    lead: `Escribi este codigo en ${SITE.name} para entrar a tu cuenta.`,
    preview: `Escribilo para entrar. Vence en ${OTP_EXPIRY_MINUTES} minutos.`,
  },
  "email-verification": {
    subjectTail: "es tu codigo de verificacion",
    heading: "Verifica tu correo",
    lead: "Escribi este codigo para confirmar que esta direccion es tuya.",
    preview: "Un codigo y tu correo queda verificado.",
  },
  "forget-password": {
    subjectTail: "es tu codigo para cambiar la contraseña",
    heading: "Cambia tu contraseña",
    lead: "Escribi este codigo para elegir una contraseña nueva.",
    preview: "Escribilo para elegir una contraseña nueva.",
  },
  "change-email": {
    subjectTail: "es tu codigo para cambiar de correo",
    heading: "Confirma tu correo nuevo",
    lead: "Escribi este codigo para empezar a usar esta direccion en tu cuenta.",
    preview: "Un codigo y tu cuenta queda en esta direccion.",
  },
};

/**
 * The code leads the subject line, so it is readable from a lock-screen
 * notification without opening anything — the same shape Slack and Stripe use.
 * The sender column already says who this is from, so the brand name is not
 * repeated here where it would only push the code toward the truncation point.
 */
export function otpSubject(otp: string, type: OtpPurpose): string {
  return `${otp} ${COPY[type].subjectTail}`;
}

export interface OtpContent {
  otp: string;
  type: OtpPurpose;
}

/**
 * The code itself: an inset panel with the digits as one selectable text node.
 *
 * Not split into per-digit cells and not an image, both of which look tidier
 * and both of which break the thing people actually do — select the code and
 * paste it. `letter-spacing` gives the digits room; the half-step `text-indent`
 * cancels the trailing gap that spacing adds after the last character, which
 * would otherwise leave the number visibly off-centre in its box.
 */
function codePanel(otp: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" bgcolor="${EMAIL_COLORS.ink}" style="background-color:${EMAIL_COLORS.ink};border:1px solid ${EMAIL_COLORS.border};border-radius:10px;padding:22px 16px;">
          <span style="display:inline-block;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:10px;text-indent:5px;color:${EMAIL_COLORS.foreground};white-space:nowrap;">${escapeHtml(
            otp,
          )}</span>
        </td>
      </tr>
    </table>`;
}

export function renderOtpHtml({ otp, type }: OtpContent): string {
  const copy = COPY[type];

  const body = [
    heading(copy.heading),
    `<p style="margin:0 0 20px;color:${EMAIL_COLORS.foreground};font-size:16px;line-height:1.6;">${escapeHtml(
      copy.lead,
    )}</p>`,
    codePanel(otp),
    `<p style="margin:0;color:${EMAIL_COLORS.muted};font-size:14px;line-height:1.6;">Vence en ${OTP_EXPIRY_MINUTES} minutos y sirve una sola vez.</p>`,
    note(
      `Si no pediste este codigo, ignora el correo: sin el nadie puede entrar. Nunca te lo vamos a pedir por mensaje ni por telefono.`,
    ),
  ].join("\n");

  return layout({
    title: copy.heading,
    previewText: copy.preview,
    bodyHtml: body,
  });
}

export function renderOtpText({ otp, type }: OtpContent): string {
  const copy = COPY[type];

  return [
    copy.heading,
    "",
    copy.lead,
    "",
    otp,
    "",
    `Vence en ${OTP_EXPIRY_MINUTES} minutos y sirve una sola vez.`,
    "Si no pediste este codigo, ignora el correo: sin el nadie puede entrar.",
    "Nunca te lo vamos a pedir por mensaje ni por telefono.",
  ].join("\n");
}

import { absoluteUrl } from "@/lib/seo/site";
import { EMAIL_COLORS, button, escapeHtml, heading, layout } from "./shared";

/**
 * Course-progress milestone mail, fired at 25/50/75% by
 * `lib/db/actions/courses_progress_actions.ts`.
 *
 * **Transactional, not marketing** — it reports on a course the learner already
 * paid for, so it deliberately does not consult `email_consent`. That is the
 * line: mail about a product someone bought is service mail; mail about
 * products they have not bought needs consent.
 *
 * The copy this replaces was written for one client ("CURSO DE INSTRUCTOR DE
 * CALISTENIA", signed by name), which made it wrong on every other deployment
 * of this white-label base.
 */

export const MILESTONES = [25, 50, 75] as const;
export type CourseMilestone = (typeof MILESTONES)[number];

const ENCOURAGEMENT: Record<CourseMilestone, string> = {
  25: "Arrancaste en serio. Lo que aprendas solo rinde si lo aplicas, asi que segui con ese ritmo.",
  50: "Estas en la mitad exacta. Este es el punto donde la mayoria afloja: sostenelo y el resto se hace cuesta abajo.",
  75: "Ultimo tramo. Te queda un cuarto del camino y ya hiciste la parte dificil. No lo dejes ahora.",
};

export function courseProgressSubject(courseTitle: string, milestone: CourseMilestone): string {
  return `${courseTitle}: ya completaste el ${milestone}%`;
}

export interface CourseProgressContent {
  courseTitle: string;
  milestone: CourseMilestone;
  /** Where "continuar" goes. Falls back to the catalogue. */
  continueUrl?: string;
}

/** A simple filled bar — a progress email with no visible progress is a wasted one. */
function progressBar(percent: number): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="background-color:${EMAIL_COLORS.border};border-radius:999px;padding:0;font-size:0;line-height:0;">
          <table role="presentation" width="${percent}%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background-color:${EMAIL_COLORS.accent};border-radius:999px;height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:-16px 0 20px;font-size:13px;color:${EMAIL_COLORS.muted};">${percent}% completado</p>`;
}

export function renderCourseProgressHtml({
  courseTitle,
  milestone,
  continueUrl,
}: CourseProgressContent): string {
  const body = [
    heading(`${milestone}% de ${courseTitle}`),
    progressBar(milestone),
    `<p style="margin:0 0 16px;color:${EMAIL_COLORS.foreground};font-size:16px;line-height:1.6;">${escapeHtml(
      ENCOURAGEMENT[milestone],
    )}</p>`,
    button("Continuar el curso", continueUrl ?? absoluteUrl("/productos/micuenta")),
  ].join("\n");

  return layout({
    title: courseProgressSubject(courseTitle, milestone),
    previewText: ENCOURAGEMENT[milestone],
    bodyHtml: body,
  });
}

export function renderCourseProgressText({
  courseTitle,
  milestone,
  continueUrl,
}: CourseProgressContent): string {
  return [
    `${milestone}% de ${courseTitle}`,
    "",
    ENCOURAGEMENT[milestone],
    "",
    `Continuar: ${continueUrl ?? absoluteUrl("/productos/micuenta")}`,
  ].join("\n");
}

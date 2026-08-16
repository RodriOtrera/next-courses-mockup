import { getResend, resendFrom, resendReplyTo, unwrapSoft } from "./resend";
import {
  courseProgressSubject,
  renderCourseProgressHtml,
  renderCourseProgressText,
  type CourseMilestone,
} from "./templates/course_progress";

/**
 * Service mail — messages about something the recipient already bought.
 *
 * These bypass `email_consent` deliberately. Consent governs *marketing*: mail
 * about products someone has not purchased. Telling a learner they are halfway
 * through a course they paid for is part of delivering that course, and making
 * it opt-in would mean a paying customer silently loses their own progress
 * notifications.
 *
 * Failures are logged and swallowed. These are fired from the middle of a
 * progress write; a Resend outage must not lose the learner's place in the
 * course, which is what throwing here would do.
 */

export async function sendCourseProgressEmail(params: {
  to: string;
  courseTitle: string;
  milestone: CourseMilestone;
  continueUrl?: string;
}): Promise<void> {
  const content = {
    courseTitle: params.courseTitle,
    milestone: params.milestone,
    continueUrl: params.continueUrl,
  };
  const replyTo = resendReplyTo();

  await unwrapSoft(
    getResend().emails.send({
      from: resendFrom(),
      to: params.to,
      subject: courseProgressSubject(params.courseTitle, params.milestone),
      html: renderCourseProgressHtml(content),
      text: renderCourseProgressText(content),
      ...(replyTo ? { replyTo } : {}),
    }),
    `emails.send(progress ${params.milestone}% ${params.to})`,
  );
}

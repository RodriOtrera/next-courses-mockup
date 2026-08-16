import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema/auth_schema";
import { getResend, resendFrom, resendReplyTo, unwrap } from "@/lib/email/resend";
import {
  OTP_EXPIRY_MINUTES,
  otpSubject,
  renderOtpHtml,
  renderOtpText,
} from "@/lib/email/templates/otp";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      // Derived from the template constant so the "vence en N minutos" line in
      // the mail always states the window this actually enforces.
      expiresIn: 60 * OTP_EXPIRY_MINUTES,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const content = { otp, type };
        const replyTo = resendReplyTo();

        // `unwrap`, not a bare `await`: the Resend SDK resolves to
        // `{ data, error }` and never rejects, so the previous plain call
        // reported success even when nothing was sent — which sent people to
        // /verify-otp to wait for an email that did not exist. Throwing here is
        // what surfaces "Could not send code" on the signup and login forms.
        await unwrap(
          getResend().emails.send({
            from: resendFrom(),
            to: email,
            subject: otpSubject(otp, type),
            html: renderOtpHtml(content),
            text: renderOtpText(content),
            ...(replyTo ? { replyTo } : {}),
          }),
          `emails.send(otp ${type})`,
        );
      },
    }),
  ],
});

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema/auth_schema";

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.AUTH_RESEND_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? "Your sign-in code"
            : type === "email-verification"
              ? "Verify your email"
              : "Your verification code";

        await getResend().emails.send({
          from: process.env.RESEND_FROM!,
          to: email,
          subject,
          text: `Your code is: ${otp}\n\nThis code expires in 10 minutes.`,
        });
      },
    }),
  ],
});

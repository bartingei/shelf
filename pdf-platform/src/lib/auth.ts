import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { resend, EMAIL_FROM } from "./resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Reset your Shelf password",
          html: `
            <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
              <p style="font-size: 22px; font-style: italic; margin: 0 0 24px;">Shelf.</p>
              <h1 style="font-size: 20px; margin: 0 0 12px;">Reset your password</h1>
              <p style="color: #555; line-height: 1.6;">
                We got a request to reset the password for your Shelf account. Click below to choose a new one — this link expires in an hour.
              </p>
              <p style="margin: 28px 0;">
                <a href="${url}" style="background: #c9a97e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Reset password
                </a>
              </p>
              <p style="color: #888; font-size: 13px; line-height: 1.6;">
                If you didn't request this, you can safely ignore this email — your password won't change.
              </p>
            </div>
          `,
        });
        // Log rather than throw — a broken email provider shouldn't surface
        // as a user-facing error and reveal whether an account exists.
        if (error) console.error("[resend] Failed to send reset password email:", error);
      } catch (err) {
        console.error("[resend] Failed to send reset password email:", err);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3002",
  ],
});

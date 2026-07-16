import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendEmail } from "./resend";

// Shared wrapper so every transactional email shares the same shell
// (logo, spacing) instead of duplicating inline styles per email.
function emailShell(heading: string, body: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <p style="font-size: 22px; font-style: italic; margin: 0 0 24px;">Shelf.</p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">${heading}</h1>
      ${body}
    </div>
  `;
}

function ctaButton(url: string, label: string) {
  return `
    <p style="margin: 28px 0;">
      <a href="${url}" style="background: #c9a97e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        ${label}
      </a>
    </p>
  `;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Unverified accounts can't sign in — closes the gap where anyone could
    // sign up with an email address they don't own and use the app fully.
    // Google sign-in is unaffected: better-auth marks social accounts as
    // verified automatically when the provider (Google) reports the email
    // as verified, which it does for standard Gmail/Workspace accounts.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Shelf password",
        html: emailShell(
          "Reset your password",
          `
            <p style="color: #555; line-height: 1.6;">
              We got a request to reset the password for your Shelf account. Click below to choose a new one — this link expires in an hour.
            </p>
            ${ctaButton(url, "Reset password")}
            <p style="color: #888; font-size: 13px; line-height: 1.6;">
              If you didn't request this, you can safely ignore this email — your password won't change.
            </p>
          `
        ),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Shelf account",
        html: emailShell(
          "Verify your email",
          `
            <p style="color: #555; line-height: 1.6;">
              One more step — confirm this is your email address to finish setting up your Shelf account.
            </p>
            ${ctaButton(url, "Verify email")}
            <p style="color: #888; font-size: 13px; line-height: 1.6;">
              If you didn't create a Shelf account, you can safely ignore this email.
            </p>
          `
        ),
      });
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

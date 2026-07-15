import { Resend } from "resend";

// The Resend constructor throws synchronously if given an empty/undefined
// key, which would crash this whole module (and everything that imports
// it, including all of better-auth) before a real key is ever configured.
// Fall back to a placeholder so construction always succeeds — actual
// send calls with an invalid key fail gracefully at request time instead,
// which src/lib/auth.ts already catches.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

// Resend's shared sandbox sender — works with zero domain setup. Swap for a
// verified custom domain address (e.g. "Shelf <noreply@yourdomain.com>") once
// one is configured in the Resend dashboard.
export const EMAIL_FROM = "Shelf <onboarding@resend.dev>";

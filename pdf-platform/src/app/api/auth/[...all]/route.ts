import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Handles all Better Auth endpoints: /api/auth/sign-up, /api/auth/sign-in,
// /api/auth/sign-out, /api/auth/session, etc.
export const { GET, POST } = toNextJsHandler(auth);

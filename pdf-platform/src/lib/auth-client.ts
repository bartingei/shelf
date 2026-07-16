import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

// Convenience exports for use in client components
export const { signIn, signUp, signOut, useSession, updateUser } = authClient;

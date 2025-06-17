// lib/auth-client.ts - Simplified for single app deployment

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // No baseURL needed since auth API is on the same domain
  // Better Auth will automatically use the current domain
  fetchOptions: {
    credentials: "include",
  }
});

export const { signIn, signOut, signUp, useSession } = authClient;
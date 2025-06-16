import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://narrativ-server.vercel.app",
  fetchOptions: {
    credentials: "include", // Add this for cross-origin cookies
  }
});


export const { signIn, signOut, signUp, useSession } = authClient;


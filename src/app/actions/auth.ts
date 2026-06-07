"use server";

import { signOut, auth } from "@/auth";

/**
 * Server action to sign the user out.
 * Redirects to the login page after clearing the session.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Server action to get the current session user info.
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}


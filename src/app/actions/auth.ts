"use server";

import { signOut } from "@/auth";

/**
 * Server action to sign the user out.
 * Redirects to the login page after clearing the session.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

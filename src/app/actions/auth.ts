"use server";

import { signOut, auth } from "@/auth";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

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

/**
 * Server action to register a new patient.
 */
export async function registerPatientAction(formData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  try {
    const { name, email, password, phone } = formData;

    if (!name || !email || !password) {
      return { success: false, error: "Missing required fields" };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    if (phone?.trim()) {
      const existingPhone = await db.user.findUnique({
        where: { phone: phone.trim() },
      });
      if (existingPhone) {
        return { success: false, error: "An account with this phone number already exists" };
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and patient profile
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: Role.PATIENT,
          phone: phone?.trim() ? phone.trim() : null,
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: user.id,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in registerPatientAction:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}



"use server";

import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInputString } from "@/lib/sanitize";
import { signOut, auth } from "@/auth";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// Registration validation schema with strict format and length checks
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must not exceed 50 characters"),
  email: z.string().email("Invalid email format").max(100, "Email must not exceed 100 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  phone: z
    .string()
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format")
    .optional()
    .nullable(),
});

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
    // 1. IP-based Rate Limiting for Auth Abuse Protection
    const ip = await getClientIp();
    const rateCheck = checkRateLimit(ip, "auth");
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many registration attempts. Please try again in a minute." };
    }

    // 2. Validate using Zod schema
    const parseResult = registerSchema.safeParse({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    });

    if (!parseResult.success) {
      return { success: false, error: parseResult.error.issues[0].message };
    }

    const validatedData = parseResult.data;

    // 3. HTML Input Sanitization (Defense against XSS)
    const sanitizedName = sanitizeInputString(validatedData.name);
    const sanitizedPhone = validatedData.phone ? sanitizeInputString(validatedData.phone) : null;
    const normalizedEmail = validatedData.email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    if (sanitizedPhone) {
      const existingPhone = await db.user.findUnique({
        where: { phone: sanitizedPhone },
      });
      if (existingPhone) {
        return { success: false, error: "An account with this phone number already exists" };
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user and patient profile
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: sanitizedName,
          email: normalizedEmail,
          passwordHash,
          role: Role.PATIENT,
          phone: sanitizedPhone,
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



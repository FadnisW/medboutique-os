"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sanitizeInputString } from "@/lib/sanitize";

// Clinic settings input validation schema
const settingsSchema = z.object({
  clinicName: z.string().max(100, "Clinic Name must not exceed 100 characters").optional(),
  doctorName: z.string().max(100, "Doctor Name must not exceed 100 characters").optional(),
  specialty: z.string().max(100, "Specialty must not exceed 100 characters").optional(),
  phone: z.string().max(20, "Phone number must not exceed 20 characters").regex(/^\+?[0-9\s\-]+$/, "Invalid phone number format").optional(),
  address: z.string().max(300, "Address must not exceed 300 characters").optional(),
  duration: z.number().int().min(1, "Duration must be at least 1 minute").max(180, "Duration must not exceed 180 minutes").optional(),
  buffer: z.number().int().min(0, "Buffer must be a non-negative number").max(60, "Buffer must not exceed 60 minutes").optional(),
  bookingLimit: z.number().int().min(1, "Booking limit must be at least 1").max(24, "Booking limit must not exceed 24").optional(),
  openDays: z.array(z.boolean()).length(7, "Must contain exactly 7 days status").optional(),
  whatsappConfirm: z.boolean().optional(),
  whatsapp24h: z.boolean().optional(),
  sms1h: z.boolean().optional(),
  emailInvoice: z.boolean().optional(),
  newBookingAlert: z.boolean().optional(),
  whatsappTemplate: z.string().max(1000, "Template must not exceed 1000 characters").optional(),
});

/**
 * Retrieves clinic settings from the database, or returns/initializes defaults.
 * Admin only.
 */
export async function getClinicSettings() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    let settings = await db.clinicSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await db.clinicSettings.create({
        data: {
          id: "default",
        },
      });
    }

    return {
      success: true,
      settings: {
        clinicName: settings.clinicName,
        doctorName: settings.doctorName,
        specialty: settings.specialty,
        phone: settings.phone,
        address: settings.address,
        duration: settings.duration,
        buffer: settings.buffer,
        bookingLimit: settings.bookingLimit,
        openDays: settings.openDays.split(",").map((v) => v === "true"),
        whatsappConfirm: settings.whatsappConfirm,
        whatsapp24h: settings.whatsapp24h,
        sms1h: settings.sms1h,
        emailInvoice: settings.emailInvoice,
        newBookingAlert: settings.newBookingAlert,
        whatsappTemplate: settings.whatsappTemplate,
      },
    };
  } catch (error: unknown) {
    console.error("Error in getClinicSettings:", error);
    return { success: false, error: "Failed to load clinic settings" };
  }
}

/**
 * Saves/Updates clinic settings in the database.
 * Admin only.
 */
export async function saveClinicSettings(data: {
  clinicName?: string;
  doctorName?: string;
  specialty?: string;
  phone?: string;
  address?: string;
  duration?: number;
  buffer?: number;
  bookingLimit?: number;
  openDays?: boolean[];
  whatsappConfirm?: boolean;
  whatsapp24h?: boolean;
  sms1h?: boolean;
  emailInvoice?: boolean;
  newBookingAlert?: boolean;
  whatsappTemplate?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // 1. Zod input validation
    const parsedData = settingsSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error.issues[0].message };
    }

    const validatedData = parsedData.data;

    // 2. HTML and script tag sanitization for XSS prevention
    const sanitizedClinicName = validatedData.clinicName ? sanitizeInputString(validatedData.clinicName) : undefined;
    const sanitizedDoctorName = validatedData.doctorName ? sanitizeInputString(validatedData.doctorName) : undefined;
    const sanitizedSpecialty = validatedData.specialty ? sanitizeInputString(validatedData.specialty) : undefined;
    const sanitizedPhone = validatedData.phone ? sanitizeInputString(validatedData.phone) : undefined;
    const sanitizedAddress = validatedData.address ? sanitizeInputString(validatedData.address) : undefined;
    const sanitizedTemplate = validatedData.whatsappTemplate ? sanitizeInputString(validatedData.whatsappTemplate) : undefined;

    const openDaysStr = validatedData.openDays ? validatedData.openDays.map((v) => String(v)).join(",") : undefined;

    await db.clinicSettings.upsert({
      where: { id: "default" },
      update: {
        clinicName: sanitizedClinicName,
        doctorName: sanitizedDoctorName,
        specialty: sanitizedSpecialty,
        phone: sanitizedPhone,
        address: sanitizedAddress,
        duration: validatedData.duration,
        buffer: validatedData.buffer,
        bookingLimit: validatedData.bookingLimit,
        openDays: openDaysStr,
        whatsappConfirm: validatedData.whatsappConfirm,
        whatsapp24h: validatedData.whatsapp24h,
        sms1h: validatedData.sms1h,
        emailInvoice: validatedData.emailInvoice,
        newBookingAlert: validatedData.newBookingAlert,
        whatsappTemplate: sanitizedTemplate,
      },
      create: {
        id: "default",
        clinicName: sanitizedClinicName || "MedBoutique Clinic",
        doctorName: sanitizedDoctorName || "Dr. Aisha Sharma",
        specialty: sanitizedSpecialty || "Dermatology & Aesthetics",
        phone: sanitizedPhone || "+91 98765 43210",
        address: sanitizedAddress || "Suite 402, Pacific Mall, Linking Road, Bandra West, Mumbai 400050",
        duration: validatedData.duration ?? 60,
        buffer: validatedData.buffer ?? 15,
        bookingLimit: validatedData.bookingLimit ?? 4,
        openDays: openDaysStr || "true,true,true,true,true,true,false",
        whatsappConfirm: validatedData.whatsappConfirm ?? true,
        whatsapp24h: validatedData.whatsapp24h ?? true,
        sms1h: validatedData.sms1h ?? false,
        emailInvoice: validatedData.emailInvoice ?? true,
        newBookingAlert: validatedData.newBookingAlert ?? true,
        whatsappTemplate: sanitizedTemplate || "",
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in saveClinicSettings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

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

    const openDaysStr = data.openDays ? data.openDays.map((v) => String(v)).join(",") : undefined;

    await db.clinicSettings.upsert({
      where: { id: "default" },
      update: {
        clinicName: data.clinicName,
        doctorName: data.doctorName,
        specialty: data.specialty,
        phone: data.phone,
        address: data.address,
        duration: data.duration,
        buffer: data.buffer,
        bookingLimit: data.bookingLimit,
        openDays: openDaysStr,
        whatsappConfirm: data.whatsappConfirm,
        whatsapp24h: data.whatsapp24h,
        sms1h: data.sms1h,
        emailInvoice: data.emailInvoice,
        newBookingAlert: data.newBookingAlert,
        whatsappTemplate: data.whatsappTemplate,
      },
      create: {
        id: "default",
        clinicName: data.clinicName || "MedBoutique Clinic",
        doctorName: data.doctorName || "Dr. Aisha Sharma",
        specialty: data.specialty || "Dermatology & Aesthetics",
        phone: data.phone || "+91 98765 43210",
        address: data.address || "Suite 402, Pacific Mall, Linking Road, Bandra West, Mumbai 400050",
        duration: data.duration ?? 60,
        buffer: data.buffer ?? 15,
        bookingLimit: data.bookingLimit ?? 4,
        openDays: openDaysStr || "true,true,true,true,true,true,false",
        whatsappConfirm: data.whatsappConfirm ?? true,
        whatsapp24h: data.whatsapp24h ?? true,
        sms1h: data.sms1h ?? false,
        emailInvoice: data.emailInvoice ?? true,
        newBookingAlert: data.newBookingAlert ?? true,
        whatsappTemplate: data.whatsappTemplate || "",
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in saveClinicSettings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

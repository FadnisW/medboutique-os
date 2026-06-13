"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function sendSafetyForm(appointmentId: string, patientId: string, templateId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Resolve sender user ID from email
    const sender = await db.user.findUnique({
      where: { email: session.user.email || "" }
    });

    if (!sender) {
      return { success: false, error: "Sender profile not found" };
    }

    // Calculate expiration date (e.g. end of today)
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const instance = await db.safetyFormInstance.create({
      data: {
        appointmentId,
        patientId,
        templateId,
        sentById: sender.id,
        status: "SENT",
        expiresAt: endOfToday
      },
    });

    revalidatePath("/admin");
    return { success: true, instance };
  } catch (error) {
    console.error("Error in sendSafetyForm:", error);
    return { success: false, error: "Failed to send safety form" };
  }
}

export async function markFormAsViewed(instanceId: string) {
  try {
    const instance = await db.safetyFormInstance.update({
      where: { id: instanceId },
      data: {
        status: "VIEWED",
        viewedAt: new Date()
      }
    });

    revalidatePath("/admin");
    return { success: true, instance };
  } catch (error) {
    console.error("Error in markFormAsViewed:", error);
    return { success: false, error: "Failed to mark form as viewed" };
  }
}

export async function completeSafetyForm(instanceId: string, signatureUrl?: string, responseJson?: any) {
  try {
    const instance = await db.safetyFormInstance.update({
      where: { id: instanceId },
      data: {
        status: "COMPLETED",
        isSigned: true,
        completedAt: new Date(),
        signatureUrl,
        responseJson
      }
    });

    revalidatePath("/admin");
    return { success: true, instance };
  } catch (error) {
    console.error("Error in completeSafetyForm:", error);
    return { success: false, error: "Failed to complete form" };
  }
}

export async function getMissingFormsForAppointment(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const appt = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        formInstances: true
      }
    });

    if (!appt) {
      return { success: false, error: "Appointment not found" };
    }

    // Get all mandatory templates
    const templates = await db.safetyFormTemplate.findMany({
      where: {
        isMandatory: true,
        isArchived: false
      }
    });

    const completedTemplateIds = appt.formInstances
      .filter(f => f.status === "COMPLETED")
      .map(f => f.templateId);

    const missingTemplates = templates.filter(t => !completedTemplateIds.includes(t.id));

    return { success: true, missingTemplates };
  } catch (error) {
    console.error("Error in getMissingFormsForAppointment:", error);
    return { success: false, error: "Failed to retrieve missing forms" };
  }
}

"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getClinicStatuses() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    const statuses = await db.clinicStatus.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    });
    return { success: true, statuses };
  } catch (error) {
    console.error("Error in getClinicStatuses:", error);
    return { success: false, error: "Failed to load clinic statuses" };
  }
}

export async function updatePatientStatus(appointmentId: string, statusId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Resolve user ID
    const user = await db.user.findUnique({
      where: { email: session.user.email || "" }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Insert new PatientStatusLog
    const log = await db.patientStatusLog.create({
      data: {
        appointmentId,
        statusId,
        updatedById: user.id
      },
      include: {
        status: true
      }
    });

    revalidatePath("/admin");

    return { success: true, log };
  } catch (error) {
    console.error("Error in updatePatientStatus:", error);
    return { success: false, error: "Failed to update patient status" };
  }
}

export async function sendConsentRequest(appointmentId: string, patientId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Resolve sender user ID
    const sender = await db.user.findUnique({
      where: { email: session.user.email || "" }
    });

    if (!sender) {
      return { success: false, error: "User not found" };
    }

    const template = await db.safetyFormTemplate.findFirst({
      where: { isArchived: false }
    });

    if (template) {
      const existing = await db.safetyFormInstance.findFirst({
        where: {
          appointmentId,
          patientId,
          templateId: template.id
        }
      });

      if (!existing) {
        await db.safetyFormInstance.create({
          data: {
            appointmentId,
            patientId,
            templateId: template.id,
            status: "SENT",
            sentById: sender.id
          }
        });
      }
    }

    revalidatePath("/admin");
    return { success: true, message: "Consent request sent successfully." };
  } catch (error) {
    console.error("Error in sendConsentRequest:", error);
    return { success: false, error: "Failed to send consent request" };
  }
}

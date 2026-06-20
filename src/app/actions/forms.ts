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
      },
      include: {
        appointment: true
      }
    });

    const appointment = instance.appointment;
    if (appointment && appointment.status === "PENDING_REQUIRED_FORMS") {
      // Find all mandatory templates
      const mandatoryTemplates = await db.safetyFormTemplate.findMany({
        where: {
          isMandatory: true,
          isArchived: false
        }
      });
      const mandatoryTemplateIds = mandatoryTemplates.map(t => t.id);

      // Find all current safety form instances for this appointment
      const allInstances = await db.safetyFormInstance.findMany({
        where: { appointmentId: appointment.id }
      });

      // Filter to only mandatory ones and check if all are completed
      const mandatoryInstancesForAppt = allInstances.filter(inst => mandatoryTemplateIds.includes(inst.templateId));
      const allCompleted = mandatoryInstancesForAppt.length > 0
        ? mandatoryInstancesForAppt.every(inst => inst.status === "COMPLETED")
        : true;

      if (allCompleted) {
        await db.appointment.update({
          where: { id: appointment.id },
          data: { status: "CONFIRMED" }
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
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

export async function getFormInstancesForAppointment(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const instances = await db.safetyFormInstance.findMany({
      where: { appointmentId }
    });

    return { success: true, instances };
  } catch (error) {
    console.error("Error in getFormInstancesForAppointment:", error);
    return { success: false, error: "Failed to retrieve form instances" };
  }
}

export async function getFormInstanceDetails(instanceId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    const instance = await db.safetyFormInstance.findUnique({
      where: { id: instanceId },
      include: {
        template: true,
        patient: {
          include: {
            user: true
          }
        },
        appointment: {
          include: {
            slot: true
          }
        }
      }
    });

    if (!instance) {
      return { success: false, error: "Form instance not found" };
    }

    return {
      success: true,
      instance: {
        id: instance.id,
        status: instance.status,
        sentAt: instance.sentAt.toISOString(),
        viewedAt: instance.viewedAt?.toISOString() || null,
        completedAt: instance.completedAt?.toISOString() || null,
        expiresAt: instance.expiresAt?.toISOString() || null,
        isSigned: instance.isSigned,
        signatureUrl: instance.signatureUrl,
        responseJson: instance.responseJson,
        templateTitle: instance.template.title,
        templateContent: instance.template.content,
        patientName: instance.patient.user.name,
        patientEmail: instance.patient.user.email,
        appointmentReason: instance.appointment.reason,
        appointmentDate: instance.appointment.slot.startTime.toISOString(),
      }
    };
  } catch (error) {
    console.error("Error in getFormInstanceDetails:", error);
    return { success: false, error: "Failed to retrieve form details" };
  }
}

export async function getAllFormInstances(options?: {
  status?: string;
  templateId?: string;
  search?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    const whereClause: any = {};

    if (options?.status && options.status !== "ALL") {
      whereClause.status = options.status;
    }
    if (options?.templateId && options.templateId !== "ALL") {
      whereClause.templateId = options.templateId;
    }

    const instances = await db.safetyFormInstance.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
      include: {
        template: {
          select: { id: true, title: true, category: true, isMandatory: true }
        },
        patient: {
          include: {
            user: { select: { name: true, email: true, phone: true } }
          }
        },
        appointment: {
          include: {
            slot: { select: { startTime: true, endTime: true } },
            treatment: { select: { name: true } }
          }
        },
        sentBy: {
          select: { name: true, role: true }
        }
      }
    });

    // If there's a search term, filter in memory (name/email search)
    let filtered = instances;
    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = instances.filter(i =>
        i.patient.user.name?.toLowerCase().includes(q) ||
        i.patient.user.email?.toLowerCase().includes(q) ||
        i.template.title.toLowerCase().includes(q)
      );
    }

    const serialized = filtered.map(i => ({
      id: i.id,
      status: i.status,
      isSigned: i.isSigned,
      sentAt: i.sentAt.toISOString(),
      viewedAt: i.viewedAt?.toISOString() || null,
      completedAt: i.completedAt?.toISOString() || null,
      expiresAt: i.expiresAt?.toISOString() || null,
      signatureUrl: i.signatureUrl || null,
      responseJson: i.responseJson || null,
      templateId: i.templateId,
      templateTitle: i.template.title,
      templateCategory: i.template.category,
      isMandatory: i.template.isMandatory,
      patientName: i.patient.user.name || "Unknown",
      patientEmail: i.patient.user.email,
      patientPhone: i.patient.user.phone || null,
      appointmentDate: i.appointment.slot.startTime.toISOString(),
      appointmentReason: i.appointment.reason || null,
      treatmentName: i.appointment.treatment?.name || null,
      sentByName: i.sentBy?.name || null,
      sentByRole: i.sentBy?.role || null,
    }));

    // Summary stats
    const total = serialized.length;
    const signed = serialized.filter(i => i.isSigned).length;
    const pending = serialized.filter(i => i.status === "SENT" || i.status === "VIEWED").length;
    const expired = serialized.filter(i => i.status === "EXPIRED").length;

    // Also get all templates for filter dropdown
    const templates = await db.safetyFormTemplate.findMany({
      where: { isArchived: false },
      select: { id: true, title: true }
    });

    return {
      success: true,
      instances: serialized,
      stats: { total, signed, pending, expired },
      templates,
    };
  } catch (error) {
    console.error("Error in getAllFormInstances:", error);
    return { success: false, error: "Failed to retrieve form instances" };
  }
}

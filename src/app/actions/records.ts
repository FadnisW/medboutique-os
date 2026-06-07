"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

/**
 * Returns all clinical records (PatientRecords) and appointments for the logged-in patient.
 */
export async function getPatientRecords() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "PATIENT") {
      return { success: false, error: "Forbidden" };
    }

    const patient = await db.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    // Fetch patient records with attachments
    const records = await db.patientRecord.findMany({
      where: { patientId: patient.id },
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch appointments for visit history
    const appointments = await db.appointment.findMany({
      where: {
        patientId: patient.id,
        status: "COMPLETED",
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        slot: true,
      },
      orderBy: {
        slot: {
          startTime: "desc",
        },
      },
    });

    return {
      success: true,
      records: records.map((r) => ({
        id: r.id,
        diagnosis: r.diagnosis,
        clinicalNotes: r.clinicalNotes,
        prescription: r.prescription || "",
        createdAt: r.createdAt.toISOString(),
        attachments: r.attachments.map((a) => ({
          id: a.id,
          fileUrl: a.fileUrl,
          fileType: a.fileType,
          description: a.description || "",
        })),
      })),
      visits: appointments.map((app) => ({
        id: app.id,
        reason: app.reason || "General Consultation",
        notes: app.notes || "",
        date: app.slot.startTime.toISOString(),
        doctorName: app.doctor.user.name,
      })),
    };
  } catch (error: unknown) {
    console.error("Error in getPatientRecords:", error);
    return { success: false, error: "Failed to retrieve records" };
  }
}

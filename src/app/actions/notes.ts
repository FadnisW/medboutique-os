"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getPatientsAndRecords(patientId?: string) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    // Only DOCTOR and RECEPTIONIST can access all patient records
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // ── Input validation ────────────────────────
    if (patientId !== undefined) {
      if (typeof patientId !== "string" || patientId.length > 100) {
        return { success: false, error: "Invalid patient ID" };
      }
    }

    const patients = await db.patientProfile.findMany({
      include: {
        user: true,
      },
    });

    if (patients.length === 0) {
      return { patients: [], selectedPatient: null, records: [], success: true };
    }

    // Default to first patient if none selected
    const activePatientId = patientId || patients[0].id;
    const selectedPatient = await db.patientProfile.findUnique({
      where: { id: activePatientId },
      include: {
        user: true,
      },
    });

    if (!selectedPatient) {
      return { success: false, error: "Patient not found" };
    }

    const records = await db.patientRecord.findMany({
      where: { patientId: activePatientId },
      include: {
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      patients: patients.map(p => ({
        id: p.id,
        name: p.user.name,
        email: p.user.email,
        phone: p.user.phone,
      })),
      selectedPatient: selectedPatient ? {
        id: selectedPatient.id,
        name: selectedPatient.user.name,
        email: selectedPatient.user.email,
        phone: selectedPatient.user.phone,
        dob: selectedPatient.dob ? selectedPatient.dob.toISOString() : null,
        gender: selectedPatient.gender,
        bloodGroup: selectedPatient.bloodGroup,
        medicalHistory: selectedPatient.medicalHistory,
        address: selectedPatient.address,
      } : null,
      records: records.map(r => ({
        id: r.id,
        clinicalNotes: r.clinicalNotes,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        createdAt: r.createdAt.toISOString(),
        attachments: r.attachments.map(att => ({
          id: att.id,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          description: att.description,
        })),
      })),
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error in getPatientsAndRecords:", error);
    return { success: false, error: "Failed to fetch patient records" };
  }
}

export async function saveSOAPNote(
  patientId: string,
  subjective: string,
  objective: string,
  assessmentPlan: string,
  diagnosis: string,
  prescription?: string,
  attachmentUrls?: { fileUrl: string; fileType: string; description?: string }[]
) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    // Only DOCTORs can create clinical notes
    if (session.user.role !== "DOCTOR") {
      return { success: false, error: "Forbidden: Only doctors can create clinical notes" };
    }

    // ── Input validation ────────────────────────
    if (!patientId || typeof patientId !== "string" || patientId.length > 100) {
      return { success: false, error: "Invalid patient ID" };
    }
    if (!diagnosis || typeof diagnosis !== "string") {
      return { success: false, error: "Diagnosis is required" };
    }
    if (diagnosis.length > 500) {
      return { success: false, error: "Diagnosis is too long (max 500 characters)" };
    }
    if (typeof subjective !== "string" || subjective.length > 5000) {
      return { success: false, error: "Subjective notes are too long (max 5000 characters)" };
    }
    if (typeof objective !== "string" || objective.length > 5000) {
      return { success: false, error: "Objective notes are too long (max 5000 characters)" };
    }
    if (typeof assessmentPlan !== "string" || assessmentPlan.length > 5000) {
      return { success: false, error: "Assessment plan is too long (max 5000 characters)" };
    }
    if (prescription !== undefined && (typeof prescription !== "string" || prescription.length > 5000)) {
      return { success: false, error: "Prescription is too long (max 5000 characters)" };
    }

    // Validate attachments
    if (attachmentUrls && Array.isArray(attachmentUrls)) {
      if (attachmentUrls.length > 20) {
        return { success: false, error: "Too many attachments (max 20)" };
      }
      for (let att of attachmentUrls) {
        if (!att.fileUrl || typeof att.fileUrl !== "string") {
          return { success: false, error: "Invalid attachment URL" };
        }
        
        att.fileUrl = att.fileUrl.trim();
        
        // Allow up to 5MB for base64 data URIs
        if (att.fileUrl.length > 5000000) {
          return { success: false, error: "Attachment URL/data exceeds maximum size" };
        }
        if (!att.fileType || typeof att.fileType !== "string" || att.fileType.length > 50) {
          return { success: false, error: "Invalid attachment file type" };
        }
        
        // Basic URL validation - must start with http://, https://, or data:
        if (!att.fileUrl.startsWith("http://") && !att.fileUrl.startsWith("https://") && !att.fileUrl.startsWith("data:")) {
           // auto-prefix with https if it looks like a naked domain
           if (att.fileUrl.includes(".") && !att.fileUrl.includes(" ")) {
             att.fileUrl = "https://" + att.fileUrl;
           } else {
             return { success: false, error: "Attachment URL must be valid HTTP, HTTPS or Base64 data URI" };
           }
        }
      }
    }

    // Verify patient exists
    const patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    // Format clinical notes as a structured SOAP JSON
    const clinicalNotes = JSON.stringify({
      subjective,
      objective,
      assessmentPlan,
    });

    const record = await db.patientRecord.create({
      data: {
        patientId,
        clinicalNotes,
        diagnosis,
        prescription: prescription || "",
        attachments: attachmentUrls && attachmentUrls.length > 0 ? {
          create: attachmentUrls.map(att => ({
            fileUrl: att.fileUrl,
            fileType: att.fileType,
            description: att.description || "SOAP note attachment",
          })),
        } : undefined,
      },
      include: {
        attachments: true,
      },
    });

    revalidatePath("/admin/patients/notes");
    return { success: true, record: { id: record.id } };
  } catch (error: unknown) {
    console.error("Error in saveSOAPNote:", error);
    return { success: false, error: "Failed to save clinical note" };
  }
}

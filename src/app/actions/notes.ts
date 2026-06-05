"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getPatientsAndRecords(patientId?: string) {
  try {
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
  } catch (error: any) {
    console.error("Error in getPatientsAndRecords:", error);
    return { success: false, error: error.message || "Failed to fetch patient records" };
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
    if (!patientId) throw new Error("Patient ID is required");
    if (!diagnosis) throw new Error("Diagnosis is required");

    // Format clinical notes as a structured SOAP string or JSON
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
    return { success: true, record };
  } catch (error: any) {
    console.error("Error in saveSOAPNote:", error);
    return { success: false, error: error.message || "Failed to save clinical note" };
  }
}

"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TimeOfDay } from "@prisma/client";

/**
 * Returns a list of all patients with basic stats.
 * Admin only.
 */
export async function getPatientList() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    const patients = await db.patientProfile.findMany({
      include: {
        user: true,
        patientRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        invoices: true,
        appointments: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return {
      success: true,
      patients: patients.map((p) => {
        const lastVisit = p.patientRecords[0]?.createdAt 
          ? p.patientRecords[0].createdAt.toISOString() 
          : null;
        
        const outstandingBalance = p.invoices.reduce((sum, inv) => {
          const due = Number(inv.amountDue) - Number(inv.amountPaid);
          return sum + (due > 0 ? due : 0);
        }, 0);

        return {
          id: p.id,
          name: p.user.name,
          email: p.user.email,
          phone: p.user.phone,
          dob: p.dob ? p.dob.toISOString() : null,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          lastVisit,
          outstandingBalance,
          appointmentsCount: p.appointments.length,
        };
      }),
    };
  } catch (error: unknown) {
    console.error("Error in getPatientList:", error);
    return { success: false, error: "Failed to load patient list" };
  }
}

/**
 * Returns complete detail of a single patient profile.
 * Admin only.
 */
export async function getPatientDetail(patientId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    if (!patientId || typeof patientId !== "string") {
      return { success: false, error: "Invalid patient ID" };
    }

    const patient = await db.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: true,
        carePlans: {
          include: {
            tasks: {
              orderBy: { scheduledTime: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        patientRecords: {
          include: {
            attachments: true,
          },
          orderBy: { createdAt: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          include: {
            slot: true,
            doctor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            slot: {
              startTime: "desc",
            },
          },
        },
      },
    });

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    let conversationId: string | null = null;
    const doctor = await db.doctorProfile.findFirst({
      where: { userId: session.user.id },
    });
    if (doctor) {
      const conversation = await db.conversation.findUnique({
        where: {
          patientId_doctorId: {
            patientId: patient.id,
            doctorId: doctor.id,
          },
        },
      });
      if (conversation) {
        conversationId = conversation.id;
      }
    }

    return {
      success: true,
      patient: {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone || "",
        dob: patient.dob ? patient.dob.toISOString() : null,
        gender: patient.gender || "",
        bloodGroup: patient.bloodGroup || "",
        medicalHistory: patient.medicalHistory || "",
        address: patient.address || "",
        createdAt: patient.user.createdAt.toISOString(),
        carePlans: patient.carePlans.map((cp) => ({
          id: cp.id,
          protocolName: cp.protocolName,
          assignedBy: cp.assignedBy,
          tip: cp.tip,
          startDate: cp.startDate.toISOString(),
          tasks: cp.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            instruction: t.instruction,
            timeOfDay: t.timeOfDay,
            scheduledTime: t.scheduledTime,
            completed: t.completed,
          })),
        })),
        patientRecords: patient.patientRecords.map((r) => ({
          id: r.id,
          diagnosis: r.diagnosis,
          clinicalNotes: r.clinicalNotes,
          prescription: r.prescription,
          createdAt: r.createdAt.toISOString(),
          attachments: r.attachments.map((a) => ({
            id: a.id,
            fileUrl: a.fileUrl,
            fileType: a.fileType,
            description: a.description,
          })),
        })),
        invoices: patient.invoices.map((inv) => ({
          id: inv.id,
          amountDue: Number(inv.amountDue),
          amountPaid: Number(inv.amountPaid),
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
        })),
        appointments: patient.appointments.map((app) => ({
          id: app.id,
          reason: app.reason,
          status: app.status,
          notes: app.notes,
          slot: {
            id: app.slot.id,
            startTime: app.slot.startTime.toISOString(),
            endTime: app.slot.endTime.toISOString(),
          },
          doctor: {
            name: app.doctor.user.name,
            specialty: app.doctor.specialty,
          },
        })),
        conversationId,
      },
    };
  } catch (error: unknown) {
    console.error("Error in getPatientDetail:", error);
    return { success: false, error: "Failed to load patient details" };
  }
}

/**
 * Updates medical history, address, or blood group for a patient.
 * Admin only.
 */
export async function updatePatientProfile(
  patientId: string,
  data: { medicalHistory?: string; address?: string; bloodGroup?: string }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    if (!patientId || typeof patientId !== "string") {
      return { success: false, error: "Invalid patient ID" };
    }

    await db.patientProfile.update({
      where: { id: patientId },
      data: {
        medicalHistory: data.medicalHistory,
        address: data.address,
        bloodGroup: data.bloodGroup,
      },
    });

    revalidatePath(`/admin/patients/${patientId}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in updatePatientProfile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

/**
 * Creates/replaces a patient's care plan.
 * Doctor only.
 */
export async function createCarePlanForPatient(
  patientId: string,
  planData: {
    protocolName: string;
    tip?: string;
    tasks: {
      title: string;
      instruction: string;
      timeOfDay: "MORNING" | "EVENING";
      scheduledTime: string;
    }[];
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR") {
      return { success: false, error: "Forbidden: Only doctors can assign care plans" };
    }

    if (!patientId || typeof patientId !== "string") {
      return { success: false, error: "Invalid patient ID" };
    }

    const doctor = await db.doctorProfile.findFirst({
      where: { userId: session.user.id },
      include: { user: true },
    });
    const assignedBy = doctor?.user.name || "Dr. Aisha Rao";

    await db.$transaction(async (tx) => {
      await tx.carePlan.deleteMany({
        where: { patientId },
      });

      await tx.carePlan.create({
        data: {
          patientId,
          protocolName: planData.protocolName,
          tip: planData.tip,
          assignedBy,
          tasks: {
            create: planData.tasks.map((task) => ({
              title: task.title,
              instruction: task.instruction,
              timeOfDay: task.timeOfDay === "MORNING" ? TimeOfDay.MORNING : TimeOfDay.EVENING,
              scheduledTime: task.scheduledTime,
              completed: false,
            })),
          },
        },
      });
    });

    revalidatePath(`/admin/patients/${patientId}`);
    revalidatePath(`/portal/care-plan`);
    revalidatePath(`/portal/dashboard`);
    revalidatePath(`/portal/routine`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in createCarePlanForPatient:", error);
    return { success: false, error: "Failed to create care plan" };
  }
}

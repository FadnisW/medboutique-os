"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";

/**
 * Gets all appointments for the logged-in patient.
 */
export async function getPatientAppointments() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "PATIENT") {
      return { success: false, error: "Forbidden: Patients only" };
    }

    const patient = await db.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    const appointments = await db.appointment.findMany({
      where: { patientId: patient.id },
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
    });

    return {
      success: true,
      appointments: appointments.map((app) => ({
        id: app.id,
        status: app.status,
        reason: app.reason || "",
        notes: app.notes || "",
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
    };
  } catch (error: unknown) {
    console.error("Error in getPatientAppointments:", error);
    return { success: false, error: "Failed to retrieve appointments" };
  }
}

/**
 * Cancels a patient's own appointment.
 */
export async function cancelAppointment(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!appointmentId || typeof appointmentId !== "string") {
      return { success: false, error: "Invalid appointment ID" };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Verify ownership
    if (appointment.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden: Not your appointment" };
    }

    // Check status
    if (
      appointment.status !== AppointmentStatus.PENDING_PAYMENT &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      return {
        success: false,
        error: "Cannot cancel appointment in its current state",
      };
    }

    await db.$transaction(async (tx) => {
      // Set appointment status to CANCELLED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });

      // Free up the availability slot
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
    revalidatePath("/admin/calendar");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in cancelAppointment:", error);
    return { success: false, error: "Failed to cancel appointment" };
  }
}

/**
 * Reschedules a patient's own appointment to a new slot.
 */
export async function rescheduleAppointment(appointmentId: string, newSlotId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!appointmentId || !newSlotId) {
      return { success: false, error: "Missing required fields" };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    if (appointment.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden: Not your appointment" };
    }

    if (
      appointment.status !== AppointmentStatus.PENDING_PAYMENT &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      return {
        success: false,
        error: "Cannot reschedule appointment in its current state",
      };
    }

    const newSlot = await db.availabilitySlot.findUnique({
      where: { id: newSlotId },
    });

    if (!newSlot || newSlot.isBooked) {
      return { success: false, error: "New slot is unavailable or already booked" };
    }

    await db.$transaction(async (tx) => {
      // Free old slot
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });

      // Book new slot
      await tx.availabilitySlot.update({
        where: { id: newSlotId },
        data: { isBooked: true },
      });

      // Update appointment
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { slotId: newSlotId },
      });
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
    revalidatePath("/admin/calendar");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in rescheduleAppointment:", error);
    return { success: false, error: "Failed to reschedule appointment" };
  }
}

/**
 * Server action to get all available future slots for rescheduling.
 */
export async function getAvailableRescheduleSlots() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const slots = await db.availabilitySlot.findMany({
      where: {
        isBooked: false,
        startTime: {
          gt: new Date(),
        },
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 20,
    });

    return {
      success: true,
      slots: slots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        doctorName: s.doctor.user.name,
      })),
    };
  } catch (error: unknown) {
    console.error("Error in getAvailableRescheduleSlots:", error);
    return { success: false, error: "Failed to load slots" };
  }
}

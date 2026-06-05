"use server";

import db from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getCalendarData(startDateStr?: string) {
  try {
    const doctors = await db.doctorProfile.findMany({
      include: {
        user: true,
      },
    });

    const patients = await db.patientProfile.findMany({
      include: {
        user: true,
      },
    });

    const doctorId = doctors[0]?.id;
    if (!doctorId) {
      return { doctors, patients, slots: [], success: true };
    }

    // Determine week range
    const start = startDateStr ? new Date(startDateStr) : new Date();
    // Normalize start to Monday of that week
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(start.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const slots = await db.availabilitySlot.findMany({
      where: {
        doctorId,
        startTime: {
          gte: monday,
          lt: sunday,
        },
      },
      include: {
        appointment: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return {
      doctors,
      patients,
      slots: slots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        isBooked: s.isBooked,
        appointment: s.appointment
          ? {
              id: s.appointment.id,
              status: s.appointment.status,
              reason: s.appointment.reason,
              notes: s.appointment.notes,
              patientName: s.appointment.patient.user.name,
              patientId: s.appointment.patientId,
            }
          : null,
      })),
      monday: monday.toISOString(),
      success: true,
    };
  } catch (error: any) {
    console.error("Error in getCalendarData:", error);
    return { success: false, error: error.message || "Failed to load calendar data" };
  }
}

export async function addAvailabilitySlot(doctorId: string, startTimeIso: string, endTimeIso: string) {
  try {
    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end time");
    }

    if (end <= start) {
      throw new Error("End time must be after start time");
    }

    const slot = await db.availabilitySlot.create({
      data: {
        doctorId,
        startTime: start,
        endTime: end,
        isBooked: false,
      },
    });

    revalidatePath("/admin/calendar");
    return { success: true, slot };
  } catch (error: any) {
    console.error("Error in addAvailabilitySlot:", error);
    return { success: false, error: error.message || "Failed to add slot" };
  }
}

export async function bookAppointment(patientId: string, doctorId: string, slotId: string, reason: string) {
  try {
    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }
    if (slot.isBooked) {
      throw new Error("Slot is already booked");
    }

    const appointment = await db.appointment.create({
      data: {
        patientId,
        doctorId,
        slotId,
        reason,
        status: AppointmentStatus.CONFIRMED, // Confirm immediately in admin flow
      },
    });

    await db.availabilitySlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    });

    revalidatePath("/admin/calendar");
    return { success: true, appointment };
  } catch (error: any) {
    console.error("Error in bookAppointment:", error);
    return { success: false, error: error.message || "Failed to book appointment" };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    // If cancelled or no show, free the slot (or keep it blocked depending on requirements, let's unbook the slot if cancelled)
    if (status === AppointmentStatus.CANCELLED) {
      await db.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    } else {
      await db.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: true },
      });
    }

    revalidatePath("/admin/calendar");
    return { success: true, appointment: updated };
  } catch (error: any) {
    console.error("Error in updateAppointmentStatus:", error);
    return { success: false, error: error.message || "Failed to update status" };
  }
}

export async function deleteAvailabilitySlot(slotId: string) {
  try {
    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { appointment: true },
    });

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.appointment) {
      throw new Error("Cannot delete a booked slot");
    }

    await db.availabilitySlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteAvailabilitySlot:", error);
    return { success: false, error: error.message || "Failed to delete slot" };
  }
}

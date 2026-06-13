"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ── Allowed appointment statuses for validation ──
const VALID_STATUSES: Set<string> = new Set(
  Object.values(AppointmentStatus)
);

export async function getCalendarData(startDateStr?: string) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

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

    // Use the logged-in doctor's profile if available, otherwise fall back to first
    let doctorId: string | undefined;
    if (session.user.role === "DOCTOR") {
      const myProfile = doctors.find((d) => d.userId === session.user.id);
      doctorId = myProfile?.id;
    }
    // Receptionist or fallback: use first doctor
    if (!doctorId) {
      doctorId = doctors[0]?.id;
    }

    if (!doctorId) {
      return { doctors, patients, slots: [], success: true };
    }

    // ── Input validation: startDateStr ──────────
    let start: Date;
    if (startDateStr) {
      start = new Date(startDateStr);
      if (isNaN(start.getTime())) {
        return { success: false, error: "Invalid start date" };
      }
    } else {
      start = new Date();
    }

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
      doctors: doctors.map((d) => ({
        id: d.id,
        userId: d.userId,
        specialty: d.specialty,
        qualifications: d.qualifications,
        consultationFee: Number(d.consultationFee),
        userName: d.user.name,
        userEmail: d.user.email,
      })),
      patients: patients.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        userEmail: p.user.email,
      })),
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
  } catch (error: unknown) {
    console.error("Error in getCalendarData:", error);
    return { success: false, error: "Failed to load calendar data" };
  }
}

export async function addAvailabilitySlot(doctorId: string, startTimeIso: string, endTimeIso: string) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // ── Input validation ────────────────────────
    if (!doctorId || typeof doctorId !== "string" || doctorId.length > 100) {
      return { success: false, error: "Invalid doctor ID" };
    }

    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Invalid start or end time" };
    }

    if (end <= start) {
      return { success: false, error: "End time must be after start time" };
    }

    // ── Authorization: Doctors can only add slots for themselves ──
    if (session.user.role === "DOCTOR") {
      const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: session.user.id } });
      if (!doctorProfile || doctorProfile.id !== doctorId) {
        return { success: false, error: "Forbidden: You can only manage your own slots" };
      }
    }

    // Verify the doctorId exists
    const doctor = await db.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return { success: false, error: "Doctor not found" };
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
  } catch (error: unknown) {
    console.error("Error in addAvailabilitySlot:", error);
    return { success: false, error: "Failed to add slot" };
  }
}

export async function bookAppointment(patientId: string, doctorId: string, slotId: string, reason: string) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // ── Input validation ────────────────────────
    if (!patientId || typeof patientId !== "string" || patientId.length > 100) {
      return { success: false, error: "Invalid patient ID" };
    }
    if (!doctorId || typeof doctorId !== "string" || doctorId.length > 100) {
      return { success: false, error: "Invalid doctor ID" };
    }
    if (!slotId || typeof slotId !== "string" || slotId.length > 100) {
      return { success: false, error: "Invalid slot ID" };
    }
    if (typeof reason !== "string" || reason.length > 1000) {
      return { success: false, error: "Reason is too long (max 1000 characters)" };
    }

    // Verify patient exists
    const patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return { success: false, error: "Slot not found" };
    }
    if (slot.isBooked) {
      return { success: false, error: "Slot is already booked" };
    }

    // Verify slot belongs to the specified doctor (IDOR prevention)
    if (slot.doctorId !== doctorId) {
      return { success: false, error: "Slot does not belong to the specified doctor" };
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
  } catch (error: unknown) {
    console.error("Error in bookAppointment:", error);
    return { success: false, error: "Failed to book appointment" };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // ── Input validation ────────────────────────
    if (!appointmentId || typeof appointmentId !== "string" || appointmentId.length > 100) {
      return { success: false, error: "Invalid appointment ID" };
    }
    if (!VALID_STATUSES.has(status)) {
      return { success: false, error: "Invalid appointment status" };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    // If cancelled or no show, free the slot
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
  } catch (error: unknown) {
    console.error("Error in updateAppointmentStatus:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteAvailabilitySlot(slotId: string) {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    // ── Input validation ────────────────────────
    if (!slotId || typeof slotId !== "string" || slotId.length > 100) {
      return { success: false, error: "Invalid slot ID" };
    }

    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
      include: { appointment: true },
    });

    if (!slot) {
      return { success: false, error: "Slot not found" };
    }

    if (slot.appointment) {
      return { success: false, error: "Cannot delete a booked slot" };
    }

    // ── Authorization: Doctors can only delete their own slots ──
    if (session.user.role === "DOCTOR") {
      const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: session.user.id } });
      if (!doctorProfile || doctorProfile.id !== slot.doctorId) {
        return { success: false, error: "Forbidden: You can only delete your own slots" };
      }
    }

    await db.availabilitySlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/admin/calendar");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error in deleteAvailabilitySlot:", error);
    return { success: false, error: "Failed to delete slot" };
  }
}

interface BreakPeriod {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export async function generateDaySchedule(
  doctorId: string,
  dateStr: string, // "YYYY-MM-DD"
  startTime: string, // "HH:MM"
  endTime: string, // "HH:MM"
  slotDuration: number, // minutes
  bufferTime: number, // minutes
  breaks: BreakPeriod[],
  maxAppointments?: number
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    if (session.user.role === "DOCTOR") {
      const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: session.user.id } });
      if (!doctorProfile || doctorProfile.id !== doctorId) {
        return { success: false, error: "Forbidden: You can only manage your own schedule" };
      }
    }

    // Generate slots list
    let currentStart = parseDateTime(dateStr, startTime);
    const dayEnd = parseDateTime(dateStr, endTime);
    const breakTimes = breaks.map(b => ({
      start: parseDateTime(dateStr, b.startTime),
      end: parseDateTime(dateStr, b.endTime)
    }));

    const slotsToCreate = [];
    let apptCount = 0;

    while (true) {
      const currentEnd = new Date(currentStart.getTime() + slotDuration * 60000);
      if (currentEnd > dayEnd) {
        break;
      }

      if (maxAppointments && apptCount >= maxAppointments) {
        break;
      }

      const overlapsBreak = breakTimes.some(b => {
        return currentStart < b.end && currentEnd > b.start;
      });

      if (!overlapsBreak) {
        slotsToCreate.push({
          doctorId,
          startTime: new Date(currentStart),
          endTime: new Date(currentEnd),
          isBooked: false,
        });
        apptCount++;
      }

      currentStart = new Date(currentEnd.getTime() + bufferTime * 60000);
    }

    if (slotsToCreate.length === 0) {
      return { success: false, error: "No slots could be generated under the current settings" };
    }

    // Get existing slots for the day
    const dayStartLimit = parseDateTime(dateStr, "00:00");
    const dayEndLimit = parseDateTime(dateStr, "23:59");
    const existingSlots = await db.availabilitySlot.findMany({
      where: {
        doctorId,
        startTime: {
          gte: dayStartLimit,
          lte: dayEndLimit,
        },
      },
    });

    // Filter out overlapping slots
    const nonOverlappingSlots = slotsToCreate.filter(newSlot => {
      return !existingSlots.some(ex => {
        return newSlot.startTime < ex.endTime && newSlot.endTime > ex.startTime;
      });
    });

    if (nonOverlappingSlots.length > 0) {
      await db.availabilitySlot.createMany({
        data: nonOverlappingSlots,
      });
    }

    revalidatePath("/admin/calendar");
    return { 
      success: true, 
      generatedCount: slotsToCreate.length, 
      createdCount: nonOverlappingSlots.length,
      skippedCount: slotsToCreate.length - nonOverlappingSlots.length
    };
  } catch (error: unknown) {
    console.error("Error in generateDaySchedule:", error);
    return { success: false, error: "Failed to generate day schedule" };
  }
}

export async function generateWeekSchedule(
  doctorId: string,
  startDateStr: string, // "YYYY-MM-DD" of the Monday
  workingDays: number[], // e.g. [1,2,3,4,5] (Monday is 1, Sunday is 0 or 7 based on JS getDay())
  startTime: string,
  endTime: string,
  slotDuration: number,
  bufferTime: number,
  breaks: BreakPeriod[],
  maxAppointments?: number
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    if (session.user.role === "DOCTOR") {
      const doctorProfile = await db.doctorProfile.findUnique({ where: { userId: session.user.id } });
      if (!doctorProfile || doctorProfile.id !== doctorId) {
        return { success: false, error: "Forbidden: You can only manage your own schedule" };
      }
    }

    const baseMonday = new Date(startDateStr);
    if (isNaN(baseMonday.getTime())) {
      return { success: false, error: "Invalid start date for the week" };
    }

    let totalGenerated = 0;
    let totalCreated = 0;
    let totalSkipped = 0;

    // We loop from 0 to 6 days after Monday
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDayDate = new Date(baseMonday);
      currentDayDate.setDate(baseMonday.getDate() + dayOffset);
      
      // getDay() returns 0 for Sunday, 1 for Monday, etc.
      const dayOfWeek = currentDayDate.getDay();
      
      // Check if this day of week is in workingDays
      if (!workingDays.includes(dayOfWeek)) {
        continue;
      }

      // Format dateStr as YYYY-MM-DD
      const yyyy = currentDayDate.getFullYear();
      const mm = String(currentDayDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDayDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const res = await generateDaySchedule(
        doctorId,
        dateStr,
        startTime,
        endTime,
        slotDuration,
        bufferTime,
        breaks,
        maxAppointments
      );

      if (res.success) {
        totalGenerated += res.generatedCount || 0;
        totalCreated += res.createdCount || 0;
        totalSkipped += res.skippedCount || 0;
      }
    }

    revalidatePath("/admin/calendar");
    return {
      success: true,
      totalGenerated,
      totalCreated,
      totalSkipped,
    };
  } catch (error: unknown) {
    console.error("Error in generateWeekSchedule:", error);
    return { success: false, error: "Failed to generate week schedule" };
  }
}


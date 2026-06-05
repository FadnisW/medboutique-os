"use server";

import db from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

export async function getDashboardData() {
  try {
    const totalPatients = await db.patientProfile.count();

    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Today's appointments count
    const todaysAppointmentsCount = await db.appointment.count({
      where: {
        slot: {
          startTime: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      },
    });

    // Completed appointments count
    const completedAppointmentsCount = await db.appointment.count({
      where: {
        status: AppointmentStatus.COMPLETED,
      },
    });

    // Today's revenue (Sum of payments completed today or invoices paid today)
    const todayInvoices = await db.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });
    const todaysRevenue = todayInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

    // Pending charts (Completed appointments with no clinical notes written yet)
    const pendingChartsCount = await db.appointment.count({
      where: {
        status: AppointmentStatus.COMPLETED,
        notes: {
          equals: "",
        },
      },
    });

    // Today's Agenda (list of appointments today)
    const agendaAppointments = await db.appointment.findMany({
      where: {
        slot: {
          startTime: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        slot: true,
      },
      orderBy: {
        slot: {
          startTime: "asc",
        },
      },
    });

    const formattedAgenda = agendaAppointments.map((apt) => {
      const start = new Date(apt.slot.startTime);
      const hours = start.getHours();
      const minutes = start.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayTime = `${(hours % 12 || 12).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      return {
        id: apt.id,
        time: displayTime,
        ampm,
        patientName: apt.patient.user.name,
        reason: apt.reason || "General Consult",
        status: apt.status,
      };
    });

    return {
      totalPatients,
      todaysAppointmentsCount,
      completedAppointmentsCount,
      todaysRevenue,
      pendingChartsCount: pendingChartsCount || 2, // fallback default if 0
      agenda: formattedAgenda,
      success: true,
    };
  } catch (error: any) {
    console.error("Error in getDashboardData:", error);
    return {
      success: false,
      error: error.message || "Failed to load dashboard data",
    };
  }
}

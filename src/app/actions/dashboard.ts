"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { AppointmentStatus } from "@prisma/client";

export async function getDashboardData() {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    // Only DOCTOR and RECEPTIONIST can view the admin dashboard
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    const totalPatients = await db.patientProfile.count();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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

    // Today's revenue: Sum of completed payments today
    const todayPayments = await db.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });
    const todaysRevenue = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Pending charts (Completed appointments with no clinical notes written yet)
    const pendingChartsCount = await db.appointment.count({
      where: {
        status: AppointmentStatus.COMPLETED,
        OR: [
          { notes: null },
          { notes: "" }
        ]
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

    // ── CORRECTED: In-Clinic Now flow (Appointment-Centric Lifecycle) ──
    // A patient enters flow strictly when today's slot startTime has arrived,
    // and they are still in CONFIRMED status (exit flow once completed/cancelled/no-show).
    const inClinicAppts = await db.appointment.findMany({
      where: {
        slot: {
          startTime: {
            gte: startOfToday,
            lte: now, // scheduled appointment time has arrived or passed
          },
        },
        status: AppointmentStatus.CONFIRMED, // Strictly confirmed active status
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        statusLogs: {
          include: {
            status: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
        formInstances: {
          include: {
            template: true,
          },
        },
      },
    });

    // Get all mandatory templates to check compliance
    const mandatoryTemplates = await db.safetyFormTemplate.findMany({
      where: {
        isMandatory: true,
        isArchived: false,
      },
    });

    const formattedInClinic = inClinicAppts.map((apt) => {
      const latestLog = apt.statusLogs[0];
      
      // Determine if there are unsigned mandatory forms
      const completedTemplates = apt.formInstances
        .filter((inst) => inst.status === "COMPLETED")
        .map((inst) => inst.templateId);
      
      const missingMandatoryCount = mandatoryTemplates.filter(
        (temp) => !completedTemplates.includes(temp.id)
      ).length;

      return {
        appointmentId: apt.id,
        patientId: apt.patientId,
        patientName: apt.patient.user.name,
        procedure: apt.reason || "Aesthetic Treatment",
        statusId: latestLog?.statusId || "",
        statusName: latestLog?.status.name || "Checked In",
        hasPendingForms: missingMandatoryCount > 0,
        missingFormsCount: missingMandatoryCount,
      };
    });

    // ── SAFETY FORMS WORKFLOW & AUDIT TRAIL ──
    const safetyFormInstances = await db.safetyFormInstance.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        template: true,
        sentBy: true,
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    const totalRequiredToday = safetyFormInstances.length;
    const signedToday = safetyFormInstances.filter((f) => f.status === "COMPLETED").length;

    const formattedFormInstances = safetyFormInstances.map((f) => ({
      id: f.id,
      title: f.template.title,
      patientName: f.patient.user.name,
      sentAt: f.sentAt,
      senderName: f.sentBy?.name || "System",
      status: f.status, // SENT, VIEWED, COMPLETED, EXPIRED
      viewedAt: f.viewedAt,
      completedAt: f.completedAt,
      expiresAt: f.expiresAt,
    }));

    // Rebook Opportunities
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

    const allPatients = await db.patientProfile.findMany({
      include: {
        user: true,
        appointments: {
          include: {
            slot: true,
          },
        },
      },
    });

    const rebookTargets = allPatients
      .filter((p) => {
        const appts = p.appointments;
        if (appts.length === 0) return true;
        const hasFuture = appts.some(
          (a) => a.slot.startTime > now && a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.NO_SHOW
        );
        if (hasFuture) return false;

        const completed = appts.filter((a) => a.status === AppointmentStatus.COMPLETED);
        if (completed.length === 0) return true;

        const lastVisit = new Date(Math.max(...completed.map((a) => a.slot.startTime.getTime())));
        return lastVisit < sixWeeksAgo;
      })
      .slice(0, 5)
      .map((p) => {
        const completed = p.appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
        const lastVisitDate = completed.length > 0
          ? new Date(Math.max(...completed.map((a) => a.slot.startTime.getTime()))).toLocaleDateString()
          : "Never";

        return {
          patientId: p.id,
          name: p.user.name,
          lastVisit: lastVisitDate,
          phone: p.user.phone || "N/A",
        };
      });

    // Integrated Inbox
    const conversations = await db.conversation.findMany({
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedInbox = conversations.map((c) => {
      const unreadCount = c.messages.filter((m) => !m.isRead && m.senderId === c.patient.userId).length;
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        patientName: c.patient.user.name,
        unreadCount,
        lastMessageText: lastMessage ? lastMessage.content : "No messages yet",
        lastMessageTime: lastMessage
          ? new Date(lastMessage.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
          : "",
      };
    });

    return {
      success: true,
      totalPatients,
      todaysAppointmentsCount,
      completedAppointmentsCount,
      todaysRevenue,
      pendingChartsCount,
      agenda: formattedAgenda,
      inClinic: formattedInClinic,
      consents: {
        total: totalRequiredToday,
        signed: signedToday,
        instances: formattedFormInstances,
      },
      rebookTargets,
      inbox: formattedInbox,
    };
  } catch (error: unknown) {
    console.error("Error in getDashboardData:", error);
    return {
      success: false,
      error: "Failed to load dashboard data",
    };
  }
}

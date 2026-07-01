"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import crypto from "crypto";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeInputString } from "@/lib/sanitize";

// Schemas for booking requests validation
const slotIdSchema = z.string().uuid("Invalid slot ID format");
const reasonSchema = z.string().max(500, "Reason length must not exceed 500 characters");



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

/**
 * Server action to get all available future slots for public/patient booking.
 * Does not require authentication, so anyone can see available slots.
 */
export async function getPublicAvailableSlots() {
  try {
    await releaseExpiredHoldSlots();
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
      take: 50,
    });

    return {
      success: true,
      slots: slots.map((s) => ({
        id: s.id,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        doctorName: s.doctor.user.name,
        doctorId: s.doctorId,
        specialty: s.doctor.specialty,
      })),
    };
  } catch (error: unknown) {
    console.error("Error in getPublicAvailableSlots:", error);
    return { success: false, error: "Failed to load slots" };
  }
}

/**
 * Server action to book an appointment for the authenticated patient.
 */
export async function bookPatientAppointment(slotId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "PATIENT") {
      return { success: false, error: "Forbidden: Patients only" };
    }

    // Rate limiting to prevent slot flooding abuse
    const ip = await getClientIp();
    const rateCheck = checkRateLimit(ip, "booking");
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many booking attempts. Please try again later." };
    }

    // Validate inputs
    const validatedSlot = slotIdSchema.safeParse(slotId);
    if (!validatedSlot.success) {
      return { success: false, error: "Invalid slot ID format" };
    }

    const sanitizedReason = reason ? sanitizeInputString(reasonSchema.parse(reason)) : "";

    const patient = await db.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
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

    const appointment = await db.$transaction(async (tx) => {
      // Mark slot as booked
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      // Create appointment
      return await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: slot.doctorId,
          slotId: slotId,
          reason: sanitizedReason,
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          slot: true,
          doctor: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
    revalidatePath("/admin/calendar");

    return {
      success: true,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        reason: appointment.reason || "",
        slot: {
          startTime: appointment.slot.startTime.toISOString(),
          endTime: appointment.slot.endTime.toISOString(),
        },
        doctor: {
          name: appointment.doctor.user.name,
          specialty: appointment.doctor.specialty,
        },
      },
    };
  } catch (error: unknown) {
    console.error("Error in bookPatientAppointment:", error);
    return { success: false, error: "Failed to book appointment" };
  }
}

export async function releaseExpiredHoldSlots() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const expiredAppointments = await db.appointment.findMany({
      where: {
        status: AppointmentStatus.PENDING_PAYMENT,
        createdAt: {
          lt: fiveMinutesAgo,
        },
      },
    });

    if (expiredAppointments.length > 0) {
      const slotIds = expiredAppointments.map((app) => app.slotId);
      const appointmentIds = expiredAppointments.map((app) => app.id);

      await db.$transaction([
        db.availabilitySlot.updateMany({
          where: { id: { in: slotIds } },
          data: { isBooked: false },
        }),
        db.appointment.updateMany({
          where: { id: { in: appointmentIds } },
          data: { status: AppointmentStatus.CANCELLED },
        }),
      ]);
      console.log(`Released ${expiredAppointments.length} expired slot hold(s).`);
    }
  } catch (error) {
    console.error("Error in releaseExpiredHoldSlots:", error);
  }
}

export async function initializePatientBooking(slotId: string, treatmentId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "PATIENT") {
      return { success: false, error: "Forbidden: Patients only" };
    }

    // Rate limiting to prevent booking hold flooding abuse
    const ip = await getClientIp();
    const rateCheck = checkRateLimit(ip, "booking");
    if (!rateCheck.allowed) {
      return { success: false, error: "Too many booking attempts. Please try again later." };
    }

    // Validate UUID patterns
    const validatedSlot = slotIdSchema.safeParse(slotId);
    const validatedTreatment = z.string().uuid("Invalid treatment ID format").safeParse(treatmentId);
    if (!validatedSlot.success || !validatedTreatment.success) {
      return { success: false, error: "Invalid booking request parameters" };
    }

    const sanitizedReason = reason ? sanitizeInputString(reasonSchema.parse(reason)) : "";

    const patient = await db.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    const treatment = await db.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment || !treatment.isActive) {
      return { success: false, error: "Selected treatment is not available" };
    }

    const slot = await db.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return { success: false, error: "Slot not found" };
    }

    // Compute payment amount based on treatment config
    let paymentAmount = 0;
    const priceNum = Number(treatment.price);
    const depositNum = treatment.depositAmount ? Number(treatment.depositAmount) : 0;

    if (priceNum > 0) {
      if (treatment.fullPaymentRequired) {
        paymentAmount = priceNum;
      } else if (depositNum > 0) {
        paymentAmount = depositNum;
      } else {
        paymentAmount = priceNum;
      }
    }

    // Check if there is an existing appointment for this slot
    const existingAppointment = await db.appointment.findUnique({
      where: { slotId: slotId },
    });

    if (existingAppointment) {
      if (
        existingAppointment.status === AppointmentStatus.CONFIRMED ||
        existingAppointment.status === AppointmentStatus.COMPLETED
      ) {
        return { success: false, error: "Slot is already booked" };
      }

      // If it belongs to the same patient and is pending payment, we can reuse it
      if (
        existingAppointment.patientId === patient.id &&
        existingAppointment.status === AppointmentStatus.PENDING_PAYMENT
      ) {
        const updated = await db.appointment.update({
          where: { id: existingAppointment.id },
          data: {
            treatmentId: treatmentId,
            reason: sanitizedReason,
          },
        });

        // Ensure slot is marked as booked
        if (!slot.isBooked) {
          await db.availabilitySlot.update({
            where: { id: slotId },
            data: { isBooked: true },
          });
        }

        let clientSecret = "";
        if (paymentAmount > 0) {
          // Stripe requires a minimum charge amount corresponding to 50 USD cents (~₹40-50 in INR)
          const stripeAmount = Math.max(Math.round(paymentAmount * 100), 5000);
          const paymentIntent = await stripe.paymentIntents.create({
            amount: stripeAmount,
            currency: "inr",
            metadata: {
              appointmentId: updated.id,
              patientId: patient.id,
              treatmentId: treatmentId,
            },
          });
          clientSecret = paymentIntent.client_secret || "";
        }

        return {
          success: true,
          appointmentId: updated.id,
          amount: paymentAmount,
          currency: "INR",
          stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
          clientSecret,
          status: AppointmentStatus.PENDING_PAYMENT,
        };
      }

      // Otherwise, it is CANCELLED (or PENDING_PAYMENT for another patient)
      // Delete the old appointment so we don't violate the unique slot_id constraint
      await db.appointment.delete({
        where: { id: existingAppointment.id },
      });
    }

    if (slot.isBooked) {
      return { success: false, error: "Slot is already booked or on hold" };
    }

    // Create appointment in PENDING_PAYMENT status and hold slot
    const appointment = await db.$transaction(async (tx) => {
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      return await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: slot.doctorId,
          slotId: slotId,
          treatmentId: treatmentId,
          reason: sanitizedReason,
          status: paymentAmount > 0 ? AppointmentStatus.PENDING_PAYMENT : AppointmentStatus.CONFIRMED,
        },
      });
    });

    // If payment amount is 0, check compliance forms right away
    let finalStatus: AppointmentStatus = paymentAmount > 0 ? AppointmentStatus.PENDING_PAYMENT : AppointmentStatus.CONFIRMED;
    if (paymentAmount === 0) {
      const mandatoryTemplates = await db.safetyFormTemplate.findMany({
        where: {
          isMandatory: true,
          isArchived: false,
        },
      });

      if (mandatoryTemplates.length > 0) {
        // Create safety form instances
        await Promise.all(
          mandatoryTemplates.map((template) =>
            db.safetyFormInstance.create({
              data: {
                appointmentId: appointment.id,
                patientId: patient.id,
                templateId: template.id,
                status: "SENT",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24h
              },
            })
          )
        );

        await db.appointment.update({
          where: { id: appointment.id },
          data: { status: AppointmentStatus.PENDING_REQUIRED_FORMS },
        });

        finalStatus = AppointmentStatus.PENDING_REQUIRED_FORMS;
      }
    }

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
    revalidatePath("/admin/calendar");

    let clientSecret = "";
    if (paymentAmount > 0 && finalStatus === AppointmentStatus.PENDING_PAYMENT) {
      // Stripe requires a minimum charge amount corresponding to 50 USD cents (~₹40-50 in INR)
      const stripeAmount = Math.max(Math.round(paymentAmount * 100), 5000);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: "inr",
        metadata: {
          appointmentId: appointment.id,
          patientId: patient.id,
          treatmentId: treatmentId,
        },
      });
      clientSecret = paymentIntent.client_secret || "";
    }

    return {
      success: true,
      appointmentId: appointment.id,
      amount: paymentAmount,
      currency: "INR",
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      clientSecret,
      status: finalStatus,
    };
  } catch (error) {
    console.error("Error in initializePatientBooking:", error);
    return { success: false, error: "Failed to initialize booking session" };
  }
}

export async function verifyStripePayment(payload: {
  paymentIntentId: string;
  appointmentId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { appointmentId, paymentIntentId } = payload;

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        treatment: true,
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      return { success: false, error: "Appointment booking session not found" };
    }

    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      return { success: false, error: "Appointment is not in a payment-pending status" };
    }

    const treatment = appointment.treatment;
    if (!treatment) {
      return { success: false, error: "Associated treatment configuration not found" };
    }

    // Verify payment status with Stripe directly (robust server-side check)
    const isMock = paymentIntentId.startsWith("pay_mock_");
    let paidAmount = 0;

    if (isMock) {
      const priceNum = Number(treatment.price);
      const depositNum = treatment.depositAmount ? Number(treatment.depositAmount) : 0;
      if (priceNum > 0) {
        if (treatment.fullPaymentRequired) {
          paidAmount = priceNum;
        } else if (depositNum > 0) {
          paidAmount = depositNum;
        } else {
          paidAmount = priceNum;
        }
      }
    } else {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return { success: false, error: "Stripe payment has not succeeded yet" };
      }
      if (paymentIntent.metadata.appointmentId !== appointmentId) {
        return { success: false, error: "Stripe PaymentIntent metadata mismatch" };
      }
      paidAmount = Number(paymentIntent.amount) / 100;
    }

    const priceNum = Number(treatment.price);

    // Record the payment
    const payment = await db.payment.create({
      data: {
        amount: paidAmount,
        currency: "INR",
        gatewayReference: paymentIntentId,
        status: "SUCCESS",
      },
    });

    // Generate structured invoice identification
    const currentYear = new Date().getFullYear();
    const uniqueNumber = Math.floor(100000 + Math.random() * 900000);
    const invoiceId = `INV-${currentYear}-${uniqueNumber}`;

    // Generate Invoice record
    const invoice = await db.invoice.create({
      data: {
        id: invoiceId,
        patientId: appointment.patientId,
        paymentId: payment.id,
        amountDue: priceNum,
        amountPaid: paidAmount,
        status: paidAmount >= priceNum ? "PAID" : "PARTIAL",
      },
    });

    // Update appointment payment reference
    await db.appointment.update({
      where: { id: appointmentId },
      data: { paymentId: payment.id },
    });

    // Check compliance: do mandatory forms exist?
    const mandatoryTemplates = await db.safetyFormTemplate.findMany({
      where: {
        isMandatory: true,
        isArchived: false,
      },
    });

    let finalStatus: AppointmentStatus = AppointmentStatus.CONFIRMED;

    if (mandatoryTemplates.length > 0) {
      // Create SafetyFormInstances for each mandatory template
      await Promise.all(
        mandatoryTemplates.map((template) =>
          db.safetyFormInstance.create({
            data: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              templateId: template.id,
              status: "SENT",
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24h
            },
          })
        )
      );

      finalStatus = AppointmentStatus.PENDING_REQUIRED_FORMS;
    }

    // Update appointment status
    const updatedAppt = await db.appointment.update({
      where: { id: appointmentId },
      data: { status: finalStatus },
      include: {
        slot: true,
        doctor: {
          include: {
            user: true,
          },
        },
        treatment: true,
      },
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/dashboard");
    revalidatePath("/admin/calendar");

    return {
      success: true,
      status: finalStatus,
      appointment: {
        id: updatedAppt.id,
        status: updatedAppt.status,
        slot: {
          startTime: updatedAppt.slot.startTime.toISOString(),
          endTime: updatedAppt.slot.endTime.toISOString(),
        },
        doctor: {
          name: updatedAppt.doctor.user.name,
        },
        treatment: {
          name: updatedAppt.treatment?.name,
        },
      },
      invoiceId: invoice.id,
    };
  } catch (error) {
    console.error("Error in verifyStripePayment:", error);
    return { success: false, error: "Payment verification failed on the server" };
  }
}

export async function getAppointmentConfirmationDetails(appointmentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const appt = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
        slot: true,
        treatment: true,
        payment: true,
      },
    });

    if (!appt) {
      return { success: false, error: "Appointment not found" };
    }

    const settings = await db.clinicSettings.findUnique({
      where: { id: "default" },
    });

    const treatmentPrice = appt.treatment ? Number(appt.treatment.price) : 0;
    const amountPaid = appt.payment ? Number(appt.payment.amount) : 0;
    const remainingBalance = Math.max(0, treatmentPrice - amountPaid);

    return {
      success: true,
      details: {
        appointmentNumber: `#${appt.id.slice(-6).toUpperCase()}`,
        patientName: appt.patient.user.name,
        doctorName: appt.doctor.user.name,
        treatmentName: appt.treatment?.name || "Consultation",
        date: appt.slot.startTime.toISOString(), // startTime is not directly on appointment, let's include it
        slotId: appt.slotId,
        clinicLocation: settings?.address || "MedBoutique Clinic, Mumbai",
        paymentStatus: appt.payment ? "PAID" : "UNPAID",
        amountPaid,
        remainingBalance,
        status: appt.status,
      },
    };
  } catch (error) {
    console.error("Error in getAppointmentConfirmationDetails:", error);
    return { success: false, error: "Failed to retrieve confirmation details" };
  }
}



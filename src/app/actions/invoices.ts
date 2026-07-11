"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

/**
 * Returns all data needed to render an industry-standard invoice PDF on the client.
 * Includes clinic header, patient details, itemized services, payment breakdown, and invoice metadata.
 */
export async function getInvoiceDetails(invoiceId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!invoiceId || typeof invoiceId !== "string") {
      return { success: false, error: "Invalid invoice ID" };
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        payment: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Authorization: Patient can only view own invoices, Doctor/Receptionist can view all
    if (session.user.role === "PATIENT" && invoice.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden" };
    }

    // Find the appointment linked to this payment to get treatment & doctor details
    let treatmentName = "Consultation";
    let treatmentDuration = 60;
    let doctorName = "Clinic Physician";
    let appointmentDate: string | null = null;

    if (invoice.paymentId) {
      const appointment = await db.appointment.findFirst({
        where: { paymentId: invoice.paymentId },
        include: {
          treatment: true,
          doctor: {
            include: {
              user: true,
            },
          },
          slot: true,
        },
      });

      if (appointment) {
        treatmentName = appointment.treatment?.name || "Consultation";
        treatmentDuration = appointment.treatment?.duration || 60;
        doctorName = appointment.doctor.user.name;
        appointmentDate = appointment.slot.startTime.toISOString();
      }
    }

    // Load clinic settings for invoice header
    const settings = await db.clinicSettings.findUnique({
      where: { id: "default" },
    });

    const clinicName = settings?.clinicName || "MedBoutique Clinic";
    const clinicPhone = settings?.phone || "+91 98765 43210";
    const clinicAddress = settings?.address || "Suite 402, Pacific Mall, Linking Road, Bandra West, Mumbai 400050";
    const clinicSpecialty = settings?.specialty || "Dermatology & Aesthetics";
    const clinicDoctorName = settings?.doctorName || "Dr. Aisha Sharma";

    return {
      success: true,
      data: {
        // Invoice Header
        invoiceId: invoice.id,
        invoiceDate: invoice.createdAt.toISOString(),
        invoiceStatus: invoice.status,

        // Clinic Information
        clinicName,
        clinicPhone,
        clinicAddress,
        clinicSpecialty,
        clinicDoctorName,

        // Patient Information
        patientName: invoice.patient.user.name,
        patientEmail: invoice.patient.user.email,
        patientPhone: invoice.patient.user.phone || "N/A",

        // Service Line Items
        treatmentName,
        treatmentDuration,
        doctorName,
        appointmentDate,

        // Financials
        amountDue: Number(invoice.amountDue),
        amountPaid: Number(invoice.amountPaid),
        balanceDue: Math.max(0, Number(invoice.amountDue) - Number(invoice.amountPaid)),
        currency: "INR",

        // Payment Reference
        paymentReference: invoice.payment?.gatewayReference || "N/A",
        paymentStatus: invoice.payment?.status || "N/A",
        paymentDate: invoice.payment?.createdAt.toISOString() || null,
      },
    };
  } catch (error) {
    console.error("Error in getInvoiceDetails:", error);
    return { success: false, error: "Failed to retrieve invoice details" };
  }
}

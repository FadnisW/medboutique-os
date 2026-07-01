"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// ── Allowed invoice statuses ──
const VALID_INVOICE_STATUSES = new Set(["PAID", "PARTIAL", "UNPAID"]);

export async function getBillingData() {
  try {
    // ── Auth Guard ──────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "DOCTOR" && session.user.role !== "RECEPTIONIST") {
      return { success: false, error: "Forbidden" };
    }

    const invoices = await db.invoice.findMany({
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const patients = await db.patientProfile.findMany({
      include: {
        user: true,
      },
    });

    // Compute metrics
    let totalRevenue = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalRevenue += Number(inv.amountPaid);
      const remaining = Number(inv.amountDue) - Number(inv.amountPaid);
      if (remaining > 0) {
        totalPending += remaining;
      }
    });

    const payments = await db.payment.findMany();
    const totalRefunded = payments
      .filter((p) => p.status === "REFUNDED" || p.status === "FAILED")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        patientName: inv.patient.user.name,
        patientId: inv.patientId,
        amountDue: Number(inv.amountDue),
        amountPaid: Number(inv.amountPaid),
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
        paymentId: inv.paymentId,
      })),
      patients: patients.map((p) => ({
        id: p.id,
        name: p.user.name,
      })),
      metrics: {
        monthlyRevenue: totalRevenue,
        pendingPayments: totalPending,
        refunds: totalRefunded || 0,
      },
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error in getBillingData:", error);
    return { success: false, error: "Failed to load billing data" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string, amountPaid: number) {
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
    if (!invoiceId || typeof invoiceId !== "string" || invoiceId.length > 100) {
      return { success: false, error: "Invalid invoice ID" };
    }
    if (!VALID_INVOICE_STATUSES.has(status)) {
      return { success: false, error: "Invalid status. Must be PAID, PARTIAL, or UNPAID" };
    }
    if (typeof amountPaid !== "number" || isNaN(amountPaid) || amountPaid < 0) {
      return { success: false, error: "Amount paid must be a non-negative number" };
    }
    // Cap at a reasonable maximum to prevent abuse
    if (amountPaid > 10_000_000) {
      return { success: false, error: "Amount exceeds maximum allowed value" };
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Business rule: amountPaid cannot exceed amountDue
    if (amountPaid > Number(invoice.amountDue)) {
      return { success: false, error: "Amount paid cannot exceed amount due" };
    }

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        amountPaid: amountPaid,
      },
    });

    revalidatePath("/admin/billing");
    return { success: true, invoice: { id: updated.id, status: updated.status } };
  } catch (error: unknown) {
    console.error("Error in updateInvoiceStatus:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}

export async function issueInvoice(patientId: string, amountDue: number, status: string) {
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
    if (typeof amountDue !== "number" || isNaN(amountDue) || amountDue <= 0) {
      return { success: false, error: "Amount must be a positive number" };
    }
    if (amountDue > 10_000_000) {
      return { success: false, error: "Amount exceeds maximum allowed value" };
    }
    if (!VALID_INVOICE_STATUSES.has(status)) {
      return { success: false, error: "Invalid status. Must be PAID, PARTIAL, or UNPAID" };
    }

    // Verify patient exists to prevent orphan records
    const patient = await db.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    const amountPaid = status === "PAID" ? amountDue : 0;

    const invoice = await db.invoice.create({
      data: {
        patientId,
        amountDue,
        amountPaid,
        status,
      },
    });

    revalidatePath("/admin/billing");
    return { success: true, invoice: { id: invoice.id, status: invoice.status } };
  } catch (error: unknown) {
    console.error("Error in issueInvoice:", error);
    return { success: false, error: "Failed to issue invoice" };
  }
}

/**
 * Returns all invoices and summary statistics for the logged-in patient.
 */
export async function getPatientInvoices() {
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

    const invoices = await db.invoice.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    let totalSpent = 0;
    let outstandingBalance = 0;
    let nextDueDate: Date | null = null;

    invoices.forEach((inv) => {
      totalSpent += Number(inv.amountPaid);
      const remaining = Number(inv.amountDue) - Number(inv.amountPaid);
      if (remaining > 0) {
        outstandingBalance += remaining;
        if (!nextDueDate || inv.createdAt < nextDueDate) {
          nextDueDate = inv.createdAt;
        }
      }
    });

    return {
      success: true,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        amountDue: Number(inv.amountDue),
        amountPaid: Number(inv.amountPaid),
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
      })),
      stats: {
        totalSpent,
        outstandingBalance,
        nextDueDate: nextDueDate ? (nextDueDate as Date).toISOString() : null,
      },
    };
  } catch (error: unknown) {
    console.error("Error in getPatientInvoices:", error);
    return { success: false, error: "Failed to load invoices" };
  }
}

/**
 * Initializes a Stripe PaymentIntent for the outstanding balance of a specific invoice.
 */
export async function initializeInvoicePayment(invoiceId: string) {
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
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Verify ownership
    if (invoice.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden: You do not own this invoice" };
    }

    const remainingBalance = Number(invoice.amountDue) - Number(invoice.amountPaid);
    if (remainingBalance <= 0 || invoice.status === "PAID") {
      return { success: false, error: "Invoice is already fully paid" };
    }

    // Stripe requires a minimum charge amount corresponding to 50 USD cents (~₹40-50 in INR)
    const stripeAmount = Math.max(Math.round(remainingBalance * 100), 5000);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "inr",
      metadata: {
        invoiceId: invoice.id,
        patientId: invoice.patientId,
      },
    });

    return {
      success: true,
      amount: remainingBalance,
      currency: "INR",
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      clientSecret: paymentIntent.client_secret || "",
    };
  } catch (error) {
    console.error("Error in initializeInvoicePayment:", error);
    return { success: false, error: "Failed to initialize invoice payment session" };
  }
}

/**
 * Verifies that a Stripe payment for an invoice's outstanding balance was successful,
 * updating the paid amount and invoice status in the database.
 */
export async function verifyInvoicePayment(payload: {
  invoiceId: string;
  paymentIntentId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { invoiceId, paymentIntentId } = payload;

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        patient: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden: You do not own this invoice" };
    }

    const isMock = paymentIntentId.startsWith("pay_mock_");
    let paidAmount = 0;

    const remainingBalance = Number(invoice.amountDue) - Number(invoice.amountPaid);

    if (isMock) {
      paidAmount = remainingBalance;
    } else {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return { success: false, error: "Stripe payment has not succeeded yet" };
      }
      if (paymentIntent.metadata.invoiceId !== invoiceId) {
        return { success: false, error: "Stripe PaymentIntent metadata mismatch" };
      }
      paidAmount = Number(paymentIntent.amount) / 100;
    }

    const newAmountPaid = Number(invoice.amountPaid) + paidAmount;
    const isFullyPaid = newAmountPaid >= Number(invoice.amountDue);

    // Record the payment entry
    const payment = await db.payment.create({
      data: {
        amount: paidAmount,
        currency: "INR",
        gatewayReference: paymentIntentId,
        status: "SUCCESS",
      },
    });

    // Update the invoice status and totals
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: isFullyPaid ? "PAID" : "PARTIAL",
        paymentId: payment.id,
      },
    });

    revalidatePath("/portal/invoices");
    revalidatePath("/admin/billing");

    return {
      success: true,
      isFullyPaid,
      amountPaid: newAmountPaid,
    };
  } catch (error) {
    console.error("Error in verifyInvoicePayment:", error);
    return { success: false, error: "Failed to verify payment on the server" };
  }
}



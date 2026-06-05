"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

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

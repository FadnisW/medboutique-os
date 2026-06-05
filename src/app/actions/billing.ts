"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getBillingData() {
  try {
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
    // 1. Total Paid Revenue (all time or current month)
    let totalRevenue = 0;
    // 2. Pending payments (due - paid)
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalRevenue += Number(inv.amountPaid);
      const remaining = Number(inv.amountDue) - Number(inv.amountPaid);
      if (remaining > 0) {
        totalPending += remaining;
      }
    });

    // 3. Simple Mock/Derived refund metrics or payments failures
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
  } catch (error: any) {
    console.error("Error in getBillingData:", error);
    return { success: false, error: error.message || "Failed to load billing data" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string, amountPaid: number) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error("Invoice not found");

    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        amountPaid: amountPaid,
      },
    });

    revalidatePath("/admin/billing");
    return { success: true, invoice: updated };
  } catch (error: any) {
    console.error("Error in updateInvoiceStatus:", error);
    return { success: false, error: error.message || "Failed to update invoice" };
  }
}

export async function issueInvoice(patientId: string, amountDue: number, status: string) {
  try {
    if (!patientId) throw new Error("Patient is required");
    if (amountDue <= 0) throw new Error("Amount must be greater than zero");

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
    return { success: true, invoice };
  } catch (error: any) {
    console.error("Error in issueInvoice:", error);
    return { success: false, error: error.message || "Failed to issue invoice" };
  }
}

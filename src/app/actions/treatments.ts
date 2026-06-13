"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTreatments(onlyActive = true) {
  try {
    const treatments = await db.treatment.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });

    // Serialize decimal values to plain numbers for Next.js Server Action compatibility
    const serialized = treatments.map(t => ({
      ...t,
      price: Number(t.price),
      depositAmount: t.depositAmount ? Number(t.depositAmount) : null,
    }));

    return { success: true, treatments: serialized };
  } catch (error) {
    console.error("Error in getTreatments:", error);
    return { success: false, error: "Failed to load treatments" };
  }
}

export async function getTreatmentById(id: string) {
  try {
    const treatment = await db.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      return { success: false, error: "Treatment not found" };
    }

    const serialized = {
      ...treatment,
      price: Number(treatment.price),
      depositAmount: treatment.depositAmount ? Number(treatment.depositAmount) : null,
    };

    return { success: true, treatment: serialized };
  } catch (error) {
    console.error("Error in getTreatmentById:", error);
    return { success: false, error: "Failed to load treatment details" };
  }
}

export async function createTreatment(data: {
  name: string;
  description?: string;
  duration: number;
  price: number;
  depositAmount?: number | null;
  fullPaymentRequired: boolean;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized. Only Doctors can create treatments." };
    }

    const treatment = await db.treatment.create({
      data: {
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        depositAmount: data.depositAmount ?? null,
        fullPaymentRequired: data.fullPaymentRequired,
        isActive: true,
      },
    });

    revalidatePath("/admin/settings");
    return {
      success: true,
      treatment: {
        ...treatment,
        price: Number(treatment.price),
        depositAmount: treatment.depositAmount ? Number(treatment.depositAmount) : null,
      },
    };
  } catch (error) {
    console.error("Error in createTreatment:", error);
    return { success: false, error: "Failed to create treatment" };
  }
}

export async function updateTreatment(
  id: string,
  data: {
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    depositAmount?: number | null;
    fullPaymentRequired?: boolean;
    isActive?: boolean;
  }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized. Only Doctors can update treatments." };
    }

    const treatment = await db.treatment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.depositAmount !== undefined && { depositAmount: data.depositAmount }),
        ...(data.fullPaymentRequired !== undefined && { fullPaymentRequired: data.fullPaymentRequired }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/admin/settings");
    return {
      success: true,
      treatment: {
        ...treatment,
        price: Number(treatment.price),
        depositAmount: treatment.depositAmount ? Number(treatment.depositAmount) : null,
      },
    };
  } catch (error) {
    console.error("Error in updateTreatment:", error);
    return { success: false, error: "Failed to update treatment" };
  }
}

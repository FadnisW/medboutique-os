"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getFormTemplates() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    const templates = await db.safetyFormTemplate.findMany({
      where: {
        isArchived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, templates };
  } catch (error) {
    console.error("Error in getFormTemplates:", error);
    return { success: false, error: "Failed to load templates" };
  }
}

export async function createFormTemplate(data: { title: string; content: string; category: string; isMandatory: boolean }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized. Only Doctors can manage templates." };
    }

    const template = await db.safetyFormTemplate.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        isMandatory: data.isMandatory,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error in createFormTemplate:", error);
    return { success: false, error: "Failed to create template" };
  }
}

export async function editFormTemplate(id: string, data: { title: string; content: string; category: string; isMandatory: boolean }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized. Only Doctors can manage templates." };
    }

    const template = await db.safetyFormTemplate.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        isMandatory: data.isMandatory,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error in editFormTemplate:", error);
    return { success: false, error: "Failed to update template" };
  }
}

export async function duplicateFormTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.safetyFormTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Template not found" };
    }

    // Append copy suffix or unique indicator
    const newTitle = `${existing.title} (Copy) - ${Date.now().toString().slice(-4)}`;

    const template = await db.safetyFormTemplate.create({
      data: {
        title: newTitle,
        content: existing.content,
        category: existing.category,
        isMandatory: existing.isMandatory,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error in duplicateFormTemplate:", error);
    return { success: false, error: "Failed to duplicate template" };
  }
}

export async function archiveFormTemplate(id: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "DOCTOR") {
      return { success: false, error: "Unauthorized" };
    }

    const template = await db.safetyFormTemplate.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, template };
  } catch (error) {
    console.error("Error in archiveFormTemplate:", error);
    return { success: false, error: "Failed to archive template" };
  }
}

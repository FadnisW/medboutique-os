"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { TimeOfDay } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Retrieves the active CarePlan with its tasks for the logged-in patient.
 */
export async function getActiveCarePlan() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const patient = await db.patientProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return { success: false, error: "Patient profile not found" };
    }

    const carePlan = await db.carePlan.findFirst({
      where: { patientId: patient.id },
      include: {
        tasks: {
          orderBy: { scheduledTime: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!carePlan) {
      return { success: true, carePlan: null };
    }

    return {
      success: true,
      carePlan: {
        id: carePlan.id,
        protocolName: carePlan.protocolName,
        assignedBy: carePlan.assignedBy,
        tip: carePlan.tip,
        startDate: carePlan.startDate.toISOString(),
        tasks: carePlan.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          instruction: t.instruction,
          timeOfDay: t.timeOfDay,
          scheduledTime: t.scheduledTime,
          completed: t.completed,
        })),
      },
    };
  } catch (error: unknown) {
    console.error("Error in getActiveCarePlan:", error);
    return { success: false, error: "Failed to retrieve care plan" };
  }
}

/**
 * Toggles a CarePlanTask's completion status.
 */
export async function toggleCarePlanTask(taskId: string, completed: boolean) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Input validation
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Invalid task ID" };
    }

    const task = await db.carePlanTask.findUnique({
      where: { id: taskId },
      include: {
        carePlan: {
          include: { patient: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Verify ownership
    if (task.carePlan.patient.userId !== session.user.id) {
      return { success: false, error: "Forbidden: Not your task" };
    }

    await db.carePlanTask.update({
      where: { id: taskId },
      data: { completed },
    });

    revalidatePath("/portal/care-plan");
    revalidatePath("/portal/dashboard");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in toggleCarePlanTask:", error);
    return { success: false, error: "Failed to update task status" };
  }
}

/**
 * Auto-generates a CarePlan and tasks from a diagnostic submission.
 * Saves the submission in the database first.
 */
export async function submitDiagnosticQuiz(
  concerns: string[],
  skinProfile: { type: string; midday: string; concern: string; previous: string },
  medicalHistory: { allergies: boolean; medication: boolean; pregnant: boolean; notes: string },
  contact: { name: string; email: string; phone: string }
) {
  try {
    // 1. Basic validation
    if (!contact.name || !contact.email || !contact.phone) {
      return { success: false, error: "Contact fields are required" };
    }

    // Find if user/patient exists with this email or phone
    let patient = await db.patientProfile.findFirst({
      where: {
        user: {
          OR: [
            { email: contact.email },
            { phone: contact.phone }
          ]
        }
      },
      include: { user: true }
    });

    // If patient profile doesn't exist, we can't create care plans in this step
    // But we will save the submission in any case
    const submission = await db.diagnosticSubmission.create({
      data: {
        patientId: patient?.id || null,
        leadName: contact.name,
        leadEmail: contact.email,
        leadPhone: contact.phone,
        quizType: "SKIN_TYPE",
        answers: {
          concerns,
          skinProfile,
          medicalHistory
        },
        recommendation: generateQuizRecommendation(skinProfile.type, concerns[0]),
      }
    });

    // If patient exists, generate care plan
    if (patient) {
      // Clear any older care plans to simulate updating protocol
      await db.carePlan.deleteMany({
        where: { patientId: patient.id }
      });

      const carePlanData = generateCarePlanTemplate(skinProfile.type, concerns[0]);

      await db.carePlan.create({
        data: {
          patientId: patient.id,
          assignedBy: "Dr. Aisha Rao",
          protocolName: carePlanData.protocolName,
          tip: carePlanData.tip,
          tasks: {
            create: carePlanData.tasks.map(t => ({
              title: t.title,
              instruction: t.instruction,
              timeOfDay: t.timeOfDay,
              scheduledTime: t.scheduledTime,
              completed: false
            }))
          }
        }
      });
    }

    return {
      success: true,
      recommendation: submission.recommendation,
      score: 72 // Return consistent preview score
    };
  } catch (error: unknown) {
    console.error("Error in submitDiagnosticQuiz:", error);
    return { success: false, error: "Failed to submit assessment" };
  }
}

// Helper: Generates static text recommendation based on answers
function generateQuizRecommendation(skinType: string, concern: string): string {
  return `Based on your ${skinType} skin type and wellness focus on ${concern}, we recommend starting with a gentle hydration treatment. avoid intensive acids for 48 hours.`;
}

// Helper: Returns structured care plan templates
function generateCarePlanTemplate(skinType: string, concern: string) {
  const isDry = skinType.toLowerCase() === "dry" || skinType.toLowerCase() === "sensitive";
  
  if (isDry) {
    return {
      protocolName: "Post-HydraFacial Protocol",
      tip: "Avoid retinol-based products for the next 72 hours post-treatment. Your skin barrier is in recovery mode.",
      tasks: [
        { title: "CeraVe Hydrating Cleanser", instruction: "Gently massage for 60 seconds, rinse with cool water.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:00 AM" },
        { title: "Vitamin C Serum (10%)", instruction: "Apply 4–5 drops to face and neck. Allow to absorb fully.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:05 AM" },
        { title: "Moisturiser (La Roche-Posay)", instruction: "Pat gently — do not rub. Focus on dry zones.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:10 AM" },
        { title: "SPF 50 Sunscreen", instruction: "2 finger-length rule. Reapply every 2 hours outdoors.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:15 AM" },
        { title: "Micellar Water Cleanse", instruction: "Use cotton pads to remove SPF and makeup.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:00 PM" },
        { title: "Gentle Foaming Cleanser", instruction: "Double cleanse to remove all residue.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:05 PM" },
        { title: "Peptide Night Cream", instruction: "Apply on clean, damp skin. No retinol for 72 hrs post-treatment.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:15 PM" },
      ]
    };
  } else {
    // Oily/Combination/Normal templates
    return {
      protocolName: "Acne & Sebum Clarifying Plan",
      tip: "Apply spot treatments only at night, and ensure your sunscreen is oil-free to avoid clogging pores.",
      tasks: [
        { title: "Salicylic Acid Cleanser", instruction: "Wash with warm water, focusing on T-zone.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:00 AM" },
        { title: "Niacinamide Serum", instruction: "Pat 3-4 drops to reduce skin shine and refine pores.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:05 AM" },
        { title: "Lightweight Mattifying Gel", instruction: "Apply a pea-sized amount to lock in hydration.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:10 AM" },
        { title: "SPF 30 Oil-Free Matte Sunscreen", instruction: "Ensure even coverage before stepping out.", timeOfDay: TimeOfDay.MORNING, scheduledTime: "08:15 AM" },
        { title: "Oil Cleanser", instruction: "Dissolve sunscreen and excess oil for 60 seconds.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:00 PM" },
        { title: "Foaming Gel Cleanser", instruction: "Wash thoroughly to ensure clean pores.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:05 PM" },
        { title: "Retinol 0.5% Serum", instruction: "Apply on completely dry skin. Avoid eye area.", timeOfDay: TimeOfDay.EVENING, scheduledTime: "09:15 PM" },
      ]
    };
  }
}

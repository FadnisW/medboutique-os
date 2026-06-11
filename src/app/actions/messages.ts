"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Retrieves conversations based on the user's active session role.
 * Patients retrieve their specific conversation threads.
 * Doctors and Receptionists retrieve all conversations in the system.
 */
export async function getConversations() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === "PATIENT") {
      // Find patient profile first
      const patient = await db.patientProfile.findUnique({
        where: { userId },
      });
      if (!patient) {
        return { success: false, error: "Patient profile not found" };
      }

      const conversations = await db.conversation.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: { user: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      return {
        success: true,
        conversations: conversations.map((c) => ({
          id: c.id,
          name: c.doctor.user.name,
          role: "DOCTOR",
          lastMessage: c.messages[0]?.content || "No messages yet",
          lastActive: c.updatedAt.toISOString(),
          unreadCount: 0, // Simplified for patient view
        })),
      };
    } else if (role === "DOCTOR" || role === "RECEPTIONIST") {
      // Admin dashboard sees all conversations
      const conversations = await db.conversation.findMany({
        include: {
          patient: {
            include: { user: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        success: true,
        conversations: conversations.map((c) => {
          const incomingUnread = c.messages.filter(
            (m) => m.senderId !== userId && !m.isRead
          ).length;

          return {
            id: c.id,
            name: c.patient.user.name,
            role: "PATIENT",
            lastMessage: c.messages[0]?.content || "No messages yet",
            lastActive: c.updatedAt.toISOString(),
            unreadCount: incomingUnread,
          };
        }),
      };
    }

    return { success: false, error: "Unsupported role" };
  } catch (error: unknown) {
    console.error("Error in getConversations:", error);
    return { success: false, error: "Failed to retrieve conversations" };
  }
}

/**
 * Fetches message history for a specific conversation ID.
 * Implements authorization guard to prevent external database access.
 */
export async function getMessages(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!conversationId || typeof conversationId !== "string") {
      return { success: false, error: "Invalid conversation ID" };
    }

    // Verify participant authority
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role === "PATIENT") {
      if (conversation.patient.userId !== userId) {
        return { success: false, error: "Forbidden: Not your conversation thread" };
      }
    } else if (role === "DOCTOR") {
      if (conversation.doctor.userId !== userId) {
        return { success: false, error: "Forbidden: Not your assigned conversation" };
      }
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: true,
      },
    });

    return {
      success: true,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        senderName: m.sender.name,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (error: unknown) {
    console.error("Error in getMessages:", error);
    return { success: false, error: "Failed to load messages" };
  }
}

/**
 * Creates and appends a new message under a conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!conversationId || typeof conversationId !== "string") {
      return { success: false, error: "Invalid conversation ID" };
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return { success: false, error: "Message content cannot be empty" };
    }
    if (content.length > 2000) {
      return { success: false, error: "Message exceeds 2000 character limit" };
    }

    const userId = session.user.id;

    // Verify conversation exists and participant authority
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    const role = session.user.role;
    if (role === "PATIENT") {
      if (conversation.patient.userId !== userId) {
        return { success: false, error: "Forbidden" };
      }
    } else if (role === "DOCTOR") {
      if (conversation.doctor.userId !== userId) {
        return { success: false, error: "Forbidden" };
      }
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim(),
      },
    });

    // Touch conversation to update timestamps
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Revalidate paths
    revalidatePath("/admin/messages");
    revalidatePath("/portal/messages");

    return {
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    console.error("Error in sendMessage:", error);
    return { success: false, error: "Failed to dispatch message" };
  }
}

/**
 * Helper server action to initialize a conversation if it doesn't exist yet.
 */
export async function startConversation(patientProfileId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    let resolvedPatientProfileId = patientProfileId;

    if (session.user.role === "PATIENT") {
      const patient = await db.patientProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!patient) {
        return { success: false, error: "Patient profile not found" };
      }
      resolvedPatientProfileId = patient.id;
    } else {
      if (!resolvedPatientProfileId) {
        return { success: false, error: "Patient Profile ID is required for clinical users" };
      }
    }

    const doctors = await db.doctorProfile.findMany();
    const doctorId = doctors[0]?.id;
    if (!doctorId) {
      return { success: false, error: "No doctors seeded in database" };
    }

    // Upsert conversation
    const conversation = await db.conversation.upsert({
      where: {
        patientId_doctorId: {
          patientId: resolvedPatientProfileId,
          doctorId,
        },
      },
      create: {
        patientId: resolvedPatientProfileId,
        doctorId,
      },
      update: {},
    });

    return { success: true, conversationId: conversation.id };
  } catch (error: unknown) {
    console.error("Error in startConversation:", error);
    return { success: false, error: "Failed to start conversation" };
  }
}

/**
 * Marks incoming messages as read for a conversation.
 */
export async function markAsRead(conversationId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    await db.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in markAsRead:", error);
    return { success: false, error: "Failed to mark read" };
  }
}

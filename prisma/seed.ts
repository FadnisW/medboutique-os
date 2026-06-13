// file: prisma/seed.ts

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.patientRecord.deleteMany();
  await prisma.safetyFormInstance.deleteMany();
  await prisma.patientStatusLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.diagnosticSubmission.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinicStatus.deleteMany();
  await prisma.safetyFormTemplate.deleteMany();

  console.log("🧹 Database cleared.");

  // Password hashes
  const salt = await bcrypt.genSalt(10);
  const doctorPasswordHash = await bcrypt.hash("doctor123", salt);
  const staffPasswordHash = await bcrypt.hash("staff123", salt);
  const patientPasswordHash = await bcrypt.hash("patient123", salt);

  // 1. Create Clinic Statuses
  console.log("📍 Seeding Clinic Statuses...");
  const checkedInStatus = await prisma.clinicStatus.create({
    data: { name: "Checked In", sortOrder: 1 }
  });
  const waitingLoungeStatus = await prisma.clinicStatus.create({
    data: { name: "Waiting Lounge", sortOrder: 2 }
  });
  const treatmentRoomStatus = await prisma.clinicStatus.create({
    data: { name: "Treatment Room A", sortOrder: 3 }
  });
  const checkOutStatus = await prisma.clinicStatus.create({
    data: { name: "Check-out", sortOrder: 4 }
  });

  // 2. Create Safety Form Templates
  console.log("📄 Seeding Safety Form Templates...");
  const botoxTemplate = await prisma.safetyFormTemplate.create({
    data: {
      title: "Botox Treatment Consent",
      content: "I hereby consent to receive Botox injections. I understand the risks include localized swelling, redness, and temporary muscle weakness...",
      category: "CONSENT",
      isMandatory: true
    }
  });
  const laserTemplate = await prisma.safetyFormTemplate.create({
    data: {
      title: "Laser Resurfacing Consent",
      content: "I hereby consent to undergo Laser skin resurfacing. I understand that the treatment carries risks of temporary hyperpigmentation, minor scarring, and mild blistering...",
      category: "CONSENT",
      isMandatory: true
    }
  });
  const historyTemplate = await prisma.safetyFormTemplate.create({
    data: {
      title: "Aesthetic Medical History",
      content: "Please list any pre-existing medical conditions, current medications, skincare routines, and allergies...",
      category: "HISTORY",
      isMandatory: true
    }
  });

  // 3. Create Doctor User & Profile
  console.log("👤 Creating Doctor user and profile...");
  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@medboutique.com",
      name: "Dr. Aisha Rao",
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      phone: "+919876543210",
      doctorProfile: {
        create: {
          specialty: "Aesthetic Dermatology",
          qualifications: "MD, DNB (Dermatology)",
          consultationFee: 1500.00,
        },
      },
    },
    include: {
      doctorProfile: true
    }
  });

  const doctorProfileId = doctorUser.doctorProfile!.id;

  // 4. Create Staff User & Profile
  console.log("👤 Creating Staff user and profile...");
  const staffUser = await prisma.user.create({
    data: {
      email: "receptionist@medboutique.com",
      name: "Simran Kapur",
      passwordHash: staffPasswordHash,
      role: Role.RECEPTIONIST,
      phone: "+919876543211",
      staffProfile: {
        create: {
          permissions: ["MANAGE_APPOINTMENTS", "MANAGE_BILLING"],
        },
      },
    },
  });

  // 5. Create Patient User & Profile (Eleanor Vance)
  console.log("👤 Creating Patient user and profile...");
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@example.com",
      name: "Eleanor Vance",
      passwordHash: patientPasswordHash,
      role: Role.PATIENT,
      phone: "+919876543212",
      patientProfile: {
        create: {
          dob: new Date("1995-06-15"),
          gender: "Female",
          bloodGroup: "O+",
          medicalHistory: "Mild seasonal allergies. No prior aesthetic treatments.",
          address: "Flat 402, Sea Breeze Apartments, Bandra West, Mumbai",
          carePlans: {
            create: {
              assignedBy: "Dr. Aisha Rao",
              protocolName: "Post-HydraFacial Protocol",
              tip: "Avoid retinol-based products for the next 72 hours post-treatment. Your skin barrier is in recovery mode.",
              tasks: {
                create: [
                  {
                    title: "CeraVe Hydrating Cleanser",
                    instruction: "Gently massage for 60 seconds, rinse with cool water.",
                    timeOfDay: "MORNING",
                    scheduledTime: "08:00 AM",
                    completed: true,
                  },
                  {
                    title: "Vitamin C Serum (10%)",
                    instruction: "Apply 4–5 drops to face and neck. Allow to absorb fully.",
                    timeOfDay: "MORNING",
                    scheduledTime: "08:05 AM",
                    completed: true,
                  },
                  {
                    title: "Peptide Night Cream",
                    instruction: "Apply on clean, damp skin. No retinol for 72 hrs post-treatment.",
                    timeOfDay: "EVENING",
                    scheduledTime: "09:15 PM",
                    completed: false,
                  },
                ],
              },
            },
          },
        },
      },
    },
    include: {
      patientProfile: true
    }
  });

  const patientProfileId = patientUser.patientProfile!.id;

  // Create another patient (Aria Sen)
  const ariaUser = await prisma.user.create({
    data: {
      email: "aria.sen@example.com",
      name: "Aria Sen",
      passwordHash: patientPasswordHash,
      role: Role.PATIENT,
      phone: "+919876543213",
      patientProfile: {
        create: {
          dob: new Date("1992-09-20"),
          gender: "Female",
          bloodGroup: "A+",
          medicalHistory: "None.",
          address: "12 Juhu Tara Road, Juhu, Mumbai",
        }
      }
    },
    include: {
      patientProfile: true
    }
  });

  const ariaProfileId = ariaUser.patientProfile!.id;

  // 6. Create Availability Slots for Today
  console.log("📅 Seeding Availability Slots and Appointments for Today...");
  const now = new Date();
  
  // Slot 1: 10:00 AM (already in the past)
  const startTime1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
  const endTime1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0, 0);
  const slot1 = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctorProfileId,
      startTime: startTime1,
      endTime: endTime1,
      isBooked: true
    }
  });

  // Slot 2: 11:30 AM (also in the past relative to current run time of 9pm)
  const startTime2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30, 0, 0);
  const endTime2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 30, 0, 0);
  const slot2 = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctorProfileId,
      startTime: startTime2,
      endTime: endTime2,
      isBooked: true
    }
  });

  // Slot 3: Future slot (for testing flow logic)
  const startTime3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0, 0);
  const endTime3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0, 0);
  const slot3 = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctorProfileId,
      startTime: startTime3,
      endTime: endTime3,
      isBooked: true
    }
  });

  // 7. Create Appointments for Today
  // Eleanor Vance's appointment 1: COMPLETED (should NOT show in active clinic flow)
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patientProfileId,
      doctorId: doctorProfileId,
      slotId: slot1.id,
      status: "COMPLETED",
      reason: "Botox injection treatment plan follow-up",
      notes: "Patient barrier looks healthy. Retinol restricted."
    }
  });

  // Aria Sen's appointment 2: CONFIRMED (time has arrived -> should show in active clinic flow)
  const appt2 = await prisma.appointment.create({
    data: {
      patientId: ariaProfileId,
      doctorId: doctorProfileId,
      slotId: slot2.id,
      status: "CONFIRMED",
      reason: "Laser Resurfacing initial consult"
    }
  });

  // Future appointment (time has NOT arrived -> should NOT show in active clinic flow)
  const futureAppt = await prisma.appointment.create({
    data: {
      patientId: patientProfileId,
      doctorId: doctorProfileId,
      slotId: slot3.id,
      status: "CONFIRMED",
      reason: "Quick follow-up consult"
    }
  });

  // 8. Create Patient Status Log for Aria Sen (in Wait lounge)
  await prisma.patientStatusLog.create({
    data: {
      appointmentId: appt2.id,
      statusId: waitingLoungeStatus.id,
      updatedById: staffUser.id
    }
  });

  // 9. Create Safety Form Instances
  // Eleanor Vance had completed Botox consent and Medical history
  await prisma.safetyFormInstance.create({
    data: {
      patientId: patientProfileId,
      templateId: botoxTemplate.id,
      appointmentId: appt1.id,
      status: "COMPLETED",
      isSigned: true,
      sentAt: new Date(now.getTime() - 3600000), // 1 hour ago
      sentById: doctorUser.id,
      viewedAt: new Date(now.getTime() - 3000000),
      completedAt: new Date(now.getTime() - 2500000)
    }
  });

  await prisma.safetyFormInstance.create({
    data: {
      patientId: patientProfileId,
      templateId: historyTemplate.id,
      appointmentId: appt1.id,
      status: "COMPLETED",
      isSigned: true,
      sentAt: new Date(now.getTime() - 3600000),
      sentById: doctorUser.id,
      viewedAt: new Date(now.getTime() - 3200000),
      completedAt: new Date(now.getTime() - 2800000)
    }
  });

  // Aria Sen has NOT completed Laser Resurfacing consent (only VIEWED)
  await prisma.safetyFormInstance.create({
    data: {
      patientId: ariaProfileId,
      templateId: laserTemplate.id,
      appointmentId: appt2.id,
      status: "VIEWED",
      isSigned: false,
      sentAt: new Date(now.getTime() - 1800000), // 30 mins ago
      sentById: staffUser.id,
      viewedAt: new Date(now.getTime() - 600000) // 10 mins ago
    }
  });

  // 10. Seed conversations and messages for Inbox
  console.log("💬 Seeding Conversation & Messages...");
  const convo = await prisma.conversation.create({
    data: {
      patientId: patientProfileId,
      doctorId: doctorProfileId
    }
  });

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: patientUser.id,
      content: "Hello Dr. Aisha, I am experiencing slight redness after using the morning serum. Is this normal?",
      isRead: false
    }
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.diagnosticSubmission.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Database cleared.");

  // Password hashes
  const salt = await bcrypt.genSalt(10);
  const doctorPasswordHash = await bcrypt.hash("doctor123", salt);
  const staffPasswordHash = await bcrypt.hash("staff123", salt);
  const patientPasswordHash = await bcrypt.hash("patient123", salt);

  // 1. Create Doctor User & Profile
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
  });

  // 2. Create Staff User & Profile
  console.log("👤 Creating Staff user and profile...");
  await prisma.user.create({
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

  // 3. Create Patient User & Profile
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
                    title: "Moisturiser (La Roche-Posay)",
                    instruction: "Pat gently — do not rub. Focus on dry zones.",
                    timeOfDay: "MORNING",
                    scheduledTime: "08:10 AM",
                    completed: false,
                  },
                  {
                    title: "SPF 50 Sunscreen",
                    instruction: "2 finger-length rule. Reapply every 2 hours outdoors.",
                    timeOfDay: "MORNING",
                    scheduledTime: "08:15 AM",
                    completed: false,
                  },
                  {
                    title: "Micellar Water Cleanse",
                    instruction: "Use cotton pads to remove SPF and makeup.",
                    timeOfDay: "EVENING",
                    scheduledTime: "09:00 PM",
                    completed: false,
                  },
                  {
                    title: "Gentle Foaming Cleanser",
                    instruction: "Double cleanse to remove all residue.",
                    timeOfDay: "EVENING",
                    scheduledTime: "09:05 PM",
                    completed: false,
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

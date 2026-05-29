import { PrismaClient } from "@prisma/client";

/**
 * Global object for storing the Prisma Client instance.
 * This prevents multiple instances of Prisma Client from being created
 * during hot-reloading in development.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * The Prisma Client instance.
 * It uses the existing global instance if available, otherwise creates a new one.
 * In development, it logs queries, errors, and warnings. In production, only errors.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Configure logging based on the environment
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Store the Prisma Client instance in the global object in non-production environments
// to reuse the same instance across hot-reloads.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export default db;

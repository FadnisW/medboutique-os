import { handlers } from "@/auth";

/**
 * Export NextAuth handlers for GET and POST requests.
 * This file serves as the catch-all API route for authentication endpoints.
 */
export const { GET, POST } = handlers;

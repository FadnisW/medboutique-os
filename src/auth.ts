import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dynamic lazy imports to prevent bundling Node.js modules into Vercel Edge Middleware
        const { default: db } = await import("@/lib/db");
        const { default: bcrypt } = await import("bcryptjs");

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        const dummyHash = "$2a$12$LRY3f4/b7jY.k.6QzKzve.7Z0J3Yw9H2E3W.t2x4nE7k4C4O0S5.y";
        const hashToCompare = user?.passwordHash || dummyHash;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          hashToCompare
        );

        if (!user || !isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * NextAuth configuration object exporting handlers, auth functions, and signIn/signOut.
 * Sets up credential-based authentication.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      // Define the credentials required for login
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Authorize function to validate user credentials against the database.
       * 
       * @param credentials - The user's input containing email and password.
       * @returns The user object if authentication is successful, null otherwise.
       */
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null; // Missing credentials
        }

        // Fetch the user from the database by email
        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        // Use a dummy hash for constant-time comparison to prevent user enumeration via timing attacks
        const dummyHash = "$2a$12$LRY3f4/b7jY.k.6QzKzve.7Z0J3Yw9H2E3W.t2x4nE7k4C4O0S5.y";
        const hashToCompare = user?.passwordHash || dummyHash;

        // Verify the provided password against the correct or dummy hashed password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          hashToCompare
        );

        if (!user || !isPasswordValid) {
          return null; // Incorrect email or password (constant time response)
        }

        // Return a partial user object to be stored in the session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback to attach user data (like id and role) to the token upon login.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role as string;
      }
      return token;
    },
    /**
     * Session callback to make user id and role accessible via the active session.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt", // Use JSON Web Tokens for session handling
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login", // Custom login page route
  },
  secret: process.env.AUTH_SECRET,
});


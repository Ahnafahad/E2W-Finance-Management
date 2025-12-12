import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check against environment variable (simple single admin)
        const adminEmail = process.env.ADMIN_EMAIL || "admin@e2w.com";
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";

        if (credentials.email === adminEmail) {
          const isValid = await bcrypt.compare(
            credentials.password,
            adminPasswordHash
          );

          if (isValid) {
            return {
              id: "admin-user",
              email: adminEmail,
              name: "Admin",
            };
          }
        }

        // Try database users (for future multi-user support)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user) {
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (isValid) {
            return {
              id: user.id,
              email: user.email,
              name: user.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

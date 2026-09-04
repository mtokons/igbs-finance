import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export type UserRole = "ADMIN" | "TREASURER" | "VIEWER" | string;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "igbs-local-development-secret-key-32chars";

// Sanitize NEXTAUTH_URL to prevent invalid redirects like https://https
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === "https" || process.env.NEXTAUTH_URL === "https://") {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = "https://igbs-finance.vercel.app";
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password.trim();

        try {
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
          });

          if (!user?.passwordHash) {
            console.warn(`[AUTH] User not found for email: ${email}`);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            console.warn(`[AUTH] Password invalid for user: ${email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error(`[AUTH] Exception in authorize for ${email}:`, error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.origin === baseUrl || parsed.hostname.endsWith("vercel.app") || parsed.hostname === "localhost") {
          return url;
        }
      } catch {}
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function canWrite(role: UserRole): boolean {
  return role === "ADMIN" || role === "TREASURER";
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

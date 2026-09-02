import { getServerSession } from "next-auth";
import { authOptions, canWrite, type UserRole } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireWriteAccess() {
  const session = await requireAuth();
  if (!canWrite(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function hasWriteAccess(role: UserRole): boolean {
  return canWrite(role);
}

import { getServerSession } from "next-auth";
import { authOptions, canWrite, isAdmin, isTeacher, type UserRole } from "@/lib/auth";

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

export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdmin(session.user.role)) {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function requireTeacherOrAdmin() {
  const session = await requireAuth();
  if (!isTeacher(session.user.role) && !isAdmin(session.user.role) && session.user.role !== "TREASURER") {
    throw new Error("Forbidden: Teacher or Admin access required");
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

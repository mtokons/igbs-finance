import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Generate unique sequential Roll Number (e.g. RN-2026-001)
export async function generateNextRollNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `RN-${currentYear}-`;
  
  const count = await prisma.courseEnrollment.count({
    where: {
      rollNumber: {
        startsWith: prefix,
      },
    },
  });

  let seq = count + 1;
  for (let i = 0; i < 100; i++) {
    const candidate = `${prefix}${String(seq).padStart(3, "0")}`;
    const exists = await prisma.courseEnrollment.findUnique({
      where: { rollNumber: candidate },
    });
    if (!exists) return candidate;
    seq++;
  }
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

// Generate unique sequential Student Code (e.g. STU-0001)
export async function generateNextStudentCode(): Promise<string> {
  const count = await prisma.courseEnrollment.count();
  let seq = count + 1;
  for (let i = 0; i < 100; i++) {
    const candidate = `STU-${String(seq).padStart(4, "0")}`;
    const exists = await prisma.courseEnrollment.findUnique({
      where: { studentCode: candidate },
    });
    if (!exists) return candidate;
    seq++;
  }
  return `STU-${Date.now().toString().slice(-4)}`;
}

// Create or link a User student login account
export async function createStudentUserAccount(params: {
  name: string;
  email?: string | null;
  rollNumber: string;
  studentCode: string;
  tempPassword?: string;
}) {
  const { name, rollNumber, studentCode } = params;
  const tempPassword = params.tempPassword || "IGBS2026!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Determine a valid unique email or system email for the student user
  const effectiveEmail = params.email && params.email.trim().length > 3
    ? params.email.trim().toLowerCase()
    : `${studentCode.toLowerCase()}@student.igbs.local`;

  // Check if user already exists with this email or username
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: effectiveEmail },
        { username: rollNumber },
        { username: studentCode },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: effectiveEmail,
        name,
        username: rollNumber,
        passwordHash,
        role: "STUDENT",
        mustChangePassword: true,
      },
    });
  }

  return { user, tempPassword };
}

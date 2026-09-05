import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const user = session.user;
  const { searchParams } = new URL(req.url);
  const requestedEnrollmentId = searchParams.get("enrollmentId");
  const requestedStudentCode = searchParams.get("studentCode");

  let enrollments = [];

  // If Admin/Treasurer, allow querying by enrollmentId or studentCode
  if ((isAdmin(user.role) || user.role === "TREASURER") && (requestedEnrollmentId || requestedStudentCode)) {
    enrollments = await prisma.courseEnrollment.findMany({
      where: {
        OR: [
          ...(requestedEnrollmentId ? [{ id: requestedEnrollmentId }] : []),
          ...(requestedStudentCode ? [{ studentCode: requestedStudentCode }, { rollNumber: requestedStudentCode }] : []),
        ],
      },
      include: {
        course: { include: { teacher: true } },
        member: true,
        user: { select: { id: true, email: true, username: true, role: true } },
        payments: { orderBy: { paidAt: "desc" }, include: { bankTransaction: true } },
        attendances: { orderBy: { date: "desc" }, include: { teacher: true } },
        evaluations: { orderBy: { evaluationDate: "desc" }, include: { teacher: true } },
      },
    });
  } else {
    // Normal student login - find by linked user or matching email / username
    enrollments = await prisma.courseEnrollment.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.username ? [{ rollNumber: user.username }, { studentCode: user.username }] : []),
          ...(user.email ? [{ studentEmail: user.email }, { member: { email: user.email } }] : []),
        ],
      },
      include: {
        course: { include: { teacher: true } },
        member: true,
        payments: { orderBy: { paidAt: "desc" }, include: { bankTransaction: true } },
        attendances: { orderBy: { date: "desc" }, include: { teacher: true } },
        evaluations: { orderBy: { evaluationDate: "desc" }, include: { teacher: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    enrollments,
  });
}

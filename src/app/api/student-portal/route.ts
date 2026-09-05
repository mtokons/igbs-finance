import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { isAdmin } from "@/lib/auth";
import { BANK_DETAILS, ORG } from "@/lib/org";

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
    bankDetails: BANK_DETAILS,
    org: ORG,
  });
}

// Student submits a self-reported bank payment for admin verification.
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const user = session.user;
  const body = await req.json();
  const { enrollmentId, amount, method, note, installment } = body;

  if (!enrollmentId || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Betrag und Kursanmeldung sind erforderlich." }, { status: 400 });
  }

  const enrollment = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) {
    return NextResponse.json({ error: "Kursanmeldung nicht gefunden." }, { status: 404 });
  }

  // Ensure the enrollment actually belongs to the logged-in student
  const isOwner =
    enrollment.userId === user.id ||
    (user.username && (enrollment.rollNumber === user.username || enrollment.studentCode === user.username)) ||
    (user.email && enrollment.studentEmail === user.email);

  if (!isOwner) {
    return NextResponse.json({ error: "Diese Kursanmeldung gehört nicht zu Ihrem Konto." }, { status: 403 });
  }

  const payment = await prisma.coursePayment.create({
    data: {
      enrollmentId,
      amount: Number(amount),
      method: method || "BANK",
      note: note || (installment ? `Selbstgemeldete Zahlung (Rate ${installment})` : "Selbstgemeldete Zahlung"),
      status: "PENDING_VERIFICATION",
      submittedBy: "STUDENT",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Zahlung übermittelt. Ein Administrator wird sie in Kürze überprüfen.",
    payment,
  });
}

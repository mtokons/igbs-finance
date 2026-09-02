import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET() {
  await requireAuth();
  const enrollments = await prisma.courseEnrollment.findMany({
    include: {
      course: true,
      member: true,
      payments: { orderBy: { paidAt: "desc" }, include: { bankTransaction: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const data = enrollments.map((e) => ({
    id: e.id,
    studentCode: e.studentCode,
    studentName: e.member?.fullName ?? e.studentName ?? "—",
    studentEmail: e.member?.email ?? e.studentEmail ?? null,
    isMember: Boolean(e.member),
    courseId: e.courseId,
    courseName: e.course.name,
    expectedAmount: e.expectedAmount,
    paidAmount: e.paidAmount,
    status: e.status,
    enrolledAt: e.enrolledAt,
    payments: e.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paidAt: p.paidAt,
      method: p.method,
      reference: p.bankTransaction?.reference ?? null,
      counterparty: p.bankTransaction?.counterparty ?? null,
    })),
  }));

  return NextResponse.json(data);
}

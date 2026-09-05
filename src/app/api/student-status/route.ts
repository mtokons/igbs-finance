import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BANK_DETAILS, ORG } from "@/lib/org";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (!query) {
      return NextResponse.json(
        { error: "Please provide a Student ID (e.g. STU-0001) or email." },
        { status: 400 }
      );
    }

    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        OR: [
          { rollNumber: { equals: query, mode: "insensitive" } },
          { studentCode: { equals: query, mode: "insensitive" } },
          { studentEmail: { equals: query, mode: "insensitive" } },
          { member: { email: { equals: query, mode: "insensitive" } } },
          { member: { memberCode: { equals: query, mode: "insensitive" } } },
        ],
      },
      include: {
        course: { include: { teacher: true } },
        member: true,
        payments: {
          orderBy: { paidAt: "desc" },
          select: {
            id: true,
            amount: true,
            paidAt: true,
            method: true,
            note: true,
          },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 5,
        },
        evaluations: {
          orderBy: { evaluationDate: "desc" },
          take: 1,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: `No enrollment record found for "${query}". Please check your Roll Number, Student ID, or registered email.` },
        { status: 404 }
      );
    }

    const studentName = enrollment.member?.fullName ?? enrollment.studentName ?? "Student";
    const studentEmail = enrollment.member?.email ?? enrollment.studentEmail ?? "";

    return NextResponse.json({
      success: true,
      studentId: enrollment.rollNumber || enrollment.studentCode || "N/A",
      rollNumber: enrollment.rollNumber,
      studentCode: enrollment.studentCode,
      studentName,
      studentEmail,
      courseName: enrollment.course.name,
      semester: enrollment.semester || enrollment.course.semester || "Semester 1",
      teacherName: enrollment.course.teacher?.name || "Assigned Teacher",
      expectedFee: enrollment.expectedAmount,
      paidAmount: enrollment.paidAmount,
      dueAmount: Math.max(0, enrollment.expectedAmount - enrollment.paidAmount),
      paymentPlan: enrollment.paymentPlan,
      installment1Amount: enrollment.installment1Amount,
      installment1Status: enrollment.installment1Status,
      installment2Amount: enrollment.installment2Amount,
      installment2Status: enrollment.installment2Status,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      payments: enrollment.payments,
      attendances: enrollment.attendances,
      evaluation: enrollment.evaluations[0] || null,
      bankDetails: {
        bankName: BANK_DETAILS.bankName,
        accountHolder: `${BANK_DETAILS.accountHolder} (${ORG.name})`,
        iban: BANK_DETAILS.iban,
        bic: BANK_DETAILS.bic,
        reference: `${enrollment.rollNumber || enrollment.studentCode || "STUDENT"} Kurs: ${enrollment.course.name}`,
      },
      org: ORG,
    });
  } catch (error: any) {
    console.error("Student status lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up student status." },
      { status: 500 }
    );
  }
}

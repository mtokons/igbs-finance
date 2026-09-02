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
          { studentCode: { equals: query } },
          { studentEmail: { equals: query } },
          { member: { email: { equals: query } } },
          { member: { memberCode: { equals: query } } },
        ],
      },
      include: {
        course: true,
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
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: `No enrollment record found for "${query}". Please check your Student ID or registered email.` },
        { status: 404 }
      );
    }

    const studentName = enrollment.member?.fullName ?? enrollment.studentName ?? "Student";
    const studentEmail = enrollment.member?.email ?? enrollment.studentEmail ?? "";

    return NextResponse.json({
      success: true,
      studentId: enrollment.studentCode || "N/A",
      studentName,
      studentEmail,
      courseName: enrollment.course.name,
      expectedFee: enrollment.expectedAmount,
      paidAmount: enrollment.paidAmount,
      dueAmount: Math.max(0, enrollment.expectedAmount - enrollment.paidAmount),
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      payments: enrollment.payments,
      bankDetails: {
        bankName: BANK_DETAILS.bankName,
        accountHolder: `${BANK_DETAILS.accountHolder} (${ORG.name})`,
        iban: BANK_DETAILS.iban,
        bic: BANK_DETAILS.bic,
        reference: `${enrollment.studentCode || "STUDENT"} Kurs: ${enrollment.course.name}`,
      },
    });
  } catch (error: any) {
    console.error("Student status lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up student status." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { isEmailConfigured, sendEmail, buildEnrollmentEmail } from "@/lib/email";
import { generateNextRollNumber, generateNextStudentCode, createStudentUserAccount } from "@/lib/madrasha";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: true,
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          member: true,
          user: { select: { id: true, email: true, username: true, role: true } },
          bankTransaction: true,
          payments: {
            orderBy: { paidAt: "desc" },
            include: { bankTransaction: true },
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
      },
      attendances: {
        orderBy: { date: "desc" },
        include: { enrollment: true, teacher: true },
      },
      evaluations: {
        orderBy: { evaluationDate: "desc" },
        include: { enrollment: true, teacher: true },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(course);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "enroll") {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
    }

    const expectedAmount = Number(body.expectedAmount ?? course.fee ?? 50.0);
    const paymentPlan = body.paymentPlan === "INSTALLMENTS_2" ? "INSTALLMENTS_2" : "FULL";
    const inst1 = paymentPlan === "INSTALLMENTS_2" ? (body.installment1Amount ? Number(body.installment1Amount) : expectedAmount / 2) : expectedAmount;
    const inst2 = paymentPlan === "INSTALLMENTS_2" ? (body.installment2Amount ? Number(body.installment2Amount) : expectedAmount / 2) : null;

    const rollNumber = body.rollNumber?.trim() || await generateNextRollNumber();
    const studentCode = await generateNextStudentCode();

    const enrollData: any = {
      courseId: id,
      rollNumber,
      studentCode,
      semester: body.semester || course.semester || "Semester 1",
      expectedAmount,
      paidAmount: 0,
      paymentPlan,
      installment1Amount: inst1,
      installment1Status: "PENDING",
      installment2Amount: inst2,
      installment2Status: paymentPlan === "INSTALLMENTS_2" ? "PENDING" : null,
      status: "PENDING",
      guardianName: body.guardianName || null,
      guardianPhone: body.guardianPhone || null,
      notes: body.notes || null,
    };

    let studentName: string;
    let notifyEmail: string | undefined;

    if (body.enrollType === "member" || (body.memberId && body.enrollType !== "new")) {
      const member = await prisma.member.findUnique({ where: { id: body.memberId } });
      if (!member) {
        return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
      }
      enrollData.memberId = member.id;
      enrollData.studentType = "MEMBER";
      studentName = member.fullName;
      notifyEmail = member.email ?? undefined;
    } else {
      studentName = String(body.studentName ?? "").trim();
      if (!studentName) {
        return NextResponse.json({ error: "Name des Studenten ist erforderlich" }, { status: 400 });
      }
      const studentEmail = String(body.studentEmail ?? "").trim() || undefined;
      enrollData.studentType = "STUDENT_ONLY";
      enrollData.studentName = studentName;
      enrollData.studentEmail = studentEmail;
      enrollData.studentPhone = String(body.studentPhone ?? "").trim() || undefined;
      notifyEmail = studentEmail;
    }

    // Auto-create user login account for student
    let userAccountInfo = null;
    try {
      const { user: studentUser, tempPassword } = await createStudentUserAccount({
        name: studentName,
        email: notifyEmail,
        rollNumber,
        studentCode,
        tempPassword: body.tempPassword || "IGBS2026!",
      });
      enrollData.userId = studentUser.id;
      userAccountInfo = {
        username: studentUser.username || rollNumber,
        email: studentUser.email,
        tempPassword,
      };
    } catch (uErr) {
      console.warn("Could not create student user account:", uErr);
    }

    let enrollment;
    try {
      enrollment = await prisma.courseEnrollment.create({ data: enrollData });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ error: "Dieses Mitglied ist bereits für den Kurs angemeldet oder Rollennummer ist bereits vergeben." }, { status: 409 });
      }
      throw err;
    }

    // Send enrollment confirmation with IGBS bank payment details (best-effort).
    const overrideEmail = String(body.notifyEmail ?? "").trim() || undefined;
    const recipient = overrideEmail ?? notifyEmail;
    const emailStatus = { sent: false, message: "Keine E-Mail-Adresse hinterlegt." };

    if (recipient) {
      if (!isEmailConfigured()) {
        emailStatus.message = "E-Mail nicht konfiguriert (GMAIL_USER/GMAIL_APP_PASSWORD in .env fehlen).";
      } else {
        const cc = Array.isArray(body.cc)
          ? body.cc
          : String(body.cc ?? "")
              .split(/[,;]/)
              .map((s: string) => s.trim())
              .filter(Boolean);
        const mail = buildEnrollmentEmail({
          studentName,
          courseName: course.name,
          fee: expectedAmount,
          studentCode: enrollment.studentCode ?? enrollment.rollNumber ?? undefined,
        });
        try {
          await sendEmail({ to: recipient, cc, subject: mail.subject, html: mail.html, text: mail.text });
          emailStatus.sent = true;
          emailStatus.message = `Bestätigung an ${recipient} gesendet${cc.length ? ` (CC: ${cc.join(", ")})` : ""}.`;
        } catch (err: any) {
          emailStatus.message = err?.message || "E-Mail-Versand fehlgeschlagen.";
        }
      }
    }

    return NextResponse.json({ enrollment, email: emailStatus, userAccount: userAccountInfo }, { status: 201 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      name: body.name,
      code: body.code || null,
      description: body.description || null,
      semester: body.semester || "Semester 1",
      fee: body.fee,
      teacherId: body.teacherId || null,
      schedule: body.schedule || null,
      room: body.room || null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      isActive: body.isActive ?? true,
    },
    include: {
      teacher: true,
    },
  });

  return NextResponse.json(course);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireWriteAccess();
  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

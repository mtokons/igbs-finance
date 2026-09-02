import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { isEmailConfigured, sendEmail, buildEnrollmentEmail } from "@/lib/email";

// Unique, human-readable student ID (STU-0001 ...).
async function nextStudentCode(): Promise<string> {
  const count = await prisma.courseEnrollment.count();
  let n = count + 1;
  for (let i = 0; i < 100; i++) {
    const code = `STU-${String(n).padStart(4, "0")}`;
    const exists = await prisma.courseEnrollment.findUnique({ where: { studentCode: code } });
    if (!exists) return code;
    n++;
  }
  return `STU-${Date.now()}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          member: true,
          bankTransaction: true,
          payments: {
            orderBy: { paidAt: "desc" },
            include: { bankTransaction: true },
          },
        },
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
    const enrollData: {
      courseId: string;
      expectedAmount: number;
      status: string;
      studentCode: string;
      memberId?: string;
      studentName?: string;
      studentEmail?: string;
      studentPhone?: string;
    } = { courseId: id, expectedAmount, status: "PENDING", studentCode: await nextStudentCode() };

    let studentName: string;
    let notifyEmail: string | undefined;

    if (body.enrollType === "member" || (body.memberId && body.enrollType !== "new")) {
      const member = await prisma.member.findUnique({ where: { id: body.memberId } });
      if (!member) {
        return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
      }
      enrollData.memberId = member.id;
      studentName = member.fullName;
      notifyEmail = member.email ?? undefined;
    } else {
      studentName = String(body.studentName ?? "").trim();
      if (!studentName) {
        return NextResponse.json({ error: "Name des Studenten ist erforderlich" }, { status: 400 });
      }
      const studentEmail = String(body.studentEmail ?? "").trim() || undefined;
      enrollData.studentName = studentName;
      enrollData.studentEmail = studentEmail;
      enrollData.studentPhone = String(body.studentPhone ?? "").trim() || undefined;
      notifyEmail = studentEmail;
    }

    let enrollment;
    try {
      enrollment = await prisma.courseEnrollment.create({ data: enrollData });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ error: "Dieses Mitglied ist bereits für den Kurs angemeldet." }, { status: 409 });
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
        const mail = buildEnrollmentEmail({ studentName, courseName: course.name, fee: expectedAmount, studentCode: enrollment.studentCode ?? undefined });
        try {
          await sendEmail({ to: recipient, cc, subject: mail.subject, html: mail.html, text: mail.text });
          emailStatus.sent = true;
          emailStatus.message = `Bestätigung an ${recipient} gesendet${cc.length ? ` (CC: ${cc.join(", ")})` : ""}.`;
        } catch (err: any) {
          emailStatus.message = err?.message || "E-Mail-Versand fehlgeschlagen.";
        }
      }
    }

    return NextResponse.json({ enrollment, email: emailStatus }, { status: 201 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      fee: body.fee,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      isActive: body.isActive ?? true,
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { isEmailConfigured, sendEmail, buildEnrollmentEmail } from "@/lib/email";
import { generateNextRollNumber, generateNextStudentCode, createStudentUserAccount } from "@/lib/madrasha";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const search = searchParams.get("search");

  const whereClause: any = {};
  if (courseId) {
    whereClause.courseId = courseId;
  }
  if (search) {
    whereClause.OR = [
      { rollNumber: { contains: search } },
      { studentCode: { contains: search } },
      { studentName: { contains: search } },
      { member: { fullName: { contains: search } } },
      { studentEmail: { contains: search } },
    ];
  }

  // If role is STUDENT, restrict to student's own enrollments
  if (session.user.role === "STUDENT") {
    whereClause.OR = [
      { userId: session.user.id },
      ...(session.user.username ? [{ rollNumber: session.user.username }, { studentCode: session.user.username }] : []),
      ...(session.user.email ? [{ studentEmail: session.user.email }, { member: { email: session.user.email } }] : []),
    ];
  } else if (session.user.role === "TEACHER" && session.user.teacherId) {
    // If role is TEACHER, optionally filter courses they teach unless admin/treasurer
    whereClause.course = { teacherId: session.user.teacherId };
  }

  const students = await prisma.courseEnrollment.findMany({
    where: whereClause,
    include: {
      course: {
        include: { teacher: true },
      },
      member: true,
      user: {
        select: { id: true, email: true, username: true, role: true, mustChangePassword: true },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
      _count: {
        select: { attendances: true, evaluations: true },
      },
    },
    orderBy: [{ rollNumber: "asc" }, { enrolledAt: "desc" }],
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  const body = await req.json();

  const {
    courseId,
    enrollType, // "member", "new", or "existing" (existing student joining another course)
    memberId,
    existingEnrollmentId, // source enrollment id when enrollType === "existing"
    studentName,
    studentEmail,
    studentPhone,
    guardianName,
    guardianPhone,
    semester,
    paymentPlan, // "FULL" or "INSTALLMENTS_2"
    customRollNumber,
    tempPassword,
    notes,
  } = body;

  if (!courseId) {
    return NextResponse.json({ error: "Kurs-ID ist erforderlich." }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Kurs nicht gefunden." }, { status: 404 });
  }

  const expectedAmount = Number(body.expectedAmount ?? course.fee ?? 50.0);
  const is2Installments = paymentPlan === "INSTALLMENTS_2";
  const plan = is2Installments ? "INSTALLMENTS_2" : "FULL";
  const inst1 = is2Installments ? (body.installment1Amount ? Number(body.installment1Amount) : expectedAmount / 2) : expectedAmount;
  const inst2 = is2Installments ? (body.installment2Amount ? Number(body.installment2Amount) : expectedAmount / 2) : null;

  const rollNumber = customRollNumber?.trim() || (await generateNextRollNumber());
  const studentCode = await generateNextStudentCode();

  let finalStudentName = "";
  let notifyEmail: string | undefined = undefined;
  let finalMemberId: string | undefined = undefined;
  let studentType = "STUDENT_ONLY";
  let reuseUserId: string | undefined = undefined;

  if (enrollType === "existing" && existingEnrollmentId) {
    const source = await prisma.courseEnrollment.findUnique({
      where: { id: existingEnrollmentId },
      include: { member: true, user: true },
    });
    if (!source) {
      return NextResponse.json({ error: "Bestehender Student nicht gefunden." }, { status: 404 });
    }
    finalStudentName = source.member?.fullName || source.studentName || "";
    notifyEmail = source.member?.email || source.studentEmail || undefined;
    finalMemberId = source.memberId || undefined;
    studentType = source.studentType;
    reuseUserId = source.userId || undefined;
  } else if (enrollType === "member" && memberId) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Mitglied nicht gefunden." }, { status: 404 });
    }
    finalMemberId = member.id;
    finalStudentName = member.fullName;
    notifyEmail = member.email || undefined;
    studentType = "MEMBER";
  } else {
    finalStudentName = String(studentName ?? "").trim();
    if (!finalStudentName) {
      return NextResponse.json({ error: "Name des Studenten ist erforderlich." }, { status: 400 });
    }
    notifyEmail = String(studentEmail ?? "").trim() || undefined;
    studentType = "STUDENT_ONLY";
  }

  // Provision Student Login User Account (reuse existing login if joining an additional course)
  let studentUser = null;
  const initialPassword = tempPassword?.trim() || "IGBS2026!";
  if (reuseUserId) {
    studentUser = await prisma.user.findUnique({ where: { id: reuseUserId } });
  } else {
    try {
      const res = await createStudentUserAccount({
        name: finalStudentName,
        email: notifyEmail,
        rollNumber,
        studentCode,
        tempPassword: initialPassword,
      });
      studentUser = res.user;
    } catch (err) {
      console.warn("Could not create user account for student:", err);
    }
  }

  let enrollment;
  try {
    enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        memberId: finalMemberId,
        userId: studentUser?.id || null,
        rollNumber,
        studentCode,
        studentType,
        studentName: finalStudentName,
        studentEmail: notifyEmail,
        studentPhone: String(studentPhone ?? "").trim() || null,
        guardianName: String(guardianName ?? "").trim() || null,
        guardianPhone: String(guardianPhone ?? "").trim() || null,
        semester: semester || course.semester || "Semester 1",
        expectedAmount,
        paidAmount: 0,
        paymentPlan: plan,
        installment1Amount: inst1,
        installment1Status: "PENDING",
        installment2Amount: inst2,
        installment2Status: is2Installments ? "PENDING" : null,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        course: { include: { teacher: true } },
        member: true,
        user: true,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Rollennummer oder Mitglied ist bereits für diesen Kurs eingetragen." },
        { status: 409 }
      );
    }
    throw err;
  }

  await logAudit(session.user.id, "CREATE", "StudentEnrollment", enrollment.id, `${finalStudentName} (${rollNumber})`);

  // Send confirmation email
  const emailStatus = { sent: false, message: "Keine E-Mail-Adresse angegeben." };
  if (notifyEmail && isEmailConfigured()) {
    try {
      const mail = buildEnrollmentEmail({
        studentName: finalStudentName,
        courseName: course.name,
        fee: expectedAmount,
        studentCode: rollNumber,
      });
      await sendEmail({
        to: notifyEmail,
        subject: `[IGBS Madrasha] Anmeldung: ${course.name} (Rollennummer: ${rollNumber})`,
        html: mail.html,
        text: mail.text,
      });
      emailStatus.sent = true;
      emailStatus.message = `Bestätigung an ${notifyEmail} gesendet.`;
    } catch (e: any) {
      emailStatus.message = e.message || "E-Mail-Versand fehlgeschlagen.";
    }
  }

  return NextResponse.json(
    {
      enrollment,
      email: emailStatus,
      credentials: {
        username: studentUser?.username || rollNumber,
        tempPassword: initialPassword,
        loginUrl: "/login",
      },
    },
    { status: 201 }
  );
}

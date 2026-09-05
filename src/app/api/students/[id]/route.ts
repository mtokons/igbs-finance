import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const student = await prisma.courseEnrollment.findUnique({
    where: { id },
    include: {
      course: { include: { teacher: true } },
      member: true,
      user: {
        select: { id: true, email: true, username: true, role: true, mustChangePassword: true },
      },
      payments: {
        orderBy: { paidAt: "desc" },
        include: { bankTransaction: true },
      },
      attendances: {
        orderBy: { date: "desc" },
        include: { teacher: true },
      },
      evaluations: {
        orderBy: { evaluationDate: "desc" },
        include: { teacher: true },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.courseEnrollment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Student nicht gefunden." }, { status: 404 });
  }

  // Action: Pay Installment or Record Payment
  if (body.action === "recordPayment" || body.action === "payInstallment") {
    const amount = Number(body.amount);
    const method = body.method || "CASH"; // CASH, BANK, MANUAL
    const targetInstallment = body.installment; // 1 or 2 or "full"
    const note = body.note || (targetInstallment ? `Installment ${targetInstallment} payment` : "Course fee payment");

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Ungültiger Zahlungsbetrag." }, { status: 400 });
    }

    // Create payment entry
    await prisma.coursePayment.create({
      data: {
        enrollmentId: id,
        amount,
        method,
        note,
      },
    });

    const newPaidAmount = existing.paidAmount + amount;
    const isFullyPaid = newPaidAmount >= existing.expectedAmount;

    let inst1Status = existing.installment1Status;
    let inst1PaidAt = existing.installment1PaidAt;
    let inst2Status = existing.installment2Status;
    let inst2PaidAt = existing.installment2PaidAt;

    if (targetInstallment === 1 || targetInstallment === "1") {
      inst1Status = "PAID";
      inst1PaidAt = new Date();
    } else if (targetInstallment === 2 || targetInstallment === "2") {
      inst2Status = "PAID";
      inst2PaidAt = new Date();
    } else if (isFullyPaid) {
      inst1Status = "PAID";
      inst1PaidAt = inst1PaidAt || new Date();
      inst2Status = existing.paymentPlan === "INSTALLMENTS_2" ? "PAID" : null;
      inst2PaidAt = inst2PaidAt || (existing.paymentPlan === "INSTALLMENTS_2" ? new Date() : null);
    }

    const updated = await prisma.courseEnrollment.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? "PAID" : "PARTIAL",
        paidAt: isFullyPaid ? new Date() : existing.paidAt,
        installment1Status: inst1Status,
        installment1PaidAt: inst1PaidAt,
        installment2Status: inst2Status,
        installment2PaidAt: inst2PaidAt,
      },
      include: { payments: true },
    });

    await logAudit(session.user.id, "RECORD_PAYMENT", "StudentEnrollment", id, `Paid €${amount}`);
    return NextResponse.json(updated);
  }

  // Action: Reset Password
  if (body.action === "resetPassword") {
    const newTempPassword = body.tempPassword || "IGBS2026!";
    if (existing.userId) {
      const passwordHash = await bcrypt.hash(newTempPassword, 10);
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });
      await logAudit(session.user.id, "RESET_PASSWORD", "User", existing.userId, `Reset temp password for student ${existing.rollNumber}`);
      return NextResponse.json({ success: true, message: `Passwort erfolgreich zurückgesetzt auf: ${newTempPassword}` });
    } else {
      // Create user if not existing
      const passwordHash = await bcrypt.hash(newTempPassword, 10);
      const studentName = existing.studentName || "Student";
      const studentEmail = existing.studentEmail || `${existing.studentCode?.toLowerCase() || id}@student.igbs.local`;
      const user = await prisma.user.create({
        data: {
          name: studentName,
          email: studentEmail,
          username: existing.rollNumber || existing.studentCode,
          passwordHash,
          role: "STUDENT",
          mustChangePassword: true,
        },
      });
      await prisma.courseEnrollment.update({
        where: { id },
        data: { userId: user.id },
      });
      return NextResponse.json({ success: true, message: `Neuer Login-Account erstellt mit Passwort: ${newTempPassword}` });
    }
  }

  // Update student fields
  let updated;
  try {
    updated = await prisma.courseEnrollment.update({
      where: { id },
      data: {
        courseId: body.courseId !== undefined ? body.courseId : existing.courseId,
        studentName: body.studentName !== undefined ? body.studentName : existing.studentName,
        studentEmail: body.studentEmail !== undefined ? body.studentEmail : existing.studentEmail,
        studentPhone: body.studentPhone !== undefined ? body.studentPhone : existing.studentPhone,
        guardianName: body.guardianName !== undefined ? body.guardianName : existing.guardianName,
        guardianPhone: body.guardianPhone !== undefined ? body.guardianPhone : existing.guardianPhone,
        rollNumber: body.rollNumber !== undefined ? body.rollNumber : existing.rollNumber,
        semester: body.semester !== undefined ? body.semester : existing.semester,
        expectedAmount: body.expectedAmount !== undefined ? Number(body.expectedAmount) : existing.expectedAmount,
        paymentPlan: body.paymentPlan !== undefined ? body.paymentPlan : existing.paymentPlan,
        installment1Amount: body.installment1Amount !== undefined ? Number(body.installment1Amount) : existing.installment1Amount,
        installment2Amount: body.installment2Amount !== undefined ? Number(body.installment2Amount) : existing.installment2Amount,
        status: body.status !== undefined ? body.status : existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: {
        course: true,
        member: true,
        user: true,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Diese Rollennummer ist bereits vergeben, oder dieses Mitglied ist bereits für den Zielkurs eingetragen." },
        { status: 409 }
      );
    }
    throw err;
  }

  await logAudit(session.user.id, "UPDATE", "StudentEnrollment", id, `${updated.studentName} (${updated.rollNumber})`);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;

  const existing = await prisma.courseEnrollment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Student nicht gefunden." }, { status: 404 });
  }

  // Delete enrollment (cascades payments, attendances, evaluations)
  await prisma.courseEnrollment.delete({ where: { id } });
  await logAudit(session.user.id, "DELETE", "StudentEnrollment", id, `${existing.studentName} (${existing.rollNumber})`);

  return NextResponse.json({ success: true });
}

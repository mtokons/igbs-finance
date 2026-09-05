import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, username: true, role: true, mustChangePassword: true } },
      courses: {
        include: {
          _count: { select: { enrollments: true, attendances: true, evaluations: true } },
        },
      },
      salaryPayments: {
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        include: { bankTransaction: true },
      },
    },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(teacher);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    return NextResponse.json({ error: "Lehrer nicht gefunden" }, { status: 404 });
  }

  if (body.action === "recordSalary") {
    const { periodYear, periodMonth, amount, bankTransactionId } = body;
    const category = await prisma.category.findFirst({ where: { name: "Teacher Honorarium / Salary" } });

    const payment = await prisma.salaryPayment.create({
      data: {
        teacherId: id,
        periodYear: periodYear || new Date().getFullYear(),
        periodMonth: periodMonth || new Date().getMonth() + 1,
        amount: amount || body.defaultSalary || 300,
        status: "PAID",
        paidAt: new Date(),
        bankTransactionId: bankTransactionId || null,
      },
    });

    if (bankTransactionId) {
      await prisma.bankTransaction.update({
        where: { id: bankTransactionId },
        data: { categoryId: category?.id, reconciliationStatus: "MATCHED" },
      });
    }

    await logAudit(session.user.id, "RECORD_SALARY", "Teacher", id, `Paid €${payment.amount} for ${payment.periodMonth}/${payment.periodYear}`);
    return NextResponse.json(payment, { status: 201 });
  }

  // Create or reset Teacher login credentials
  if (body.action === "createLogin" || body.action === "resetPassword") {
    const tempPassword = body.tempPassword || "IGBS2026!";
    const email = (body.email || teacher.email || `${teacher.name.toLowerCase().replace(/\s+/g, ".")}@teacher.igbs.local`).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let user;
    if (teacher.userId) {
      user = await prisma.user.update({
        where: { id: teacher.userId },
        data: {
          passwordHash,
          email,
          mustChangePassword: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: teacher.name,
          email,
          role: "TEACHER",
          passwordHash,
          mustChangePassword: true,
        },
      });
      await prisma.teacher.update({
        where: { id },
        data: { userId: user.id, email },
      });
    }

    await logAudit(session.user.id, "TEACHER_AUTH", "Teacher", id, `Login credentials updated for ${teacher.name}`);
    return NextResponse.json({
      success: true,
      message: `Login bereitgestellt: E-Mail: ${email}, Temp Passwort: ${tempPassword}`,
      credentials: { email, tempPassword },
    });
  }

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      defaultSalary: body.defaultSalary,
      paymentHint: body.paymentHint || null,
      ibanLast4: body.ibanLast4 || null,
      isActive: body.isActive ?? true,
    },
    include: {
      user: true,
    },
  });

  await logAudit(session.user.id, "UPDATE", "Teacher", id, updated.name);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;
  await prisma.teacher.delete({ where: { id } });
  await logAudit(session.user.id, "DELETE", "Teacher", id);
  return NextResponse.json({ success: true });
}

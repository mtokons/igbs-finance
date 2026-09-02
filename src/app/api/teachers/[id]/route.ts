import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
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
  await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "recordSalary") {
    const { periodYear, periodMonth, amount, bankTransactionId } = body;
    const category = await prisma.category.findFirst({ where: { name: "Lehrerhonorar/Gehalt" } });

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

    return NextResponse.json(payment, { status: 201 });
  }

  const teacher = await prisma.teacher.update({
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
  });

  return NextResponse.json(teacher);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireWriteAccess();
  const { id } = await params;
  await prisma.teacher.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

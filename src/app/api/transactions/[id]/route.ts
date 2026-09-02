import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const tx = await prisma.bankTransaction.findUnique({
    where: { id },
    include: {
      category: true,
      membershipPayment: { include: { member: true } },
      courseEnrollment: { include: { course: true, member: true } },
      salaryPayment: { include: { teacher: true } },
      eventTransaction: { include: { event: true } },
    },
  });

  if (!tx) {
    return NextResponse.json({ error: "Transaktion nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(tx);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  const tx = await prisma.bankTransaction.update({
    where: { id },
    data: {
      categoryId: body.categoryId || null,
      reconciliationStatus: body.reconciliationStatus,
      notes: body.notes || null,
    },
  });

  await logAudit(session.user.id, "UPDATE", "BankTransaction", id);
  return NextResponse.json(tx);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;

  await prisma.bankTransaction.delete({ where: { id } });
  await logAudit(session.user.id, "DELETE", "BankTransaction", id);

  return NextResponse.json({ success: true });
}

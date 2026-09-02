import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      membershipPayments: { orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }] },
      courseEnrollments: { include: { course: true } },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  const member = await prisma.member.update({
    where: { id },
    data: {
      fullName: body.fullName,
      email: body.email || null,
      phone: body.phone || null,
      ibanLast4: body.ibanLast4 || null,
      memberCode: body.memberCode || null,
      monthlyFee: body.monthlyFee,
      status: body.status,
      notes: body.notes || null,
    },
  });

  await logAudit(session.user.id, "UPDATE", "Member", id, member.fullName);
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireWriteAccess();
  const { id } = await params;

  await prisma.member.delete({ where: { id } });
  await logAudit(session.user.id, "DELETE", "Member", id);

  return NextResponse.json({ success: true });
}

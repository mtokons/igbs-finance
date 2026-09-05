import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const memberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  memberType: z.string().optional(),
  ibanLast4: z.string().max(4).optional(),
  memberCode: z.string().optional(),
  monthlyFee: z.number().min(0),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  await requireAuth();
  const members = await prisma.member.findMany({
    orderBy: { fullName: "asc" },
    include: {
      _count: { select: { membershipPayments: true, courseEnrollments: true } },
    },
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  const body = await req.json();
  const data = memberSchema.parse(body);

  const member = await prisma.member.create({
    data: {
      fullName: data.fullName,
      email: data.email || null,
      phone: data.phone,
      address: data.address,
      memberType: data.memberType,
      ibanLast4: data.ibanLast4,
      memberCode: data.memberCode,
      monthlyFee: data.monthlyFee,
      status: data.status ?? "ACTIVE",
      notes: data.notes,
    },
  });

  await logAudit(session.user.id, "CREATE", "Member", member.id, data.fullName);
  return NextResponse.json(member, { status: 201 });
}

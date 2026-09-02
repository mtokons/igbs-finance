import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  await requireAuth();
  const teachers = await prisma.teacher.findMany({
    include: { _count: { select: { salaryPayments: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teachers);
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  defaultSalary: z.number().positive(),
  paymentHint: z.string().optional(),
  ibanLast4: z.string().max(4).optional(),
});

export async function POST(req: NextRequest) {
  await requireWriteAccess();
  const data = schema.parse(await req.json());

  const teacher = await prisma.teacher.create({ data });
  return NextResponse.json(teacher, { status: 201 });
}

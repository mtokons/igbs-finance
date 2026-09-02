import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  await requireAuth();
  const courses = await prisma.course.findMany({
    include: { _count: { select: { enrollments: true } } },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(courses);
}

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fee: z.number().positive(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await requireWriteAccess();
  const data = schema.parse(await req.json());

  const course = await prisma.course.create({
    data: {
      name: data.name,
      description: data.description,
      fee: data.fee,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  return NextResponse.json(course, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  const session = await requireAuth();
  const user = session.user;

  const courses = await prisma.course.findMany({
    include: {
      teacher: true,
      _count: { select: { enrollments: true, attendances: true, evaluations: true } },
    },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(courses);
}

const schema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  description: z.string().optional(),
  semester: z.string().optional(),
  fee: z.number().positive(),
  teacherId: z.string().optional().nullable(),
  schedule: z.string().optional(),
  room: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  await requireWriteAccess();
  const data = schema.parse(await req.json());

  const course = await prisma.course.create({
    data: {
      name: data.name,
      code: data.code || null,
      description: data.description || null,
      semester: data.semester || "Semester 1",
      fee: data.fee,
      teacherId: data.teacherId || null,
      schedule: data.schedule || null,
      room: data.room || null,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      teacher: true,
    },
  });

  return NextResponse.json(course, { status: 201 });
}

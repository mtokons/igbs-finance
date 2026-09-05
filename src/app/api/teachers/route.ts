import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  await requireAuth();
  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { id: true, email: true, username: true, role: true, mustChangePassword: true } },
      courses: { select: { id: true, name: true, semester: true } },
      _count: { select: { salaryPayments: true, courses: true, attendances: true, evaluations: true } },
    },
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
  createLogin: z.boolean().optional(),
  tempPassword: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  const data = schema.parse(await req.json());

  let userId: string | null = null;
  const tempPassword = data.tempPassword || "IGBS2026!";

  // If email provided or createLogin requested, create a User for teacher
  if (data.createLogin && data.email && data.email.trim()) {
    const email = data.email.trim().toLowerCase();
    let existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      existingUser = await prisma.user.create({
        data: {
          email,
          name: data.name,
          role: "TEACHER",
          passwordHash,
          mustChangePassword: true,
        },
      });
    } else {
      // update role to TEACHER if not admin
      if (existingUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "TEACHER" },
        });
      }
    }
    userId = existingUser.id;
  }

  const teacher = await prisma.teacher.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      defaultSalary: data.defaultSalary,
      paymentHint: data.paymentHint || null,
      ibanLast4: data.ibanLast4 || null,
      userId,
    },
    include: {
      user: { select: { id: true, email: true, username: true, role: true } },
    },
  });

  await logAudit(session.user.id, "CREATE", "Teacher", teacher.id, teacher.name);

  return NextResponse.json(
    {
      ...teacher,
      tempPassword: userId ? tempPassword : null,
    },
    { status: 201 }
  );
}

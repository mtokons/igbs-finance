import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { z } from "zod";

export async function GET() {
  await requireAuth();
  const events = await prisma.event.findMany({
    include: {
      transactions: { include: { bankTransaction: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { eventDate: "desc" },
  });
  return NextResponse.json(events);
}

const schema = z.object({
  title: z.string().min(1),
  eventDate: z.string(),
  budget: z.number().nonnegative(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await requireWriteAccess();
  const data = schema.parse(await req.json());

  const event = await prisma.event.create({
    data: {
      title: data.title,
      eventDate: new Date(data.eventDate),
      budget: data.budget,
      notes: data.notes,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

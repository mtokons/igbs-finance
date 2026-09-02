import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      transactions: {
        include: {
          bankTransaction: {
            include: { category: true },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Veranstaltung nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireWriteAccess();
  const { id } = await params;
  const body = await req.json();

  if (body.action === "attachTransaction") {
    const { bankTransactionId, notes } = body;
    const category = await prisma.category.findFirst({ where: { name: "Veranstaltung" } });

    const eventTx = await prisma.eventTransaction.create({
      data: {
        eventId: id,
        bankTransactionId,
        notes: notes || null,
      },
    });

    await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: { categoryId: category?.id, reconciliationStatus: "MATCHED" },
    });

    return NextResponse.json(eventTx, { status: 201 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: body.title,
      eventDate: new Date(body.eventDate),
      budget: body.budget,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireWriteAccess();
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

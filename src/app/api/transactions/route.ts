import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const transactions = await prisma.bankTransaction.findMany({
    where: status ? { reconciliationStatus: status as never } : undefined,
    include: { category: true },
    orderBy: { bookingDate: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}

const createSchema = z.object({
  bookingDate: z.string(),
  amount: z.number(),
  counterparty: z.string().optional(),
  reference: z.string().optional(),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  const data = createSchema.parse(await req.json());

  const tx = await prisma.bankTransaction.create({
    data: {
      bookingDate: new Date(data.bookingDate),
      amount: data.amount,
      counterparty: data.counterparty,
      reference: data.reference,
      categoryId: data.categoryId,
      notes: data.notes,
      source: "MANUAL",
    },
  });

  await logAudit(session.user.id, "CREATE", "BankTransaction", tx.id);
  return NextResponse.json(tx, { status: 201 });
}

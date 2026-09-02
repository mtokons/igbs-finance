import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccountTransactions, mapGoCardlessTransactions } from "@/lib/gocardless";
import { importTransactions } from "@/lib/csv-import";
import { runAutoMatchForUnmatched } from "@/lib/matching";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await prisma.bankConnection.findFirst({
    where: { status: "LINKED", accountId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });

  if (!connection?.accountId) {
    return NextResponse.json({ error: "No linked bank account" }, { status: 400 });
  }

  if (connection.consentExpires && connection.consentExpires < new Date()) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Bank consent expired" }, { status: 400 });
  }

  try {
    const dateFrom = connection.lastSyncAt
      ? connection.lastSyncAt.toISOString().slice(0, 10)
      : undefined;

    const data = await getAccountTransactions(connection.accountId, dateFrom);
    const mapped = mapGoCardlessTransactions(data);
    const result = await importTransactions(mapped, "GOCARDLESS");
    const matchResult = await runAutoMatchForUnmatched();

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date(), lastSyncError: null },
    });

    return NextResponse.json({ ...result, matchResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSyncError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { prisma } from "@/lib/db";
import { getAccountTransactions, mapGoCardlessTransactions } from "@/lib/gocardless";
import { importTransactions } from "@/lib/csv-import";
import { runAutoMatchForUnmatched } from "@/lib/matching";

async function syncBank() {
  const connection = await prisma.bankConnection.findFirst({
    where: { status: "LINKED", accountId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });

  if (!connection?.accountId) {
    console.log("No linked bank account. Skipping sync.");
    return;
  }

  if (connection.consentExpires && connection.consentExpires < new Date()) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { status: "EXPIRED" },
    });
    console.log("Bank consent expired.");
    return;
  }

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

  console.log("Sync complete:", { ...result, matchResult });
}

syncBank()
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

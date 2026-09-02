import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequisition } from "@/lib/gocardless";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");

  const connection = ref
    ? await prisma.bankConnection.findFirst({ where: { requisitionId: ref } })
    : await prisma.bankConnection.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" } });

  if (!connection?.requisitionId) {
    return NextResponse.redirect(new URL("/dashboard/bank?error=no_connection", req.url));
  }

  try {
    const requisition = await getRequisition(connection.requisitionId);
    const accountId = requisition.accounts?.[0];

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        accountId,
        status: accountId ? "LINKED" : "ERROR",
        consentExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        lastSyncError: accountId ? null : "No account linked",
      },
    });

    return NextResponse.redirect(new URL("/dashboard/bank?success=linked", req.url));
  } catch (error) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastSyncError: error instanceof Error ? error.message : "Callback failed",
      },
    });
    return NextResponse.redirect(new URL("/dashboard/bank?error=callback_failed", req.url));
  }
}

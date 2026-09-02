import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getInstitutions, createRequisition } from "@/lib/gocardless";

export async function GET() {
  await requireAuth();

  const [connection, institutions] = await Promise.all([
    prisma.bankConnection.findFirst({ orderBy: { updatedAt: "desc" } }),
    getInstitutions("DE").catch(() => []),
  ]);

  return NextResponse.json({ connection, institutions });
}

export async function POST(req: NextRequest) {
  await requireAuth();
  const { institutionId } = await req.json();

  if (!institutionId) {
    return NextResponse.json({ error: "institutionId required" }, { status: 400 });
  }

  const redirectUrl =
    (process.env.GOCARDLESS_REDIRECT_URL && process.env.GOCARDLESS_REDIRECT_URL.trim()) ||
    (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.trim()
      ? `${process.env.NEXTAUTH_URL}/api/bank/gocardless/callback`
      : "http://localhost:3000/api/bank/gocardless/callback");

  const requisition = await createRequisition(institutionId, redirectUrl);

  await prisma.bankConnection.create({
    data: {
      requisitionId: requisition.id,
      institutionName: institutionId,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    link: requisition.link,
    requisitionId: requisition.id,
  });
}

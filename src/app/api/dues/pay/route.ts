import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/session";
import { markMembershipPaid } from "@/lib/membership";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  memberId: z.string(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  const data = schema.parse(await req.json());

  const payment = await markMembershipPaid(data.memberId, data.year, data.month, data.amount);
  await logAudit(session.user.id, "PAY", "MembershipPayment", payment.id);

  return NextResponse.json(payment);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

// Lists all student-submitted payment confirmations awaiting admin verification.
export async function GET() {
  const session = await requireAuth();
  if (!isAdmin(session.user.role) && session.user.role !== "TREASURER") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const pending = await prisma.coursePayment.findMany({
    where: { status: "PENDING_VERIFICATION" },
    include: {
      enrollment: {
        include: {
          course: true,
          member: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(pending);
}

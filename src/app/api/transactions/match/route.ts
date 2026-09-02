import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/session";
import { applyMembershipMatch, applyCourseMatch, applySalaryMatch, suggestMatches } from "@/lib/matching";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  await requireWriteAccess();
  try {
    const body = await req.json();
    const { action, transactionId, targetType, memberId, enrollmentId, teacherId, eventId, year, month } = body;

    if (action === "suggest") {
      const suggestions = await suggestMatches(transactionId);
      return NextResponse.json({ suggestions });
    }

    if (targetType === "membership" && memberId) {
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      await applyMembershipMatch(transactionId, memberId, currentYear, currentMonth);
      return NextResponse.json({ success: true, message: "Transaktion zu Mitgliedsbeitrag zugeordnet." });
    }

    if (targetType === "course" && enrollmentId) {
      await applyCourseMatch(transactionId, enrollmentId);
      return NextResponse.json({ success: true, message: "Transaktion zu Kursgebühr zugeordnet." });
    }

    if (targetType === "salary" && teacherId) {
      const currentYear = year || new Date().getFullYear();
      const currentMonth = month || new Date().getMonth() + 1;
      await applySalaryMatch(transactionId, teacherId, currentYear, currentMonth);
      return NextResponse.json({ success: true, message: "Transaktion zu Lehrergehalt zugeordnet." });
    }

    if (targetType === "event" && eventId) {
      const category = await prisma.category.findFirst({ where: { name: "Veranstaltung" } });
      await prisma.eventTransaction.create({
        data: { eventId, bankTransactionId: transactionId },
      });
      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { categoryId: category?.id, reconciliationStatus: "MATCHED" },
      });
      return NextResponse.json({ success: true, message: "Transaktion zu Veranstaltung zugeordnet." });
    }

    if (targetType === "ignore") {
      await prisma.bankTransaction.update({
        where: { id: transactionId },
        data: { reconciliationStatus: "IGNORED" },
      });
      return NextResponse.json({ success: true, message: "Transaktion ignoriert." });
    }

    return NextResponse.json({ error: "Ungültige Zuordnungsparameter" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler bei der Zuordnung" }, { status: 500 });
  }
}

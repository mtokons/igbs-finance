import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  try {
    const { members } = await req.json();

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: "Keine gültigen Mitgliederdaten übergeben" }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of members) {
      if (!item.fullName) continue;

      const monthlyFee = typeof item.monthlyFee === "number" ? item.monthlyFee : parseFloat(item.monthlyFee || "10.00");
      const ibanLast4 = item.iban ? item.iban.replace(/\s+/g, "").slice(-4) : (item.ibanLast4 || null);

      if (item.memberCode) {
        const existing = await prisma.member.findUnique({ where: { memberCode: String(item.memberCode) } });
        if (existing) {
          await prisma.member.update({
            where: { id: existing.id },
            data: {
              fullName: item.fullName,
              email: item.email || existing.email,
              phone: item.phone || existing.phone,
              monthlyFee,
              ibanLast4: ibanLast4 || existing.ibanLast4,
              status: item.status || existing.status,
            },
          });
          updatedCount++;
          continue;
        }
      }

      await prisma.member.create({
        data: {
          fullName: item.fullName,
          email: item.email || null,
          phone: item.phone || null,
          memberCode: item.memberCode ? String(item.memberCode) : null,
          monthlyFee: isNaN(monthlyFee) ? 10.00 : monthlyFee,
          ibanLast4: ibanLast4 || null,
          status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          notes: item.notes || "Importiert via Bulk-Import",
        },
      });
      createdCount++;
    }

    await logAudit(session.user.id, "BULK_IMPORT", "Member", undefined, `${createdCount} erstellt, ${updatedCount} aktualisiert`);

    return NextResponse.json({
      success: true,
      message: `${createdCount} Mitglieder neu erstellt, ${updatedCount} aktualisiert.`,
      createdCount,
      updatedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler beim Mitglieder-Import" }, { status: 500 });
  }
}

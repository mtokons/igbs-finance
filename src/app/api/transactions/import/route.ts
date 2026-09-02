import { NextRequest, NextResponse } from "next/server";
import { parseCsvContent, importTransactions, decodeCsvBuffer } from "@/lib/csv-import";
import { runAutoMatchForUnmatched } from "@/lib/matching";
import { requireWriteAccess } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await requireWriteAccess();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const formSource = (formData.get("source") as string | null) ?? undefined;

    let csvContent = "";
    let source = formSource;
    if (file) {
      csvContent = decodeCsvBuffer(await file.arrayBuffer());
    } else {
      const body = await req.json().catch(() => ({}));
      csvContent = body.content || "";
      source = source || body.source;
    }

    if (!csvContent || !csvContent.trim()) {
      return NextResponse.json({ error: "Kein Dateiinhalt empfangen" }, { status: 400 });
    }

    const parsed = parseCsvContent(csvContent);
    if (parsed.length === 0) {
      return NextResponse.json({ error: "Keine gültigen Transaktionen in der Datei gefunden" }, { status: 400 });
    }

    const result = await importTransactions(parsed, source || "CSV_IMPORT");
    const autoMatchRes = await runAutoMatchForUnmatched();
    const autoMatched = autoMatchRes.suggested;

    await logAudit(session.user.id, "CSV_IMPORT", "BankTransaction", undefined, `${result.imported} importiert, ${result.skipped} übersprungen`);

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      autoMatched,
      message: `${result.imported} Transaktionen importiert (${result.skipped} Duplikate übersprungen, ${autoMatched} automatisch zugeordnet).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler beim CSV-Import" }, { status: 500 });
  }
}

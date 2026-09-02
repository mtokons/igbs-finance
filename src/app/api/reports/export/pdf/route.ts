import { NextRequest, NextResponse } from "next/server";
import { getMonthlySummary, getYearlySummary } from "@/lib/reports";
import { ORG, BANK_DETAILS } from "@/lib/org";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    const paymentInfoHtml = `
          <div style="margin-top:32px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
            <div style="font-weight:bold;color:#0f172a;margin-bottom:8px;">Zahlungsinformationen / Bankverbindung</div>
            <table style="border:none;width:auto;margin-top:0;">
              <tr><td style="border:none;padding:2px 16px 2px 0;color:#64748b;">Empfänger</td><td style="border:none;padding:2px 0;font-weight:bold;">${BANK_DETAILS.accountHolder} (${ORG.name})</td></tr>
              <tr><td style="border:none;padding:2px 16px 2px 0;color:#64748b;">Bank</td><td style="border:none;padding:2px 0;font-weight:bold;">${BANK_DETAILS.bankName}</td></tr>
              <tr><td style="border:none;padding:2px 16px 2px 0;color:#64748b;">IBAN</td><td style="border:none;padding:2px 0;font-weight:bold;">${BANK_DETAILS.iban}</td></tr>
              <tr><td style="border:none;padding:2px 16px 2px 0;color:#64748b;">BIC</td><td style="border:none;padding:2px 0;font-weight:bold;">${BANK_DETAILS.bic}</td></tr>
            </table>
          </div>`;

    let htmlContent = "";

    if (month) {
      const monthly = await getMonthlySummary(year, month);
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>IGBS e.V. Finanzbericht ${monthly.monthName} ${year}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 4px; }
            .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
            .kpi-grid { display: flex; gap: 16px; margin-bottom: 24px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; flex: 1; }
            .kpi-title { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .kpi-value { font-size: 20px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 14px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>IGBS e.V. — Islamische Gemeinschaft für Bildung und Soziales</h1>
          <div class="subtitle">Monatlicher Finanzbericht: ${monthly.monthName} ${year} (VR 25109, Hamburg)</div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Gesamteinnahmen</div>
              <div class="kpi-value" style="color: #15803d;">€ ${monthly.totalIncome.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Gesamtausgaben</div>
              <div class="kpi-value" style="color: #b91c1c;">€ ${monthly.totalExpense.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Netto Saldo</div>
              <div class="kpi-value">€ ${monthly.net.toFixed(2)}</div>
            </div>
          </div>

          <h2>Kategorienübersicht</h2>
          <table>
            <thead>
              <tr>
                <th>Kategorie</th>
                <th>Typ</th>
                <th>Summe (€)</th>
              </tr>
            </thead>
            <tbody>
              ${monthly.byCategory.map((cat) => `
                <tr>
                  <td>${cat.name}</td>
                  <td>${cat.type === "INCOME" ? "Einnahme" : "Ausgabe"}</td>
                  <td style="font-weight: bold;">€ ${Math.abs(cat.total).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          ${paymentInfoHtml}

          <div class="footer">Erstellt am ${new Date().toLocaleDateString("de-DE")} von IGBS Financial App</div>
        </body>
        </html>
      `;
    } else {
      const yearly = await getYearlySummary(year);
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <title>IGBS e.V. Jahresfinanzbericht ${year}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 4px; }
            .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
            .kpi-grid { display: flex; gap: 16px; margin-bottom: 24px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; flex: 1; }
            .kpi-title { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
            .kpi-value { font-size: 20px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 14px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>IGBS e.V. — Islamische Gemeinschaft für Bildung und Soziales</h1>
          <div class="subtitle">Jahres-Finanzbericht ${year} (VR 25109, Hamburg)</div>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-title">Jahreseinnahmen</div>
              <div class="kpi-value" style="color: #15803d;">€ ${yearly.totalIncome.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Jahresausgaben</div>
              <div class="kpi-value" style="color: #b91c1c;">€ ${yearly.totalExpense.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Jahressaldo</div>
              <div class="kpi-value">€ ${yearly.net.toFixed(2)}</div>
            </div>
          </div>

          <h2>Monatliche Entwicklung</h2>
          <table>
            <thead>
              <tr>
                <th>Monat</th>
                <th>Einnahmen (€)</th>
                <th>Ausgaben (€)</th>
                <th>Saldo (€)</th>
              </tr>
            </thead>
            <tbody>
              ${yearly.months.map((m) => `
                <tr>
                  <td>${m.monthName}</td>
                  <td style="color: #15803d;">€ ${m.totalIncome.toFixed(2)}</td>
                  <td style="color: #b91c1c;">€ ${m.totalExpense.toFixed(2)}</td>
                  <td style="font-weight: bold;">€ ${m.net.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          ${paymentInfoHtml}

          <div class="footer">Erstellt am ${new Date().toLocaleDateString("de-DE")} von IGBS Financial App</div>
        </body>
        </html>
      `;
    }

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="IGBS_Finanzbericht_${year}.html"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler beim Erstellen des PDF-Berichts" }, { status: 500 });
  }
}

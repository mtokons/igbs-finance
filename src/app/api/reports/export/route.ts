import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import {
  getMonthlySummary,
  getYearlySummary,
  getMembershipReport,
  getCourseReport,
  getPayrollReport,
  getEventReport,
} from "@/lib/reports";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "xlsx";
  const type = searchParams.get("type") ?? "monthly";
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  if (format !== "xlsx") {
    return NextResponse.json({ error: "Only xlsx export supported" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IGBS Finance";
  workbook.created = new Date();

  if (type === "monthly" || type === "yearly") {
    const sheet = workbook.addWorksheet(type === "monthly" ? "Monatsbericht" : "Jahresbericht");

    if (type === "monthly") {
      const data = await getMonthlySummary(year, month);
      sheet.addRow(["IGBS Finance - Monatsbericht", `${data.monthName} ${year}`]);
      sheet.addRow([]);
      sheet.addRow(["Einnahmen", data.totalIncome]);
      sheet.addRow(["Ausgaben", data.totalExpense]);
      sheet.addRow(["Saldo", data.net]);
      sheet.addRow([]);
      sheet.addRow(["Kategorie", "Typ", "Betrag"]);
      for (const cat of data.byCategory) {
        sheet.addRow([cat.name, cat.type, cat.total]);
      }
    } else {
      const data = await getYearlySummary(year);
      sheet.addRow(["IGBS Finance - Jahresbericht", year]);
      sheet.addRow([]);
      sheet.addRow(["Monat", "Einnahmen", "Ausgaben", "Saldo"]);
      for (const m of data.months) {
        sheet.addRow([m.monthName, m.totalIncome, m.totalExpense, m.net]);
      }
      sheet.addRow([]);
      sheet.addRow(["Gesamt Einnahmen", data.totalIncome]);
      sheet.addRow(["Gesamt Ausgaben", data.totalExpense]);
      sheet.addRow(["Gesamt Saldo", data.net]);
    }
  } else if (type === "membership") {
    const sheet = workbook.addWorksheet("Mitgliedsbeiträge");
    const data = await getMembershipReport(year, month);
    sheet.addRow(["Mitglied", "Code", "Erwartet", "Bezahlt", "Offen", "Status"]);
    for (const row of data) {
      sheet.addRow([row.memberName, row.memberCode, row.expected, row.paid, row.outstanding, row.status]);
    }
  } else if (type === "courses") {
    const sheet = workbook.addWorksheet("Kurse");
    const data = await getCourseReport();
    sheet.addRow(["Kurs", "Mitglied", "Erwartet", "Bezahlt", "Status"]);
    for (const row of data) {
      sheet.addRow([row.courseName, row.memberName, row.expected, row.paid, row.status]);
    }
  } else if (type === "payroll") {
    const sheet = workbook.addWorksheet("Gehälter");
    const data = await getPayrollReport(year, month);
    sheet.addRow(["Lehrer", "Betrag", "Status", "Bezahlt am"]);
    for (const row of data) {
      sheet.addRow([row.teacherName, row.amount, row.status, row.paidAt?.toISOString() ?? ""]);
    }
  } else if (type === "events") {
    const sheet = workbook.addWorksheet("Veranstaltungen");
    const data = await getEventReport();
    sheet.addRow(["Titel", "Datum", "Budget", "Ist", "Abweichung"]);
    for (const row of data) {
      sheet.addRow([row.title, row.eventDate.toISOString().slice(0, 10), row.budget, row.actual, row.variance]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `igbs-${type}-${year}${type === "monthly" || type === "membership" || type === "payroll" ? `-${month}` : ""}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

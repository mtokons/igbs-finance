import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getYearlySummary, getMembershipReport, getCourseReport, getPayrollReport, getEventReport } from "@/lib/reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IGBS e.V. Finance App";
    workbook.created = new Date();

    // Sheet 1: Yearly Financial Summary
    const yearly = await getYearlySummary(year);
    const summarySheet = workbook.addWorksheet(`Jahresübersicht ${year}`);
    summarySheet.columns = [
      { header: "Monat", key: "month", width: 18 },
      { header: "Einnahmen (€)", key: "income", width: 18 },
      { header: "Ausgaben (€)", key: "expense", width: 18 },
      { header: "Netto Saldo (€)", key: "net", width: 18 },
    ];

    yearly.months.forEach((m) => {
      summarySheet.addRow({
        month: m.monthName,
        income: m.totalIncome,
        expense: m.totalExpense,
        net: m.net,
      });
    });

    summarySheet.addRow({
      month: "GESAMT",
      income: yearly.totalIncome,
      expense: yearly.totalExpense,
      net: yearly.net,
    });

    // Sheet 2: Membership Dues Report
    const membershipData = await getMembershipReport(year, new Date().getMonth() + 1);
    const memberSheet = workbook.addWorksheet("Mitgliedsbeiträge");
    memberSheet.columns = [
      { header: "Mitgliedsname", key: "name", width: 28 },
      { header: "Mitgliedscode", key: "code", width: 16 },
      { header: "Soll (€)", key: "expected", width: 14 },
      { header: "Ist (€)", key: "paid", width: 14 },
      { header: "Offen (€)", key: "outstanding", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];

    membershipData.forEach((item) => {
      memberSheet.addRow({
        name: item.memberName,
        code: item.memberCode || "—",
        expected: item.expected,
        paid: item.paid,
        outstanding: item.outstanding,
        status: item.status,
      });
    });

    // Sheet 3: Madrasha & Payroll & Events
    const courseData = await getCourseReport();
    const courseSheet = workbook.addWorksheet("Madrasha Kurse");
    courseSheet.columns = [
      { header: "Kurs", key: "course", width: 24 },
      { header: "Teilnehmer", key: "member", width: 28 },
      { header: "Gebühr (€)", key: "expected", width: 14 },
      { header: "Bezahlt (€)", key: "paid", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];
    courseData.forEach((c) => {
      courseSheet.addRow({
        course: c.courseName,
        member: c.memberName,
        expected: c.expected,
        paid: c.paid,
        status: c.status,
      });
    });

    const eventData = await getEventReport();
    const eventSheet = workbook.addWorksheet("Veranstaltungen");
    eventSheet.columns = [
      { header: "Veranstaltung", key: "title", width: 28 },
      { header: "Datum", key: "date", width: 16 },
      { header: "Budget (€)", key: "budget", width: 14 },
      { header: "Ist-Stand (€)", key: "actual", width: 14 },
      { header: "Abweichung (€)", key: "variance", width: 14 },
    ];
    eventData.forEach((ev) => {
      eventSheet.addRow({
        title: ev.title,
        date: new Date(ev.eventDate).toLocaleDateString("de-DE"),
        budget: ev.budget,
        actual: ev.actual,
        variance: ev.variance,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="IGBS_Finanzbericht_${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Fehler beim Erstellen des Excel-Exports" }, { status: 500 });
  }
}

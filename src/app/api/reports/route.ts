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

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "monthly";
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  switch (type) {
    case "monthly":
      return NextResponse.json(await getMonthlySummary(year, month));
    case "yearly":
      return NextResponse.json(await getYearlySummary(year));
    case "membership":
      return NextResponse.json(await getMembershipReport(year, month));
    case "courses":
      return NextResponse.json(await getCourseReport());
    case "payroll":
      return NextResponse.json(await getPayrollReport(year, month));
    case "events":
      return NextResponse.json(await getEventReport());
    default:
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }
}

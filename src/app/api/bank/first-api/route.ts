import { NextRequest, NextResponse } from "next/server";
import { fetchFirstApiTeams, syncFirstApiAsTransactions } from "@/lib/first-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const country = searchParams.get("country") || "DE";

    const teams = await fetchFirstApiTeams(query, country);
    return NextResponse.json({ success: true, count: teams.length, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await syncFirstApiAsTransactions(body.selectedIds);
    return NextResponse.json({ success: true, message: `Synced ${result.added} transactions from FIRST API.`, added: result.added });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

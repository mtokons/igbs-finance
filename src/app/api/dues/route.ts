import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { getDuesBoard } from "@/lib/membership";

export async function GET(req: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const board = await getDuesBoard(year, month);
  return NextResponse.json(board);
}

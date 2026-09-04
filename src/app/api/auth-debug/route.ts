import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const authSecret = process.env.AUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const vercelUrl = process.env.VERCEL_URL;
  const vercelProjectProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  return NextResponse.json({
    hasNextAuthSecret: !!nextAuthSecret,
    nextAuthSecretLen: nextAuthSecret ? nextAuthSecret.length : 0,
    nextAuthSecretPrefix: nextAuthSecret ? nextAuthSecret.substring(0, 4) + "..." : null,
    hasAuthSecret: !!authSecret,
    nextAuthUrl,
    vercelUrl,
    vercelProjectProdUrl,
  });
}

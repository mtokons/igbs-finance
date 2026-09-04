import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "igbs-local-development-secret-key-32chars";

// Sanitize NEXTAUTH_URL in middleware edge runtime to avoid https://https issues
if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL === "https" || process.env.NEXTAUTH_URL === "https://") {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = "https://igbs-finance.vercel.app";
  }
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/settings") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    secret: AUTH_SECRET,
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/status") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/auth-debug") ||
          pathname.startsWith("/api/student-status") ||
          pathname.startsWith("/api/bank/gocardless/callback")
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};


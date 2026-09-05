import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const rawSecret = (process.env.NEXTAUTH_SECRET || "").trim() || (process.env.AUTH_SECRET || "").trim();
const AUTH_SECRET = rawSecret || "igbs-local-development-secret-key-32chars";
process.env.NEXTAUTH_SECRET = AUTH_SECRET;
process.env.AUTH_SECRET = AUTH_SECRET;

// Strictly trim and sanitize NEXTAUTH_URL in middleware edge runtime
const rawUrl = (process.env.NEXTAUTH_URL || "").trim();
if (!rawUrl || rawUrl === "https" || rawUrl === "https://" || !rawUrl.includes(".")) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL.trim()}`;
  } else {
    process.env.NEXTAUTH_URL = "https://igbs-finance.vercel.app";
  }
} else {
  process.env.NEXTAUTH_URL = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/settings") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Restrict student role to student portal, their own attendance, and evaluations
    if (role === "STUDENT") {
      const allowedStudentPaths = [
        "/dashboard/student-portal",
        "/dashboard/madrasha/attendance",
        "/dashboard/madrasha/evaluations",
      ];
      const isAllowed = allowedStudentPaths.some((p) => path === p || path.startsWith(p + "/"));
      if (!isAllowed && path.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard/student-portal", req.url));
      }
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


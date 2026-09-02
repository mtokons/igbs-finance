import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/login")) {
          return true;
        }
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        if (req.nextUrl.pathname.startsWith("/api/bank/gocardless/callback")) {
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

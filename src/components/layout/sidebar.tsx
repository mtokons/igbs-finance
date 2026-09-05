"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  GraduationCap,
  UserCheck,
  Calendar,
  BarChart3,
  Landmark,
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  BookOpen,
  ClipboardCheck,
  Award,
  ChevronDown,
  ChevronRight,
  UserPlus,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const madrashaSubItems = [
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/madrasha/students", label: "Students & Roll Nos", icon: UserPlus },
  { href: "/dashboard/madrasha/attendance", label: "Attendance / Roll Call", icon: ClipboardCheck },
  { href: "/dashboard/madrasha/evaluations", label: "Evaluations & Grades", icon: Award },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isStudent = role === "STUDENT";
  const isTeacher = role === "TEACHER";

  const isMadrashaActive =
    pathname.startsWith("/dashboard/courses") ||
    pathname.startsWith("/dashboard/madrasha");

  const [madrashaOpen, setMadrashaOpen] = useState(true);

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card sticky top-0 shrink-0">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow">
            IG
          </div>
          <div>
            <h1 className="text-base font-bold text-primary leading-tight">IGBS Finance</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">e.V. Hamburg (VR 25109)</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {/* Student-only view */}
        {isStudent ? (
          <>
            <Link
              href="/dashboard/student-portal"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard/student-portal") || pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <School className="h-4 w-4 shrink-0" />
              <span>My Student Portal</span>
            </Link>
            <Link
              href="/dashboard/madrasha/attendance"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/dashboard/madrasha/attendance"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span>My Attendance</span>
            </Link>
            <Link
              href="/dashboard/madrasha/evaluations"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/dashboard/madrasha/evaluations"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Award className="h-4 w-4 shrink-0" />
              <span>My Evaluations</span>
            </Link>
          </>
        ) : (
          <>
            {/* Standard Dashboard items */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            {!isTeacher && (
              <>
                <Link
                  href="/dashboard/members"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/members")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Users className="h-4 w-4 shrink-0" />
                  <span>Members</span>
                </Link>

                <Link
                  href="/dashboard/dues"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/dues")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <CreditCard className="h-4 w-4 shrink-0" />
                  <span>Membership Dues</span>
                </Link>

                <Link
                  href="/dashboard/transactions"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/transactions")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <ArrowLeftRight className="h-4 w-4 shrink-0" />
                  <span>Transactions</span>
                </Link>

                <Link
                  href="/dashboard/bank"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/bank")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Landmark className="h-4 w-4 shrink-0" />
                  <span>Bank Integration</span>
                </Link>
              </>
            )}

            {/* MADRASHA SECTION WITH SUBMENUS */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMadrashaOpen(!madrashaOpen)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors",
                  isMadrashaActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>Madrasha</span>
                </span>
                {madrashaOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>

              {madrashaOpen && (
                <div className="pl-3 mt-1 space-y-1 border-l-2 border-primary/20 ml-3">
                  {madrashaSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const active = pathname === sub.href || pathname.startsWith(sub.href);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <SubIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Teachers, Events, Reports & Settings */}
            <div className="pt-2 space-y-1">
              {!isTeacher && (
                <Link
                  href="/dashboard/teachers"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/teachers")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span>Teachers &amp; Payroll</span>
                </Link>
              )}

              {!isTeacher && (
                <Link
                  href="/dashboard/events"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/events")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Events</span>
                </Link>
              )}

              {!isTeacher && (
                <Link
                  href="/dashboard/reports"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/reports")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <BarChart3 className="h-4 w-4 shrink-0" />
                  <span>Financial Reports</span>
                </Link>
              )}

              {role === "ADMIN" && (
                <Link
                  href="/dashboard/settings"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/dashboard/settings")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>Settings</span>
                </Link>
              )}
            </div>
          </>
        )}
      </nav>

      <div className="border-t p-4 space-y-2 bg-muted/20">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{session?.user?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.role} • {session?.user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-9 justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

export function MobileHeaderAndNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isStudent = role === "STUDENT";
  const isTeacher = role === "TEACHER";

  return (
    <>
      {/* Mobile Sticky Top Header */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b bg-card/95 backdrop-blur px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground rounded-md active:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              IGBS Madrasha &amp; Finance
            </h1>
            <p className="text-[10px] text-muted-foreground">IGBS e.V. Hamburg</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/student-portal"
            className="text-[11px] font-semibold text-primary px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20"
          >
            Student Portal
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase shadow-sm"
          >
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-[82%] max-w-xs bg-card shadow-2xl border-r z-50 h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  IG
                </div>
                <div>
                  <h2 className="text-sm font-bold text-primary">IGBS Finance</h2>
                  <p className="text-[10px] text-muted-foreground">VR 25109 Hamburg</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {isStudent ? (
                <>
                  <Link
                    href="/dashboard/student-portal"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <School className="h-4 w-4 shrink-0" />
                    <span>My Student Portal</span>
                  </Link>
                  <Link
                    href="/dashboard/madrasha/attendance"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" />
                    <span>My Attendance</span>
                  </Link>
                  <Link
                    href="/dashboard/madrasha/evaluations"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <Award className="h-4 w-4 shrink-0" />
                    <span>My Evaluations</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    <span>Dashboard</span>
                  </Link>

                  {!isTeacher && (
                    <>
                      <Link
                        href="/dashboard/members"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        <Users className="h-4 w-4 shrink-0" />
                        <span>Members</span>
                      </Link>
                      <Link
                        href="/dashboard/dues"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        <CreditCard className="h-4 w-4 shrink-0" />
                        <span>Membership Dues</span>
                      </Link>
                      <Link
                        href="/dashboard/transactions"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        <ArrowLeftRight className="h-4 w-4 shrink-0" />
                        <span>Transactions</span>
                      </Link>
                    </>
                  )}

                  <div className="pt-2 pb-1 text-xs font-bold text-primary px-3 uppercase tracking-wider">
                    Madrasha
                  </div>
                  {madrashaSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent pl-5"
                      >
                        <SubIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}

                  {!isTeacher && (
                    <>
                      <div className="pt-2 pb-1 text-xs font-bold text-muted-foreground px-3 uppercase tracking-wider">
                        Management
                      </div>
                      <Link
                        href="/dashboard/teachers"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        <UserCheck className="h-4 w-4 shrink-0" />
                        <span>Teachers &amp; Payroll</span>
                      </Link>
                      <Link
                        href="/dashboard/reports"
                        onClick={() => setDrawerOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                      >
                        <BarChart3 className="h-4 w-4 shrink-0" />
                        <span>Reports</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            <div className="border-t p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{session?.user?.name || "User"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-10 justify-start"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t bg-card/95 backdrop-blur px-1 py-1 shadow-lg safe-bottom">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[10px] font-medium",
            pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/dashboard/courses"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[10px] font-medium",
            pathname.startsWith("/dashboard/courses") ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          <span>Courses</span>
        </Link>
        <Link
          href="/dashboard/madrasha/students"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[10px] font-medium",
            pathname.startsWith("/dashboard/madrasha/students") ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <UserPlus className="h-4 w-4" />
          <span>Students</span>
        </Link>
        <Link
          href="/dashboard/madrasha/attendance"
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[10px] font-medium",
            pathname.startsWith("/dashboard/madrasha/attendance") ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Roll Call</span>
        </Link>
      </nav>
    </>
  );
}

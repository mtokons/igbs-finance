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
  Shield,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/dues", label: "Membership Dues", icon: CreditCard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/bank", label: "Bank Integration", icon: Landmark },
  { href: "/dashboard/courses", label: "Madrasha Courses", icon: GraduationCap },
  { href: "/dashboard/teachers", label: "Teachers & Payroll", icon: UserCheck },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/reports", label: "Financial Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export const bottomNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/dues", label: "Dues", icon: CreditCard },
  { href: "/dashboard/courses", label: "Courses", icon: GraduationCap },
  { href: "/dashboard/transactions", label: "Tx", icon: ArrowLeftRight },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card sticky top-0 shrink-0">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            IG
          </div>
          <div>
            <h1 className="text-base font-bold text-primary leading-tight">IGBS Finance</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">e.V. Hamburg (VR 25109)</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && role !== "ADMIN") return null;
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2 bg-muted/20">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{session?.user?.name || "Finance User"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
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

  const currentItem = navItems.find(
    (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );

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
              {currentItem?.label || "IGBS Finance"}
            </h1>
            <p className="text-[10px] text-muted-foreground">IGBS e.V. Hamburg</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/status"
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
              {navItems.map((item) => {
                if (item.adminOnly && role !== "ADMIN") return null;
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                      active
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t mt-2">
                <Link
                  href="/status"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 min-h-[44px]"
                >
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>Public Student Status</span>
                </Link>
              </div>
            </nav>

            <div className="border-t p-4 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{session?.user?.name || "Staff Member"}</p>
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
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-medium transition-colors min-w-[58px] min-h-[46px]",
                active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("p-1 rounded-md transition-all", active && "bg-primary/10 text-primary")}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="mt-0.5 leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* 5th More Menu button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-medium transition-colors min-w-[58px] min-h-[46px] text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="p-1 rounded-md">
            <Menu className="h-4 w-4" />
          </div>
          <span className="mt-0.5 leading-none">More</span>
        </button>
      </nav>
    </>
  );
}

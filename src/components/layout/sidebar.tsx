"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="border-b p-6">
        <h1 className="text-lg font-bold text-primary">IGBS Finance</h1>
        <p className="text-xs text-muted-foreground">e.V. Hamburg (VR 25109)</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          if (item.adminOnly && role !== "ADMIN") return null;
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="mb-2 truncate text-xs text-muted-foreground">{session?.user?.email}</p>
        <Button variant="outline" size="sm" className="w-full" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

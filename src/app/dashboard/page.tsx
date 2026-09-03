import { getDashboardStats } from "@/lib/reports";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Users,
  ArrowLeftRight,
  Landmark,
  Plus,
  CreditCard,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Mobile Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">IGBS e.V. Financial Overview & Key Metrics</p>
        </div>

        {/* Quick action shortcuts on mobile/tablet */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button asChild size="sm" className="h-9 text-xs shrink-0 shadow-sm">
            <Link href="/dashboard/courses">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
              Enroll Student
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs shrink-0">
            <Link href="/dashboard/transactions">
              <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
              Reconcile
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs shrink-0">
            <Link href="/dashboard/bank">
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Import CSV
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Dues</CardTitle>
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.pendingDues}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">pending this month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Overdue Members</CardTitle>
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-destructive">{stats.overdueDues}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">members overdue</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Unmatched Tx</CardTitle>
            <ArrowLeftRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.unmatchedCount}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">reconciliation queue</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-3.5 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Saldo</CardTitle>
            <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3.5 sm:p-6 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.monthlySummary.net)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {stats.monthlySummary.monthName} {stats.monthlySummary.year}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Monthly Financial Summary</CardTitle>
            <CardDescription className="text-xs">
              {stats.monthlySummary.monthName} {stats.monthlySummary.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(stats.monthlySummary.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-semibold text-red-700">
                {formatCurrency(stats.monthlySummary.totalExpense)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2 font-bold">
              <span>Net Balance</span>
              <span className={stats.monthlySummary.net >= 0 ? "text-green-700" : "text-destructive"}>
                {formatCurrency(stats.monthlySummary.net)}
              </span>
            </div>
            <div className="pt-3">
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/dashboard/reports">View Detailed Reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Bank Account Connection</CardTitle>
            <CardDescription className="text-xs">FYRST &amp; PSD2 Sync Health</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2.5 text-xs sm:text-sm">
            {stats.bankConnection ? (
              <>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      stats.bankConnection.status === "LINKED"
                        ? "success"
                        : stats.bankConnection.status === "EXPIRED"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {stats.bankConnection.status}
                  </Badge>
                </div>
                {stats.bankConnection.institutionName && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Institution</span>
                    <span className="font-medium">{stats.bankConnection.institutionName}</span>
                  </div>
                )}
                {stats.bankConnection.lastSyncAt && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span>{formatDate(stats.bankConnection.lastSyncAt)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground py-2 text-xs">
                <p>No active bank API connection configured.</p>
                <p className="mt-1">You can import FYRST CSV statements anytime.</p>
              </div>
            )}
            <div className="pt-3">
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/dashboard/bank">Manage Bank &amp; CSV Import</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Recent Transactions</CardTitle>
          <CardDescription className="text-xs">Latest recorded transactions across accounts</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-2">
            {stats.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b py-2.5 last:border-0 text-xs sm:text-sm">
                <div className="min-w-0 pr-2">
                  <p className="font-medium truncate">{tx.counterparty ?? tx.reference ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(tx.bookingDate)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={decimalToNumber(tx.amount) >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                    {formatCurrency(decimalToNumber(tx.amount))}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {tx.reconciliationStatus}
                  </Badge>
                </div>
              </div>
            ))}
            {stats.recentTransactions.length === 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground py-4 text-center">No recent bank transactions found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

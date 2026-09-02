import { getDashboardStats } from "@/lib/reports";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, ArrowLeftRight, Landmark } from "lucide-react";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">IGBS e.V. Financial Overview & Key Metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDues}</div>
            <p className="text-xs text-muted-foreground">pending this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Members</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueDues}</div>
            <p className="text-xs text-muted-foreground">members overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unmatched Transactions</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unmatchedCount}</div>
            <p className="text-xs text-muted-foreground">reconciliation queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Saldo</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlySummary.net)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlySummary.monthName} {stats.monthlySummary.year}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Summary</CardTitle>
            <CardDescription>
              {stats.monthlySummary.monthName} {stats.monthlySummary.year}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Income</span>
              <span className="font-medium text-green-700">
                {formatCurrency(stats.monthlySummary.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Expenses</span>
              <span className="font-medium text-red-700">
                {formatCurrency(stats.monthlySummary.totalExpense)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Net Balance</span>
              <span className="font-bold">{formatCurrency(stats.monthlySummary.net)}</span>
            </div>
            <Link href="/dashboard/reports">
              <Button variant="outline" size="sm" className="mt-4">
                View Detailed Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account Connection</CardTitle>
            <CardDescription>PSD2 & API Sync Health Status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.bankConnection ? (
              <>
                <div className="flex items-center gap-2">
                  <span>Status:</span>
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
                {stats.bankConnection.lastSyncAt && (
                  <p className="text-sm text-muted-foreground">
                    Last Synced: {formatDate(stats.bankConnection.lastSyncAt)}
                  </p>
                )}
                {stats.bankConnection.consentExpires && (
                  <p className="text-sm text-muted-foreground">
                    Consent Valid Until: {formatDate(stats.bankConnection.consentExpires)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No bank account linked via GoCardless</p>
            )}
            <Link href="/dashboard/bank">
              <Button variant="outline" size="sm" className="mt-2">
                Manage Bank Connections
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b py-2 last:border-0">
                <div>
                  <p className="font-medium">{tx.counterparty ?? tx.reference ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.bookingDate)}</p>
                </div>
                <div className="text-right">
                  <p className={decimalToNumber(tx.amount) >= 0 ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>
                    {formatCurrency(decimalToNumber(tx.amount))}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {tx.reconciliationStatus}
                  </Badge>
                </div>
              </div>
            ))}
            {stats.recentTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent bank transactions found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

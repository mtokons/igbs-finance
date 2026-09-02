"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [yearlyData, setYearlyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport(selectedYear: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?year=${selectedYear}`);
      setYearlyData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(year);
  }, [year]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports & Exports</h1>
          <p className="text-muted-foreground">Monthly and annual summaries, category breakdowns, and board-ready reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={(v) => setYear(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" asChild>
            <a href={`/api/reports/export/pdf?year=${year}`} target="_blank" rel="noreferrer">
              <FileText className="mr-2 h-4 w-4 text-red-600" /> Print PDF Report
            </a>
          </Button>

          <Button asChild>
            <a href={`/api/reports/export/excel?year=${year}`} download>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Export Excel (.xlsx)
            </a>
          </Button>
        </div>
      </div>

      {yearlyData && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Total Annual Income ({year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{formatCurrency(yearlyData.totalIncome || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" /> Total Annual Expenses ({year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{formatCurrency(yearlyData.totalExpense || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Saldo ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(yearlyData.net || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>12-Month Financial Summary ({year})</CardTitle>
          <CardDescription>Monthly progression of income, expenses, and net balance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-6 animate-pulse">Loading report data...</p>
          ) : (
            <div className="space-y-3">
              {yearlyData?.months?.map((m: any) => (
                <div key={m.month} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/10 transition-colors">
                  <div className="w-36 font-semibold">{m.monthName}</div>
                  <div className="flex-1 grid grid-cols-3 text-right gap-4">
                    <span className="text-green-600 font-medium">+ {formatCurrency(m.totalIncome)}</span>
                    <span className="text-red-600 font-medium">- {formatCurrency(m.totalExpense)}</span>
                    <span className="font-bold">{formatCurrency(m.net)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

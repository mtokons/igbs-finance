"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, GraduationCap, CreditCard, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StudentStatusPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/student-status?query=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No student record found.");
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err.message || "Failed to search status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-3 sm:p-4 py-6">
      <div className="w-full max-w-lg space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between px-1">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-medium">
            <ArrowLeft className="h-3 w-3" /> Back to Staff Login
          </Link>
          <span className="text-[11px] text-muted-foreground font-mono">IGBS Portal</span>
        </div>

        <Card className="shadow-lg border">
          <CardHeader className="text-center p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1.5 sm:mb-2">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Student Course &amp; Fee Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Check enrollment, fee payment status, and bank details using your Student ID or email
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Roll No (e.g. RN-2026-001), Student ID (STU-0001) or Email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                className="text-xs sm:text-sm h-10"
              />
              <Button type="submit" disabled={loading} className="h-10 text-xs sm:text-sm shrink-0">
                <Search className="h-3.5 w-3.5 mr-1" /> {loading ? "..." : "Check"}
              </Button>
            </form>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {data && (
              <div className="space-y-4 border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-lg">{data.studentName}</h3>
                    <p className="text-xs text-muted-foreground">{data.courseName} • {data.semester}</p>
                    {data.teacherName && <p className="text-[11px] text-muted-foreground">Teacher: {data.teacherName}</p>}
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-muted block mb-1">
                      {data.rollNumber || data.studentId}
                    </span>
                    <Badge variant={data.status === "PAID" ? "success" : "warning"}>
                      {data.status === "PAID" ? "Paid" : data.status === "PARTIAL" ? "Partial" : "Payment Pending"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-muted/40 rounded-md text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Semester Fee</p>
                    <p className="font-semibold">{formatCurrency(data.expectedFee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold text-green-600">{formatCurrency(data.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="font-semibold text-destructive">{formatCurrency(data.dueAmount)}</p>
                  </div>
                </div>

                {data.paymentPlan === "INSTALLMENTS_2" && (
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-muted/30 rounded-lg border">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Installment 1 ({formatCurrency(data.installment1Amount)})</span>
                      <Badge variant={data.installment1Status === "PAID" ? "success" : "secondary"} className="text-[10px] mt-0.5">
                        {data.installment1Status === "PAID" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Installment 2 ({formatCurrency(data.installment2Amount)})</span>
                      <Badge variant={data.installment2Status === "PAID" ? "success" : "secondary"} className="text-[10px] mt-0.5">
                        {data.installment2Status === "PAID" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                )}

                {data.evaluation && (
                  <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1.5">
                    <div className="flex justify-between items-center font-bold">
                      <span>Performance &amp; Grade</span>
                      <Badge variant="success">{data.evaluation.grade || "Passed"} ({data.evaluation.totalScore}%)</Badge>
                    </div>
                    {data.evaluation.remarks && (
                      <p className="text-[11px] text-muted-foreground italic">&quot;{data.evaluation.remarks}&quot;</p>
                    )}
                  </div>
                )}

                {data.payments && data.payments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t text-xs">
                    <p className="font-semibold flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> Payment History:
                    </p>
                    {data.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center bg-muted/20 p-2 rounded">
                        <span>{formatDate(p.paidAt)} ({p.method})</span>
                        <span className="font-semibold text-green-700">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {data.dueAmount > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs space-y-2">
                    <p className="font-semibold text-primary flex items-center gap-1">
                      <CreditCard className="h-4 w-4" /> Bank Details for Fee Transfer:
                    </p>
                    <div className="space-y-1 font-mono text-foreground">
                      <p><span className="text-muted-foreground">Bank:</span> {data.bankDetails.bankName}</p>
                      <p><span className="text-muted-foreground">Empfänger:</span> {data.bankDetails.accountHolder}</p>
                      <p><span className="text-muted-foreground">IBAN:</span> {data.bankDetails.iban}</p>
                      <p><span className="text-muted-foreground">BIC:</span> {data.bankDetails.bic}</p>
                      <p className="bg-primary/10 p-1 rounded font-semibold text-primary">
                        Verwendungszweck: {data.bankDetails.reference}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

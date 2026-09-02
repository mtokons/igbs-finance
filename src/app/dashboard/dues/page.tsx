"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface DuesPayment {
  id: string;
  memberId: string;
  expectedAmount: string;
  paidAmount: string;
  status: string;
  member: { fullName: string; memberCode: string | null; monthlyFee: string };
}

interface DuesBoard {
  payments: DuesPayment[];
  summary: {
    totalExpected: number;
    totalPaid: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
}

export default function DuesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [board, setBoard] = useState<DuesBoard | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadBoard() {
    setLoading(true);
    const res = await fetch(`/api/dues?year=${year}&month=${month}`);
    setBoard(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadBoard(); }, [year, month]);

  async function markPaid(memberId: string, amount: number) {
    await fetch("/api/dues/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, year, month, amount }),
    });
    loadBoard();
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Membership Dues Matrix</h1>
        <p className="text-muted-foreground">Monthly payment status tracking grid per member</p>
      </div>

      <div className="flex gap-4">
        <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {board && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Expected</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(board.summary.totalExpected)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Paid</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-700">{formatCurrency(board.summary.totalPaid)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Paid Members</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-700">{board.summary.paidCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending Dues</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-yellow-700">{board.summary.pendingCount}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Member Code</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center py-6">Loading dues grid...</TableCell></TableRow>
              )}
              {board?.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.member.fullName}</TableCell>
                  <TableCell>{p.member.memberCode ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(p.expectedAmount))}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(p.paidAmount))}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "PAID" ? "success" : p.status === "OVERDUE" ? "destructive" : "warning"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status !== "PAID" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(p.memberId, parseFloat(p.member.monthlyFee))}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

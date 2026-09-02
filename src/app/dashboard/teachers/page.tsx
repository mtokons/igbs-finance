"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, Plus, Banknote } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", defaultSalary: "350", paymentHint: "" });
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  async function loadTeachers() {
    const res = await fetch("/api/teachers");
    setTeachers(await res.json());
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        defaultSalary: parseFloat(form.defaultSalary),
        paymentHint: form.paymentHint || undefined,
      }),
    });
    setShowAddForm(false);
    setForm({ name: "", email: "", phone: "", defaultSalary: "350", paymentHint: "" });
    loadTeachers();
  }

  async function handleRecordSalary(teacherId: string, amount: number) {
    const now = new Date();
    await fetch(`/api/teachers/${teacherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "recordSalary",
        periodYear: now.getFullYear(),
        periodMonth: now.getMonth() + 1,
        amount,
      }),
    });
    loadTeachers();
    if (selectedTeacher) {
      viewTeacherDetail(teacherId);
    }
  }

  async function viewTeacherDetail(id: string) {
    const res = await fetch(`/api/teachers/${id}`);
    setSelectedTeacher(await res.json());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Teachers &amp; Payroll</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage teacher profiles, honorarium payouts, and monthly payroll history</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="w-full sm:w-auto h-9 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Teacher
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Create Teacher Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeacher} className="grid gap-4 md:grid-cols-2">
              <div><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone Number</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Default Monthly Salary (€)</Label><Input type="number" step="0.01" value={form.defaultSalary} onChange={(e) => setForm({ ...form, defaultSalary: e.target.value })} required /></div>
              <div className="md:col-span-2"><Label>Payment Info / Bank Reference Hint</Label><Input value={form.paymentHint} onChange={(e) => setForm({ ...form, paymentHint: e.target.value })} /></div>
              <div className="md:col-span-2"><Button type="submit">Save Teacher</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {teachers.map((t) => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" /> {t.name}
                </CardTitle>
                <Badge variant={t.isActive ? "success" : "secondary"}>{t.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <CardDescription>{t.email || t.phone || "No contact info"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Default Honorarium:</span>
                <span className="font-semibold">{formatCurrency(Number(t.defaultSalary))}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => viewTeacherDetail(t.id)}>
                  Payroll History
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleRecordSalary(t.id, Number(t.defaultSalary))}>
                  <Banknote className="mr-1 h-3 w-3" /> Record Payout
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl shadow-xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedTeacher.name} — Payroll History</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeacher(null)}>✕</Button>
              </CardTitle>
              <CardDescription>Payout history and bank reconciliation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year / Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTeacher.salaryPayments?.map((sp: any) => (
                    <TableRow key={sp.id}>
                      <TableCell className="font-medium">{sp.periodYear} / {sp.periodMonth}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatCurrency(Number(sp.amount))}</TableCell>
                      <TableCell>{sp.paidAt ? formatDate(sp.paidAt) : "—"}</TableCell>
                      <TableCell><Badge variant="success">{sp.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {(!selectedTeacher.salaryPayments || selectedTeacher.salaryPayments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                        No payout records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UserCheck,
  Plus,
  Banknote,
  KeyRound,
  Trash2,
  Edit,
  ClipboardCheck,
  BookOpen,
  Award,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function TeachersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrTreasurer = role === "ADMIN" || role === "TREASURER";

  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    defaultSalary: "350",
    paymentHint: "",
    createLogin: true,
    tempPassword: "IGBS2026!",
  });
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);

  // Creds modal
  const [credsModalTeacher, setCredsModalTeacher] = useState<any | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState("IGBS2026!");
  const [credsMsg, setCredsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submittingCreds, setSubmittingCreds] = useState(false);

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
        createLogin: form.createLogin,
        tempPassword: form.tempPassword || undefined,
      }),
    });
    setShowAddForm(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      defaultSalary: "350",
      paymentHint: "",
      createLogin: true,
      tempPassword: "IGBS2026!",
    });
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

  async function handleSetupTeacherLogin(teacherId: string) {
    setSubmittingCreds(true);
    setCredsMsg(null);
    try {
      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createLogin",
          tempPassword: tempPasswordInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredsMsg({ type: "success", text: data.message || "Login credentials updated successfully!" });
        loadTeachers();
      } else {
        setCredsMsg({ type: "error", text: data.error || "Failed to update login." });
      }
    } catch (e: any) {
      setCredsMsg({ type: "error", text: e.message || "An unexpected error occurred." });
    } finally {
      setSubmittingCreds(false);
    }
  }

  async function handleDeleteTeacher(teacher: any) {
    if (!confirm(`Are you sure you want to delete teacher "${teacher.name}"?`)) {
      return;
    }
    await fetch(`/api/teachers/${teacher.id}`, { method: "DELETE" });
    if (selectedTeacher?.id === teacher.id) setSelectedTeacher(null);
    loadTeachers();
  }

  async function viewTeacherDetail(id: string) {
    const res = await fetch(`/api/teachers/${id}`);
    setSelectedTeacher(await res.json());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-primary" />
            Teachers &amp; Payroll
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage teacher profiles, roll call portal login accounts, and monthly honorarium payouts
          </p>
        </div>
        {isAdminOrTreasurer && (
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" className="w-full sm:w-auto h-9 text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Teacher
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="shadow-md border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Create Teacher Profile &amp; Login</CardTitle>
            <CardDescription className="text-xs">
              Add teacher details, honorarium rate, and create portal login credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleCreateTeacher} className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Full Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (For Portal Login)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone Number</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Default Monthly Honorarium (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultSalary}
                  onChange={(e) => setForm({ ...form, defaultSalary: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs">Payment Info / Bank Reference Hint</Label>
                <Input
                  value={form.paymentHint}
                  onChange={(e) => setForm({ ...form, paymentHint: e.target.value })}
                  placeholder="e.g. Madrasha Honorarium Sheikh Abdullah"
                />
              </div>

              {/* Portal Login Credentials */}
              <div className="md:col-span-2 p-3 bg-muted/40 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createLogin"
                    checked={form.createLogin}
                    onChange={(e) => setForm({ ...form, createLogin: e.target.checked })}
                    className="h-4 w-4 rounded border-primary text-primary"
                  />
                  <Label htmlFor="createLogin" className="text-xs font-bold cursor-pointer">
                    Create Portal Login Account for Teacher (Roll Call &amp; Evaluations)
                  </Label>
                </div>
                {form.createLogin && (
                  <div className="space-y-1 pt-1">
                    <Label className="text-xs">Temporary Password</Label>
                    <Input
                      value={form.tempPassword}
                      onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                      placeholder="IGBS2026!"
                      className="text-xs sm:text-sm max-w-sm"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Teacher
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Teachers Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((t) => (
          <Card key={t.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" /> {t.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">{t.email || t.phone || "No contact info"}</CardDescription>
                </div>
                <Badge variant={t.isActive ? "success" : "secondary"} className="text-[10px]">
                  {t.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              <div className="p-2.5 bg-muted/40 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Default Honorarium:</span>
                  <span className="font-bold text-foreground">{formatCurrency(Number(t.defaultSalary))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Portal Login:</span>
                  <Badge variant={t.user ? "success" : "outline"} className="text-[10px] h-4">
                    {t.user ? "Enabled" : "Not Set"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Assigned Courses:</span>
                  <span className="font-semibold">{t.courses?.length || 0} courses</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => viewTeacherDetail(t.id)}>
                  Payroll History
                </Button>
                {isAdminOrTreasurer && (
                  <Button
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => handleRecordSalary(t.id, Number(t.defaultSalary))}
                  >
                    <Banknote className="mr-1 h-3.5 w-3.5" /> Record Payout
                  </Button>
                )}
              </div>

              {isAdminOrTreasurer && (
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
                    onClick={() => {
                      setCredsModalTeacher(t);
                      setTempPasswordInput("IGBS2026!");
                      setCredsMsg(null);
                    }}
                  >
                    <KeyRound className="mr-1 h-3.5 w-3.5" /> Login Info
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    title="Delete Teacher"
                    onClick={() => handleDeleteTeacher(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEACHER CREDENTIALS MODAL */}
      {credsModalTeacher && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl border">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" /> Teacher Portal Login
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCredsModalTeacher(null)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">Teacher: {credsModalTeacher.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
              {credsMsg && (
                <div
                  className={`p-2.5 rounded text-xs font-semibold ${
                    credsMsg.type === "success"
                      ? "bg-green-500/10 text-green-700 border border-green-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {credsMsg.text}
                </div>
              )}

              <div className="p-2.5 bg-muted rounded text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">Login Email: </span>
                  <span className="font-semibold text-foreground">
                    {credsModalTeacher.email || `${credsModalTeacher.name.toLowerCase().replace(/\s+/g, ".")}@teacher.igbs.local`}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account Status: </span>
                  <Badge variant={credsModalTeacher.user ? "success" : "secondary"} className="text-[10px]">
                    {credsModalTeacher.user ? "Active" : "Not yet generated"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Set / Reset Temporary Password</Label>
                <Input
                  value={tempPasswordInput}
                  onChange={(e) => setTempPasswordInput(e.target.value)}
                  placeholder="e.g. IGBS2026!"
                  className="text-xs sm:text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Teacher can log in at <Link href="/login" className="underline font-medium">/login</Link> with their email and this password to record attendance and evaluations.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCredsModalTeacher(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSetupTeacherLogin(credsModalTeacher.id)}
                  disabled={submittingCreds}
                >
                  {submittingCreds ? "Saving..." : "Save Credentials"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PAYROLL HISTORY MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl shadow-xl border">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg">{selectedTeacher.name} — Payroll History</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeacher(null)}>✕</Button>
              </div>
              <CardDescription className="text-xs">Payout history and bank reconciliation</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
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
                      <TableCell className="font-medium text-xs">{sp.periodYear} / {sp.periodMonth}</TableCell>
                      <TableCell className="font-semibold text-red-600 text-xs">{formatCurrency(Number(sp.amount))}</TableCell>
                      <TableCell className="text-xs">{sp.paidAt ? formatDate(sp.paidAt) : "—"}</TableCell>
                      <TableCell><Badge variant="success" className="text-[10px]">{sp.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {(!selectedTeacher.salaryPayments || selectedTeacher.salaryPayments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">
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

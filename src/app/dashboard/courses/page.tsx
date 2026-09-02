"use client";

import { useEffect, useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Users, ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", fee: "50", startDate: "", description: "" });

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [enrollMode, setEnrollMode] = useState<"member" | "new">("member");
  const [enrollMemberId, setEnrollMemberId] = useState("");
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "" });
  const [ccEmails, setCcEmails] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadData() {
    const [cRes, mRes] = await Promise.all([fetch("/api/courses"), fetch("/api/members")]);
    setCourses(await cRes.json());
    setMembers(await mRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        fee: parseFloat(form.fee),
        startDate: form.startDate || new Date().toISOString(),
        description: form.description || undefined,
      }),
    });
    setShowAddForm(false);
    setForm({ name: "", fee: "50", startDate: "", description: "" });
    loadData();
  }

  async function handleEnroll() {
    if (!selectedCourse) return;
    if (enrollMode === "member" && !enrollMemberId) return;
    if (enrollMode === "new" && !newStudent.name.trim()) return;

    setEnrolling(true);
    setEnrollMsg("");
    const payload: any = {
      action: "enroll",
      enrollType: enrollMode,
      expectedAmount: Number(selectedCourse.fee),
      cc: ccEmails,
    };
    if (enrollMode === "member") {
      payload.memberId = enrollMemberId;
    } else {
      payload.studentName = newStudent.name;
      payload.studentEmail = newStudent.email;
      payload.studentPhone = newStudent.phone;
    }

    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollMsg(data.email?.message || "Student enrolled.");
        setEnrollMemberId("");
        setNewStudent({ name: "", email: "", phone: "" });
        setCcEmails("");
        const refreshed = await fetch(`/api/courses/${selectedCourse.id}`);
        setSelectedCourse(await refreshed.json());
        loadData();
      } else {
        setEnrollMsg(`Fehler: ${data.error}`);
      }
    } catch (err: any) {
      setEnrollMsg(`Fehler: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  }

  async function viewCourseDetail(id: string) {
    const res = await fetch(`/api/courses/${id}`);
    setSelectedCourse(await res.json());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Madrasha Courses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage educational courses, student enrollments, and course fee collection</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
          <Plus className="mr-2 h-4 w-4" /> Create New Course
        </Button>
      </div>

      {showAddForm && (
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Create Madrasha Course</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleCreateCourse} className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Course Title</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course Fee (€)</Label>
                <Input type="number" step="0.01" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-2 pt-1">
                <Button type="submit" className="w-full sm:w-auto">Save Course</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span className="truncate">{course.name}</span>
                </CardTitle>
                <Badge variant={course.isActive ? "success" : "secondary"} className="shrink-0 text-[10px]">
                  {course.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">{course.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Fee:</span>
                <span className="font-semibold">{formatCurrency(Number(course.fee))}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Enrolled Students:</span>
                <span className="font-semibold">{course._count?.enrollments || 0} students</span>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => viewCourseDetail(course.id)}>
                <Users className="mr-1.5 h-3.5 w-3.5" /> Enrollments &amp; Fees
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 z-50">
          <Card className="w-full max-w-2xl shadow-xl border max-h-[92vh] flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2 shrink-0 border-b">
              <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                <span className="truncate">{selectedCourse.name} — Students</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedCourse(null)}>✕</Button>
              </CardTitle>
              <CardDescription className="text-xs">Course Fee: {formatCurrency(Number(selectedCourse.fee))}</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 space-y-4 overflow-y-auto">
              <div className="rounded-lg border p-3 sm:p-4 space-y-3 bg-muted/30">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs h-8"
                    variant={enrollMode === "member" ? "default" : "outline"}
                    onClick={() => setEnrollMode("member")}
                  >
                    Existing Member
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs h-8"
                    variant={enrollMode === "new" ? "default" : "outline"}
                    onClick={() => setEnrollMode("new")}
                  >
                    New Student (Non-Member)
                  </Button>
                </div>

                {enrollMode === "member" ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Select Member</Label>
                    <Select value={enrollMemberId} onValueChange={setEnrollMemberId}>
                      <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Student Name *</Label>
                      <Input
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        placeholder="Full name"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        placeholder="student@example.com"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        placeholder="Optional"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">CC (optional, comma-separated)</Label>
                  <Input
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="parent@example.com, office@igbs.de"
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    A confirmation email with Student ID &amp; FYRST bank details will be sent.
                  </p>
                  <Button
                    onClick={handleEnroll}
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    disabled={enrolling || (enrollMode === "member" ? !enrollMemberId : !newStudent.name.trim())}
                  >
                    {enrolling ? "Enrolling..." : "Enroll & Notify"}
                  </Button>
                </div>

                {enrollMsg && (
                  <div className="text-xs p-2.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {enrollMsg}
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCourse.enrollments?.map((en: any) => {
                    const payments = en.payments ?? [];
                    const isOpen = expandedId === en.id;
                    return (
                      <Fragment key={en.id}>
                        <TableRow key={en.id}>
                          <TableCell className="align-top">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isOpen ? null : en.id)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Toggle payment history"
                            >
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{en.studentCode ?? "—"}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {en.member?.fullName ?? en.studentName ?? "—"}
                              <Badge variant={en.member ? "secondary" : "outline"}>
                                {en.member ? "Member" : "Student"}
                              </Badge>
                            </div>
                            {(en.member?.email || en.studentEmail) && (
                              <span className="text-xs text-muted-foreground">{en.member?.email ?? en.studentEmail}</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(en.expectedAmount))}</TableCell>
                          <TableCell>{formatCurrency(Number(en.paidAmount))}</TableCell>
                          <TableCell>
                            <Badge variant={en.status === "PAID" ? "success" : en.status === "PARTIAL" ? "warning" : "secondary"}>
                              {en.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={`${en.id}-history`} className="bg-muted/30">
                            <TableCell></TableCell>
                            <TableCell colSpan={5} className="py-3">
                              <div className="text-xs font-semibold flex items-center gap-1 mb-2">
                                <Receipt className="h-3 w-3" /> Payment history
                              </div>
                              {payments.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                  No payments recorded yet. Match a bank transaction to this student under Transactions.
                                </p>
                              ) : (
                                <div className="space-y-1">
                                  {payments.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between text-xs border-b border-border/50 pb-1">
                                      <span>{formatDate(p.paidAt)}</span>
                                      <span className="text-muted-foreground">{p.method}</span>
                                      <span className="text-muted-foreground truncate max-w-[200px]">
                                        {p.bankTransaction?.reference ?? p.note ?? "—"}
                                      </span>
                                      <span className="font-semibold">{formatCurrency(Number(p.amount))}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                  {(!selectedCourse.enrollments || selectedCourse.enrollments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        No students enrolled yet.
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

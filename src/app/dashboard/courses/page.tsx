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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Madrasha Courses</h1>
          <p className="text-muted-foreground">Manage educational courses, student enrollments, and course fee collection</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Course
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle>Create Madrasha Course</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCourse} className="grid gap-4 md:grid-cols-2">
              <div><Label>Course Title</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Course Fee (€)</Label><Input type="number" step="0.01" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} required /></div>
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="md:col-span-2"><Button type="submit">Save Course</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> {course.name}
                </CardTitle>
                <Badge variant={course.isActive ? "success" : "secondary"}>
                  {course.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{course.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Fee:</span>
                <span className="font-semibold">{formatCurrency(Number(course.fee))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Enrolled Students:</span>
                <span className="font-semibold">{course._count?.enrollments || 0} students</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => viewCourseDetail(course.id)}>
                <Users className="mr-2 h-4 w-4" /> Enrollments & Fees
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl shadow-xl border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedCourse.name} — Student List</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)}>✕</Button>
              </CardTitle>
              <CardDescription>Course Fee: {formatCurrency(Number(selectedCourse.fee))}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={enrollMode === "member" ? "default" : "outline"}
                    onClick={() => setEnrollMode("member")}
                  >
                    Existing Member
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={enrollMode === "new" ? "default" : "outline"}
                    onClick={() => setEnrollMode("new")}
                  >
                    New Student (Non-Member)
                  </Button>
                </div>

                {enrollMode === "member" ? (
                  <div className="space-y-1">
                    <Label>Select Member</Label>
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
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Student Name *</Label>
                      <Input
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        placeholder="student@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label>CC (optional, comma-separated)</Label>
                  <Input
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="parent@example.com, office@igbs.de"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    A confirmation email including IGBS bank payment details will be sent to the student.
                  </p>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling || (enrollMode === "member" ? !enrollMemberId : !newStudent.name.trim())}
                  >
                    {enrolling ? "Enrolling..." : "Enroll & Notify"}
                  </Button>
                </div>

                {enrollMsg && (
                  <div className="text-sm p-2 rounded-md bg-primary/10 text-primary border border-primary/20">
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

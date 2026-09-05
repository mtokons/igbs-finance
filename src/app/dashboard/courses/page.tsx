"use client";

import { useEffect, useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap,
  Plus,
  Users,
  Edit,
  Trash2,
  ClipboardCheck,
  Award,
  Calendar,
  Clock,
  UserCheck,
  UserPlus,
  BookOpen,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function CoursesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrTreasurer = role === "ADMIN" || role === "TREASURER";

  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    semester: "Semester 1",
    fee: "50",
    teacherId: "none",
    schedule: "",
    room: "",
    startDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([fetch("/api/courses"), fetch("/api/teachers")]);
      setCourses(await cRes.json());
      setTeachers(await tRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      code: form.code || undefined,
      semester: form.semester,
      fee: parseFloat(form.fee),
      teacherId: form.teacherId === "none" ? undefined : form.teacherId,
      schedule: form.schedule || undefined,
      room: form.room || undefined,
      startDate: form.startDate,
      description: form.description || undefined,
    };

    if (editingCourse) {
      await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditingCourse(null);
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShowAddForm(false);
    }

    setForm({
      name: "",
      code: "",
      semester: "Semester 1",
      fee: "50",
      teacherId: "none",
      schedule: "",
      room: "",
      startDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    loadData();
  }

  async function handleDeleteCourse(course: any) {
    if (!confirm(`Are you sure you want to delete course "${course.name}"? This will delete all enrollments, attendances, and evaluations.`)) {
      return;
    }
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    if (selectedCourse?.id === course.id) setSelectedCourse(null);
    loadData();
  }

  function startEditing(course: any) {
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code || "",
      semester: course.semester || "Semester 1",
      fee: String(course.fee),
      teacherId: course.teacherId || "none",
      schedule: course.schedule || "",
      room: course.room || "",
      startDate: course.startDate ? new Date(course.startDate).toISOString().split("T")[0] : "",
      description: course.description || "",
    });
    setShowAddForm(true);
  }

  async function viewCourseDetail(id: string) {
    const res = await fetch(`/api/courses/${id}`);
    setSelectedCourse(await res.json());
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Madrasha Courses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage course curriculum, semester schedules, assigned teachers, and fee structures
          </p>
        </div>
        {isAdminOrTreasurer && (
          <Button
            onClick={() => {
              setEditingCourse(null);
              setForm({
                name: "",
                code: "",
                semester: "Semester 1",
                fee: "50",
                teacherId: "none",
                schedule: "",
                room: "",
                startDate: new Date().toISOString().split("T")[0],
                description: "",
              });
              setShowAddForm(!showAddForm);
            }}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm shadow"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Course
          </Button>
        )}
      </div>

      {/* Course Create/Edit Form */}
      {showAddForm && (
        <Card className="shadow-md border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base sm:text-lg">
                {editingCourse ? `Edit Course: ${editingCourse.name}` : "Create Madrasha Course"}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowAddForm(false)}>
                ✕
              </Button>
            </div>
            <CardDescription className="text-xs">
              Configure course details, semester fee per student, schedule and assigned teacher
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSaveCourse} className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Course Title *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Quran Beginners &amp; Tajweed"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Course Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. QUR-101"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Semester *</Label>
                <Input
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  placeholder="e.g. Semester 1 (2026)"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Semester Fee (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: e.target.value })}
                  placeholder="50.00"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Assigned Teacher</Label>
                <Select
                  value={form.teacherId}
                  onValueChange={(val) => setForm({ ...form, teacherId: val })}
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue placeholder="Select Teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Teacher Assigned</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Schedule / Class Timing</Label>
                <Input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="e.g. Sat &amp; Sun 10:00 - 12:00"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Room / Location</Label>
                <Input
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="e.g. Main Hall / Room 1"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs">Description / Curriculum Notes</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Fundamentals of Quranic recitation, Noorani Qaida, and Islamic studies"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  {editingCourse ? "Update Course" : "Save Course"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Courses Cards Grid */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="text-[10px] font-mono mb-1">
                    {course.code || course.semester || "Course"}
                  </Badge>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                    {course.name}
                  </CardTitle>
                </div>
                {isAdminOrTreasurer && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Edit Course"
                      onClick={() => startEditing(course)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete Course"
                      onClick={() => handleDeleteCourse(course)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                {course.description || "No description provided"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              <div className="p-2.5 bg-muted/40 rounded-lg space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Teacher:
                  </span>
                  <span className="font-semibold text-foreground">
                    {course.teacher?.name || <span className="text-muted-foreground font-normal">Unassigned</span>}
                  </span>
                </div>

                {course.schedule && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Schedule:
                    </span>
                    <span className="text-foreground text-[11px] truncate max-w-[140px]">{course.schedule}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="text-muted-foreground">Semester Fee:</span>
                  <span className="font-bold text-primary">{formatCurrency(Number(course.fee))}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {course._count?.enrollments || 0} Students
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="h-3.5 w-3.5" /> {course._count?.attendances || 0} Attendance logs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => viewCourseDetail(course.id)}>
                  <Users className="mr-1 h-3.5 w-3.5" /> Students
                </Button>
                <Button variant="default" size="sm" className="text-xs h-8" asChild>
                  <Link href={`/dashboard/madrasha/attendance?courseId=${course.id}`}>
                    <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Roll Call
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {courses.length === 0 && !loading && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground">
            No courses found. Click &quot;Create Course&quot; to add one.
          </div>
        )}
      </div>

      {/* COURSE DETAIL & ENROLLED STUDENTS MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 z-50">
          <Card className="w-full max-w-4xl shadow-2xl border max-h-[92vh] flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-3 shrink-0 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <Badge variant="outline" className="mb-1 text-xs">
                    {selectedCourse.code || selectedCourse.semester}
                  </Badge>
                  <CardTitle className="text-lg sm:text-xl font-bold">{selectedCourse.name}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedCourse(null)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span>Teacher: <strong className="text-foreground">{selectedCourse.teacher?.name || "Unassigned"}</strong></span>
                <span>Fee: <strong className="text-foreground">{formatCurrency(Number(selectedCourse.fee))}</strong></span>
                {selectedCourse.schedule && <span>Schedule: <strong className="text-foreground">{selectedCourse.schedule}</strong></span>}
                {selectedCourse.room && <span>Room: <strong className="text-foreground">{selectedCourse.room}</strong></span>}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Enrolled Students ({selectedCourse.enrollments?.length || 0})
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                    <Link href={`/dashboard/madrasha/attendance?courseId=${selectedCourse.id}`}>
                      <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Roll Call
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                    <Link href={`/dashboard/madrasha/evaluations?courseId=${selectedCourse.id}`}>
                      <Award className="mr-1 h-3.5 w-3.5" /> Evaluations
                    </Link>
                  </Button>
                  {isAdminOrTreasurer && (
                    <Button size="sm" className="text-xs h-8" asChild>
                      <Link href="/dashboard/madrasha/students">
                        <UserPlus className="mr-1 h-3.5 w-3.5" /> Manage Students
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Fee Plan</TableHead>
                      <TableHead>Installment 1</TableHead>
                      <TableHead>Installment 2</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourse.enrollments?.map((en: any) => {
                      const name = en.member?.fullName || en.studentName || "—";
                      const is2Inst = en.paymentPlan === "INSTALLMENTS_2";
                      return (
                        <TableRow key={en.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                              {en.rollNumber || en.studentCode || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {name}
                            {en.member && <Badge variant="secondary" className="ml-1.5 text-[9px]">Member</Badge>}
                          </TableCell>
                          <TableCell className="text-xs">
                            {is2Inst ? "2 Installments" : "Full"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant={en.installment1Status === "PAID" ? "success" : "secondary"} className="text-[10px]">
                              {en.installment1Status === "PAID" ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {is2Inst ? (
                              <Badge variant={en.installment2Status === "PAID" ? "success" : "secondary"} className="text-[10px]">
                                {en.installment2Status === "PAID" ? "Paid" : "Pending"}
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs font-bold">
                            {formatCurrency(Number(en.paidAmount))} / {formatCurrency(Number(en.expectedAmount))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={en.status === "PAID" ? "success" : en.status === "PARTIAL" ? "secondary" : "destructive"} className="text-xs">
                              {en.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!selectedCourse.enrollments || selectedCourse.enrollments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                          No students enrolled in this course yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

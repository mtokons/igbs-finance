"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Award,
  BookOpen,
  Edit,
  Save,
  CheckCircle2,
  FileText,
  UserCheck,
  Star,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function EvaluationsPage() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId");
  const { data: session } = useSession();
  const user = session?.user;

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || "");
  const [selectedSemester, setSelectedSemester] = useState<string>("Semester 1");
  const [students, setStudents] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / Form state for evaluating a student
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: "",
    quranRecitation: "85",
    tajweed: "80",
    memorization: "85",
    islamicStudies: "90",
    behavior: "95",
    attendanceScore: "90",
    remarks: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(initialCourseId && data.some((c: any) => c.id === initialCourseId) ? initialCourseId : data[0].id);
        if (data[0].semester) setSelectedSemester(data[0].semester);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEvaluationsData(courseId: string, semester: string) {
    if (!courseId) return;
    setLoading(true);
    setMsg(null);
    try {
      const [sRes, eRes] = await Promise.all([
        fetch(`/api/students?courseId=${courseId}`),
        fetch(`/api/madrasha/evaluations?courseId=${courseId}&semester=${encodeURIComponent(semester)}`),
      ]);
      setStudents(await sRes.json());
      setEvaluations(await eRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadEvaluationsData(selectedCourseId, selectedSemester);
    }
  }, [selectedCourseId, selectedSemester]);

  function openEvaluationForm(student: any) {
    setSelectedStudent(student);
    const existing = evaluations.find((e) => e.enrollmentId === student.id);
    if (existing) {
      setForm({
        id: existing.id || "",
        quranRecitation: String(existing.quranRecitation ?? 85),
        tajweed: String(existing.tajweed ?? 80),
        memorization: String(existing.memorization ?? 85),
        islamicStudies: String(existing.islamicStudies ?? 90),
        behavior: String(existing.behavior ?? 95),
        attendanceScore: String(existing.attendanceScore ?? 90),
        remarks: existing.remarks || "",
      });
    } else {
      setForm({
        id: "",
        quranRecitation: "85",
        tajweed: "80",
        memorization: "85",
        islamicStudies: "90",
        behavior: "95",
        attendanceScore: "90",
        remarks: "",
      });
    }
    setEvalModalOpen(true);
  }

  async function handleSaveEvaluation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedCourseId) return;
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/madrasha/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          courseId: selectedCourseId,
          enrollmentId: selectedStudent.id,
          semester: selectedSemester,
          quranRecitation: parseFloat(form.quranRecitation),
          tajweed: parseFloat(form.tajweed),
          memorization: parseFloat(form.memorization),
          islamicStudies: parseFloat(form.islamicStudies),
          behavior: parseFloat(form.behavior),
          attendanceScore: parseFloat(form.attendanceScore),
          remarks: form.remarks || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Failed to save evaluation." });
      } else {
        setMsg({ type: "success", text: "Evaluation saved successfully!" });
        setEvalModalOpen(false);
        loadEvaluationsData(selectedCourseId, selectedSemester);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" />
            Performance Evaluations &amp; Grades
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Record and review student progress in Quran, Tajweed, Hifz, Islamic Studies, and Adab
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-lg border text-sm font-semibold ${
            msg.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Filter Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Select Course *</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="text-xs sm:text-sm h-10">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.teacher ? `(Teacher: ${c.teacher.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Semester *</Label>
            <Input
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              placeholder="e.g. Semester 1"
              className="text-xs sm:text-sm h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Student Performance Cards</CardTitle>
          <CardDescription className="text-xs">
            Course: {selectedCourse?.name} • Semester: {selectedSemester}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Quran &amp; Tajweed</TableHead>
                <TableHead className="text-center">Hifz / Memorization</TableHead>
                <TableHead className="text-center">Islamic Studies</TableHead>
                <TableHead className="text-center">Behavior / Adab</TableHead>
                <TableHead className="text-center">Total Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const sName = s.member?.fullName || s.studentName || "—";
                const evalData = evaluations.find((e) => e.enrollmentId === s.id);

                return (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                        {s.rollNumber || s.studentCode || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs sm:text-sm text-foreground">{sName}</div>
                      <span className="text-[10px] text-muted-foreground">
                        {s.studentType === "MEMBER" ? "Member" : "Student"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {evalData ? `${evalData.quranRecitation ?? "—"}% / ${evalData.tajweed ?? "—"}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {evalData ? `${evalData.memorization ?? "—"}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {evalData ? `${evalData.islamicStudies ?? "—"}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {evalData ? `${evalData.behavior ?? "—"}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-primary">
                      {evalData?.totalScore ? `${evalData.totalScore}%` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {evalData?.grade ? (
                        <Badge
                          variant={
                            evalData.grade.startsWith("A")
                              ? "success"
                              : evalData.grade.startsWith("B")
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[11px]"
                        >
                          {evalData.grade}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Not Evaluated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openEvaluationForm(s)}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        {evalData ? "Edit Grades" : "Evaluate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                    {loading ? "Loading students..." : "No students enrolled in this course."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EVALUATION MODAL */}
      {evalModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-xl shadow-2xl border max-h-[92vh] flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2 shrink-0 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Student Evaluation &amp; Grade Card
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEvalModalOpen(false)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">
                Student: <span className="font-semibold text-foreground">{selectedStudent.member?.fullName || selectedStudent.studentName}</span> (Roll: {selectedStudent.rollNumber})
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <form onSubmit={handleSaveEvaluation} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Quran Recitation Score (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.quranRecitation}
                      onChange={(e) => setForm({ ...form, quranRecitation: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tajweed Rules Score (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tajweed}
                      onChange={(e) => setForm({ ...form, tajweed: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Memorization / Hifz Score (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.memorization}
                      onChange={(e) => setForm({ ...form, memorization: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Islamic Studies &amp; Duas (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.islamicStudies}
                      onChange={(e) => setForm({ ...form, islamicStudies: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Behavior, Discipline &amp; Adab (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.behavior}
                      onChange={(e) => setForm({ ...form, behavior: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Attendance &amp; Punctuality (0-100) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.attendanceScore}
                      onChange={(e) => setForm({ ...form, attendanceScore: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Teacher Remarks &amp; Feedback</Label>
                  <Input
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    placeholder="e.g. Excellent progress in Makharij and Surah memorization."
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEvalModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Evaluation"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

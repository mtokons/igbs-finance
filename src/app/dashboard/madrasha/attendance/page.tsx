"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Users,
  ShieldCheck,
  History,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface AttendanceRecord {
  enrollmentId: string;
  studentName: string;
  rollNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes: string;
}

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId");
  const { data: session } = useSession();
  const user = session?.user;
  const isStudent = user?.role === "STUDENT";
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN" || user?.role === "TREASURER";

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || "");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; notes: string }>>({});
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [studentAttendances, setStudentAttendances] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"rollcall" | "history">("rollcall");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(initialCourseId && data.some((c: any) => c.id === initialCourseId) ? initialCourseId : data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadStudentAttendance(courseId?: string) {
    setLoading(true);
    try {
      const url = courseId ? `/api/madrasha/attendance?courseId=${courseId}` : `/api/madrasha/attendance`;
      const res = await fetch(url);
      if (res.ok) {
        setStudentAttendances(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudentsAndAttendance(courseId: string, date: string) {
    if (!courseId) return;
    if (isStudent) {
      loadStudentAttendance(courseId);
      return;
    }

    setLoading(true);
    setSaveMessage(null);

    try {
      // 1. Fetch students enrolled in course
      const sRes = await fetch(`/api/students?courseId=${courseId}`);
      const sData = await sRes.json();
      setStudents(sData);

      // 2. Fetch existing attendance for this course and date
      const aRes = await fetch(`/api/madrasha/attendance?courseId=${courseId}&date=${date}`);
      const aData = await aRes.json();

      // 3. Populate state
      const initialMap: Record<string, { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; notes: string }> = {};
      sData.forEach((s: any) => {
        const existing = aData.find((a: any) => a.enrollmentId === s.id);
        initialMap[s.id] = {
          status: existing ? existing.status : "PRESENT",
          notes: existing?.notes || "",
        };
      });
      setAttendanceRecords(initialMap);

      // 4. Fetch history for this course
      const hRes = await fetch(`/api/madrasha/attendance?courseId=${courseId}`);
      setHistoryRecords(await hRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    if (isStudent) {
      loadStudentAttendance();
    }
  }, [isStudent]);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudentsAndAttendance(selectedCourseId, selectedDate);
    }
  }, [selectedCourseId, selectedDate]);

  function handleStatusChange(enrollmentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") {
    setAttendanceRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
      },
    }));
  }

  function handleNotesChange(enrollmentId: string, notes: string) {
    setAttendanceRecords((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        notes,
      },
    }));
  }

  function markAll(status: "PRESENT" | "ABSENT") {
    setAttendanceRecords((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s.id] = {
          ...(updated[s.id] || { notes: "" }),
          status,
        };
      });
      return updated;
    });
  }

  async function handleSaveRollCall() {
    if (!selectedCourseId) return;
    setSaving(true);
    setSaveMessage(null);

    const records = students.map((s) => ({
      enrollmentId: s.id,
      status: attendanceRecords[s.id]?.status || "PRESENT",
      notes: attendanceRecords[s.id]?.notes || "",
    }));

    try {
      const res = await fetch("/api/madrasha/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          date: selectedDate,
          records,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMessage({ type: "error", text: data.error || "Failed to save attendance." });
      } else {
        setSaveMessage({
          type: "success",
          text: `Attendance saved successfully for ${records.length} students on ${selectedDate}!`,
        });
        loadStudentsAndAttendance(selectedCourseId, selectedDate);
      }
    } catch (e: any) {
      setSaveMessage({ type: "error", text: e.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Student specific stats
  const studentTotal = studentAttendances.length;
  const studentPresent = studentAttendances.filter((a) => a.status === "PRESENT").length;
  const studentLate = studentAttendances.filter((a) => a.status === "LATE").length;
  const studentAbsent = studentAttendances.filter((a) => a.status === "ABSENT").length;
  const studentExcused = studentAttendances.filter((a) => a.status === "EXCUSED").length;
  const studentRate = studentTotal > 0 ? Math.round(((studentPresent + studentLate * 0.5) / studentTotal) * 100) : 100;

  // Calculate quick stats for teacher/admin roll call
  const total = students.length;
  const presentCount = Object.values(attendanceRecords).filter((r) => r.status === "PRESENT").length;
  const absentCount = Object.values(attendanceRecords).filter((r) => r.status === "ABSENT").length;
  const lateCount = Object.values(attendanceRecords).filter((r) => r.status === "LATE").length;
  const excusedCount = Object.values(attendanceRecords).filter((r) => r.status === "EXCUSED").length;

  // Student Private View
  if (isStudent) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              My Attendance Record
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your personal class presence, punctuality, and teacher notes for your enrolled courses
            </p>
          </div>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
              <h3 className="text-xl font-bold mt-1 text-primary">{studentRate}%</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Present</p>
              <h3 className="text-xl font-bold mt-1 text-green-600">{studentPresent}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Late</p>
              <h3 className="text-xl font-bold mt-1 text-amber-600">{studentLate}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Absent</p>
              <h3 className="text-xl font-bold mt-1 text-red-600">{studentAbsent}</h3>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Classes</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">{studentTotal}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Filter by course if multiple */}
        {courses.length > 1 && (
          <div className="max-w-xs">
            <Label className="text-xs font-semibold mb-1 block">Filter Course</Label>
            <Select value={selectedCourseId} onValueChange={(val) => { setSelectedCourseId(val); loadStudentAttendance(val); }}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All My Courses" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Student Attendance List */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Class Presence History</CardTitle>
            <CardDescription className="text-xs">Only your own attendance records are displayed</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teacher Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentAttendances.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-semibold text-xs">{formatDate(att.date)}</TableCell>
                    <TableCell className="text-xs font-medium">{att.course?.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{att.teacher?.name || att.course?.teacher?.name || "Teacher"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          att.status === "PRESENT"
                            ? "success"
                            : att.status === "LATE"
                            ? "warning"
                            : att.status === "EXCUSED"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[11px]"
                      >
                        {att.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{att.notes || "—"}</TableCell>
                  </TableRow>
                ))}
                {studentAttendances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      {loading ? "Loading attendance records..." : "No attendance recorded for your courses yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Class Attendance &amp; Roll Call
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Daily roll call for Madrasha classes. Visible only to assigned teachers and administrators.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3 rounded-lg border text-sm font-semibold ${
            saveMessage.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Course & Date Selector Card */}
      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6 grid gap-4 sm:grid-cols-3 items-end">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs font-semibold">Select Course / Class *</Label>
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="text-xs sm:text-sm h-10">
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.semester || "Semester 1"}) {c.teacher ? `— Teacher: ${c.teacher.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Class Date *</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          size="sm"
          variant={activeTab === "rollcall" ? "default" : "outline"}
          className="text-xs h-8"
          onClick={() => setActiveTab("rollcall")}
        >
          <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Roll Call Matrix
        </Button>
        <Button
          size="sm"
          variant={activeTab === "history" ? "default" : "outline"}
          className="text-xs h-8"
          onClick={() => setActiveTab("history")}
        >
          <History className="mr-1.5 h-3.5 w-3.5" /> Attendance History ({historyRecords.length})
        </Button>
      </div>

      {activeTab === "rollcall" ? (
        <div className="space-y-4">
          {/* Quick Stat Badges & Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="font-semibold">
                Total: {total} Students
              </Badge>
              <Badge variant="success" className="bg-green-600/10 text-green-700 border-green-500/20 font-semibold">
                Present: {presentCount}
              </Badge>
              <Badge variant="destructive" className="bg-red-600/10 text-red-700 border-red-500/20 font-semibold">
                Absent: {absentCount}
              </Badge>
              <Badge variant="warning" className="bg-amber-600/10 text-amber-700 border-amber-500/20 font-semibold">
                Late: {lateCount}
              </Badge>
              <Badge variant="secondary" className="font-semibold">
                Excused: {excusedCount}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 text-green-700 hover:text-green-800"
                onClick={() => markAll("PRESENT")}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark All Present
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 text-destructive hover:text-destructive"
                onClick={() => markAll("ABSENT")}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" /> Mark All Absent
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs h-8 shadow"
                onClick={handleSaveRollCall}
                disabled={saving || students.length === 0}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Roll Call"}
              </Button>
            </div>
          </div>

          {/* Roll Call Table */}
          <Card className="shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Attendance Status</TableHead>
                    <TableHead>Teacher Notes / Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => {
                    const studentName = s.member?.fullName || s.studentName || "—";
                    const currentStatus = attendanceRecords[s.id]?.status || "PRESENT";
                    const currentNotes = attendanceRecords[s.id]?.notes || "";

                    return (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                            {s.rollNumber || s.studentCode || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs sm:text-sm text-foreground">{studentName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {s.studentType === "MEMBER" ? "IGBS Member" : "Student Only"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === "PRESENT" ? "default" : "outline"}
                              className={`h-7 px-2.5 text-xs font-semibold ${
                                currentStatus === "PRESENT" ? "bg-green-600 hover:bg-green-700 text-white" : ""
                              }`}
                              onClick={() => handleStatusChange(s.id, "PRESENT")}
                            >
                              Present
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === "ABSENT" ? "default" : "outline"}
                              className={`h-7 px-2.5 text-xs font-semibold ${
                                currentStatus === "ABSENT" ? "bg-red-600 hover:bg-red-700 text-white" : ""
                              }`}
                              onClick={() => handleStatusChange(s.id, "ABSENT")}
                            >
                              Absent
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === "LATE" ? "default" : "outline"}
                              className={`h-7 px-2.5 text-xs font-semibold ${
                                currentStatus === "LATE" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                              }`}
                              onClick={() => handleStatusChange(s.id, "LATE")}
                            >
                              Late
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={currentStatus === "EXCUSED" ? "default" : "outline"}
                              className={`h-7 px-2.5 text-xs font-semibold ${
                                currentStatus === "EXCUSED" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                              }`}
                              onClick={() => handleStatusChange(s.id, "EXCUSED")}
                            >
                              Excused
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Optional note..."
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(s.id, e.target.value)}
                            className="h-8 text-xs max-w-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                        {loading ? "Loading class students..." : "No students enrolled in this course yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {students.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveRollCall} disabled={saving} className="shadow">
                <Save className="mr-1.5 h-4 w-4" /> {saving ? "Saving Roll Call..." : "Save Roll Call"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Attendance History List */
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Class Attendance Logs</CardTitle>
            <CardDescription className="text-xs">
              Complete historical roll call entries for {selectedCourse?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teacher / Recorded By</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRecords.map((h) => {
                  const sName = h.enrollment?.member?.fullName || h.enrollment?.studentName || "—";
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-semibold text-xs">{formatDate(h.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {h.enrollment?.rollNumber || h.enrollment?.studentCode || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">{sName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            h.status === "PRESENT"
                              ? "success"
                              : h.status === "LATE"
                              ? "warning"
                              : h.status === "EXCUSED"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[11px]"
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.teacher?.name || "Teacher"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.notes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {historyRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No attendance history recorded yet for this course.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

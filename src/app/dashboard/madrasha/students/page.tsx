"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  KeyRound,
  Trash2,
  Edit,
  DollarSign,
  Send,
  Eye,
  BookOpen,
  Receipt,
  GraduationCap,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface StudentEnrollment {
  id: string;
  courseId: string;
  memberId: string | null;
  userId: string | null;
  rollNumber: string | null;
  studentCode: string | null;
  studentType: string;
  studentName: string | null;
  studentEmail: string | null;
  studentPhone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  semester: string | null;
  expectedAmount: number;
  paidAmount: number;
  paymentPlan: string;
  installment1Amount: number | null;
  installment1Status: string | null;
  installment1PaidAt: string | null;
  installment2Amount: number | null;
  installment2Status: string | null;
  installment2PaidAt: string | null;
  status: string;
  notes: string | null;
  enrolledAt: string;
  course: {
    id: string;
    name: string;
    semester: string | null;
    teacher: { name: string } | null;
  };
  member: {
    fullName: string;
    email: string | null;
    memberCode: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    username: string | null;
    role: string;
  } | null;
  payments: any[];
  _count: {
    attendances: number;
    evaluations: number;
  };
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdminOrTreasurer = role === "ADMIN" || role === "TREASURER";

  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [enrollType, setEnrollType] = useState<"new" | "member">("new");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [semester, setSemester] = useState("Semester 1");
  const [paymentPlan, setPaymentPlan] = useState<"FULL" | "INSTALLMENTS_2">("FULL");
  const [expectedAmount, setExpectedAmount] = useState("50");
  const [installment1Amount, setInstallment1Amount] = useState("25");
  const [installment2Amount, setInstallment2Amount] = useState("25");
  const [customRollNumber, setCustomRollNumber] = useState("");
  const [tempPassword, setTempPassword] = useState("IGBS2026!");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; text: string; creds?: any } | null>(null);

  // Edit / Pay Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payTarget, setPayTarget] = useState<"1" | "2" | "full">("full");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [newTempPassword, setNewTempPassword] = useState("IGBS2026!");

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, cRes, mRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/courses"),
        fetch("/api/members"),
      ]);
      setStudents(await sRes.json());
      const coursesData = await cRes.json();
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(coursesData[0].id);
        setExpectedAmount(String(coursesData[0].fee || 50));
        setInstallment1Amount(String(Number(coursesData[0].fee || 50) / 2));
        setInstallment2Amount(String(Number(coursesData[0].fee || 50) / 2));
      }
      setMembers(await mRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId);
    const c = courses.find((x) => x.id === courseId);
    if (c) {
      const fee = Number(c.fee || 50);
      setExpectedAmount(String(fee));
      setInstallment1Amount(String(fee / 2));
      setInstallment2Amount(String(fee / 2));
      if (c.semester) setSemester(c.semester);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          enrollType,
          memberId: enrollType === "member" ? selectedMemberId : undefined,
          studentName: enrollType === "new" ? studentName : undefined,
          studentEmail: enrollType === "new" ? studentEmail : undefined,
          studentPhone,
          guardianName,
          guardianPhone,
          semester,
          paymentPlan,
          expectedAmount: parseFloat(expectedAmount),
          installment1Amount: paymentPlan === "INSTALLMENTS_2" ? parseFloat(installment1Amount) : undefined,
          installment2Amount: paymentPlan === "INSTALLMENTS_2" ? parseFloat(installment2Amount) : undefined,
          customRollNumber: customRollNumber.trim() || undefined,
          tempPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResultMessage({ type: "error", text: data.error || "Failed to add student." });
      } else {
        setResultMessage({
          type: "success",
          text: `Student added successfully! Roll Number: ${data.enrollment.rollNumber}`,
          creds: data.credentials,
        });
        setShowAddModal(false);
        // Reset form
        setStudentName("");
        setStudentEmail("");
        setStudentPhone("");
        setGuardianName("");
        setGuardianPhone("");
        setCustomRollNumber("");
        loadData();
      }
    } catch (err: any) {
      setResultMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recordPayment",
          amount: parseFloat(payAmount),
          installment: payTarget,
          method: payMethod,
          note: payNote,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setPayAmount("");
        setPayNote("");
        setSelectedStudent(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(studentId: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          tempPassword: newTempPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Password reset to ${newTempPassword}`);
        setShowCredsModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent(student: StudentEnrollment) {
    const name = student.member?.fullName || student.studentName || "this student";
    if (!confirm(`Are you sure you want to remove student "${name}" (Roll: ${student.rollNumber})? This will delete their enrollment, attendance, and evaluation records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filteredStudents = students.filter((s) => {
    const sName = s.member?.fullName || s.studentName || "";
    const sRoll = s.rollNumber || "";
    const sCode = s.studentCode || "";
    const sEmail = s.studentEmail || s.member?.email || "";
    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      sRoll.toLowerCase().includes(search.toLowerCase()) ||
      sCode.toLowerCase().includes(search.toLowerCase()) ||
      sEmail.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = selectedCourseFilter === "ALL" || s.courseId === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Madrasha Students &amp; Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage student roll numbers, member/non-member enrollments, installment fees, and logins
          </p>
        </div>
        {isAdminOrTreasurer && (
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm shadow">
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        )}
      </div>

      {resultMessage && (
        <div
          className={`p-3 sm:p-4 rounded-lg border text-sm flex flex-col gap-1 ${
            resultMessage.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="font-semibold">{resultMessage.text}</div>
          {resultMessage.creds && (
            <div className="text-xs bg-background/80 p-2.5 rounded border mt-1">
              <span className="font-medium">Student Login Credentials:</span> Username/Roll:{" "}
              <code className="font-bold text-primary">{resultMessage.creds.username}</code> | Temp Password:{" "}
              <code className="font-bold text-primary">{resultMessage.creds.tempPassword}</code>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The student can log in at <Link href="/login" className="underline font-medium">/login</Link> and change their password.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name, roll number, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs sm:text-sm h-9"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
            <SelectTrigger className="h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Courses ({students.length})</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Students</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">{students.length}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fully Paid</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-green-600">
              {students.filter((s) => s.status === "PAID").length}
            </h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">2-Installment Plan</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-blue-600">
              {students.filter((s) => s.paymentPlan === "INSTALLMENTS_2").length}
            </h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending / Partial Fee</p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-600">
              {students.filter((s) => s.status !== "PAID").length}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Student Directory</CardTitle>
          <CardDescription className="text-xs">
            Viewing {filteredStudents.length} student registrations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Course &amp; Semester</TableHead>
                <TableHead>Fee &amp; Plan</TableHead>
                <TableHead>Installment 1</TableHead>
                <TableHead>Installment 2</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Status</TableHead>
                {isAdminOrTreasurer && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s) => {
                const displayName = s.member?.fullName || s.studentName || "—";
                const isMember = s.studentType === "MEMBER" || !!s.memberId;
                const is2Inst = s.paymentPlan === "INSTALLMENTS_2";

                return (
                  <TableRow key={s.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                        {s.rollNumber || s.studentCode || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{displayName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isMember ? (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              IGBS Member
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-muted-foreground">
                              Student Only
                            </Badge>
                          )}
                          {s.user && (
                            <span className="text-[10px] text-muted-foreground">
                              (Login: {s.user.username || s.user.email})
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{s.course?.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {s.semester || s.course?.semester || "Semester 1"}
                          {s.course?.teacher ? ` • Teacher: ${s.course.teacher.name}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold">{formatCurrency(Number(s.expectedAmount))}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {is2Inst ? "2 Installments" : "Full at once"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span>{formatCurrency(Number(s.installment1Amount || s.expectedAmount / (is2Inst ? 2 : 1)))}</span>
                        <Badge
                          variant={s.installment1Status === "PAID" ? "success" : "secondary"}
                          className="text-[10px] px-1 py-0 h-4 w-fit mt-0.5"
                        >
                          {s.installment1Status === "PAID" ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {is2Inst ? (
                        <div className="flex flex-col text-xs">
                          <span>{formatCurrency(Number(s.installment2Amount || s.expectedAmount / 2))}</span>
                          <Badge
                            variant={s.installment2Status === "PAID" ? "success" : "secondary"}
                            className="text-[10px] px-1 py-0 h-4 w-fit mt-0.5"
                          >
                            {s.installment2Status === "PAID" ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold">{formatCurrency(Number(s.paidAmount))}</span>
                        <span className="text-[10px] text-muted-foreground">
                          of {formatCurrency(Number(s.expectedAmount))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.status === "PAID" ? "success" : s.status === "PARTIAL" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    {isAdminOrTreasurer && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-green-700 hover:text-green-800"
                            title="Record Payment / Installment"
                            onClick={() => {
                              setSelectedStudent(s);
                              setPayAmount(
                                String(
                                  is2Inst
                                    ? s.installment1Status !== "PAID"
                                      ? s.installment1Amount || s.expectedAmount / 2
                                      : s.installment2Amount || s.expectedAmount / 2
                                    : s.expectedAmount - s.paidAmount
                                )
                              );
                              setPayTarget(
                                is2Inst ? (s.installment1Status !== "PAID" ? "1" : "2") : "full"
                              );
                              setShowPayModal(true);
                            }}
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-0.5" /> Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2"
                            title="Reset Password / Login info"
                            onClick={() => {
                              setSelectedStudent(s);
                              setNewTempPassword("IGBS2026!");
                              setShowCredsModal(true);
                            }}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            title="Delete Student Enrollment"
                            onClick={() => handleDeleteStudent(s)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                    {loading ? "Loading student list..." : "No students found matching your criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-xl shadow-2xl border max-h-[92vh] flex flex-col">
            <CardHeader className="p-4 sm:p-6 pb-2 shrink-0 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> Add Madrasha Student
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowAddModal(false)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">
                Register a new student or existing IGBS member, assign roll number, fee installments, and generate login
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <form onSubmit={handleAddStudent} className="space-y-4">
                {/* Member vs Student Only toggle */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <Button
                    type="button"
                    size="sm"
                    variant={enrollType === "new" ? "default" : "ghost"}
                    className="flex-1 text-xs h-8"
                    onClick={() => setEnrollType("new")}
                  >
                    New Student (Student-Only)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={enrollType === "member" ? "default" : "ghost"}
                    className="flex-1 text-xs h-8"
                    onClick={() => setEnrollType("member")}
                  >
                    Existing IGBS Member
                  </Button>
                </div>

                {/* Course Selection */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Course *</Label>
                    <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} (€{c.fee})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Semester *</Label>
                    <Input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g. Semester 1"
                      className="text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Student Info */}
                {enrollType === "member" ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Select Member *</Label>
                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Choose registered member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.fullName} {m.memberCode ? `(${m.memberCode})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Student Full Name *</Label>
                        <Input
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Student Name"
                          className="text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Student Email (For Login &amp; Notifications)</Label>
                        <Input
                          type="email"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="student@example.com"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Student Phone</Label>
                        <Input
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="+49..."
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Guardian / Parent Name</Label>
                        <Input
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="Father/Mother"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Guardian Phone</Label>
                        <Input
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder="+49..."
                          className="text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Roll Number & Login Credentials Setup */}
                <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" /> Roll Number &amp; Portal Login
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Roll Number (Unique ID)</Label>
                      <Input
                        value={customRollNumber}
                        onChange={(e) => setCustomRollNumber(e.target.value)}
                        placeholder="Leave blank for auto (e.g. RN-2026-001)"
                        className="text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Temporary Password</Label>
                      <Input
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="e.g. IGBS2026!"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The student can log in to the portal using their <strong>Roll Number</strong> (or Email) and this temporary password.
                  </p>
                </div>

                {/* Fee & Installment Plan */}
                <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-primary" /> Fee &amp; Payment Installments
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Payment Plan *</Label>
                      <Select
                        value={paymentPlan}
                        onValueChange={(val: any) => {
                          setPaymentPlan(val);
                          const total = Number(expectedAmount);
                          setInstallment1Amount(String(val === "INSTALLMENTS_2" ? total / 2 : total));
                          setInstallment2Amount(String(val === "INSTALLMENTS_2" ? total / 2 : 0));
                        }}
                      >
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL">1 Full Payment at a time</SelectItem>
                          <SelectItem value="INSTALLMENTS_2">2 Installments (50% / 50%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total Semester Fee (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={expectedAmount}
                        onChange={(e) => {
                          setExpectedAmount(e.target.value);
                          const val = Number(e.target.value);
                          if (paymentPlan === "INSTALLMENTS_2") {
                            setInstallment1Amount(String(val / 2));
                            setInstallment2Amount(String(val / 2));
                          }
                        }}
                        className="text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  {paymentPlan === "INSTALLMENTS_2" && (
                    <div className="grid gap-3 sm:grid-cols-2 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Installment 1 Amount (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={installment1Amount}
                          onChange={(e) => setInstallment1Amount(e.target.value)}
                          className="text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Installment 2 Amount (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={installment2Amount}
                          onChange={(e) => setInstallment2Amount(e.target.value)}
                          className="text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Saving..." : "Save & Register Student"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPayModal && selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl border">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" /> Record Fee Payment
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowPayModal(false)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">
                Student: <span className="font-semibold text-foreground">{selectedStudent.member?.fullName || selectedStudent.studentName}</span> (Roll: {selectedStudent.rollNumber})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Target *</Label>
                  <Select value={payTarget} onValueChange={(val: any) => setPayTarget(val)}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedStudent.paymentPlan === "INSTALLMENTS_2" ? (
                        <>
                          <SelectItem value="1">Installment 1 (€{selectedStudent.installment1Amount})</SelectItem>
                          <SelectItem value="2">Installment 2 (€{selectedStudent.installment2Amount})</SelectItem>
                          <SelectItem value="full">Total Balance (€{selectedStudent.expectedAmount - selectedStudent.paidAmount})</SelectItem>
                        </>
                      ) : (
                        <SelectItem value="full">Full Course Fee (€{selectedStudent.expectedAmount - selectedStudent.paidAmount})</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Payment Method *</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                        <SelectItem value="MANUAL">Manual / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Note / Receipt Number</Label>
                  <Input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="e.g. Paid in cash to teacher / receipt #101"
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowPayModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? "Saving..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CREDENTIALS / RESET PASSWORD MODAL */}
      {showCredsModal && selectedStudent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <Card className="w-full max-w-md shadow-2xl border">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" /> Student Login Credentials
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCredsModal(false)}>
                  ✕
                </Button>
              </div>
              <CardDescription className="text-xs">
                Student: {selectedStudent.member?.fullName || selectedStudent.studentName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Login ID (Roll No / Student ID): </span>
                  <span className="font-bold font-mono text-primary text-sm">
                    {selectedStudent.rollNumber || selectedStudent.studentCode}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium text-foreground">
                    {selectedStudent.studentEmail || selectedStudent.member?.email || "None registered"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Set New Temporary Password</Label>
                <Input
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="e.g. IGBS2026!"
                  className="text-xs sm:text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  The student will be prompted or able to change this password after logging in.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCredsModal(false)}>
                  Close
                </Button>
                <Button size="sm" onClick={() => handleResetPassword(selectedStudent.id)} disabled={submitting}>
                  {submitting ? "Updating..." : "Reset Temp Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

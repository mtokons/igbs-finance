"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  GraduationCap,
  School,
  Receipt,
  ClipboardCheck,
  Award,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function StudentPortalPage() {
  const { data: session } = useSession();
  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  async function loadStudentData() {
    setLoading(true);
    try {
      const res = await fetch("/api/student-portal");
      const data = await res.json();
      setPortalData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentData();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session?.user?.email,
          username: session?.user?.username,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordMsg({ type: "error", text: data.error || "Failed to update password." });
      } else {
        setPasswordMsg({ type: "success", text: "Password changed successfully!" });
        setNewPassword("");
        setConfirmPassword("");
        setCurrentPassword("");
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSavingPassword(false);
    }
  }

  const enrollments = portalData?.enrollments || [];
  const primaryEnrollment = enrollments[0];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
            Student Portal
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome, {session?.user?.name || "Student"}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Islamische Gemeinschaft für Bildung und Soziales e.V. (IGBS Madrasha)
          </p>
        </div>

        {primaryEnrollment && (
          <div className="flex flex-wrap gap-2">
            <div className="bg-card px-3.5 py-2 rounded-lg border text-xs shadow-sm">
              <span className="text-muted-foreground block text-[10px]">ROLL NUMBER</span>
              <span className="font-mono font-bold text-sm text-primary">
                {primaryEnrollment.rollNumber || primaryEnrollment.studentCode || "—"}
              </span>
            </div>
            <div className="bg-card px-3.5 py-2 rounded-lg border text-xs shadow-sm">
              <span className="text-muted-foreground block text-[10px]">SEMESTER</span>
              <span className="font-bold text-sm text-foreground">
                {primaryEnrollment.semester || primaryEnrollment.course?.semester || "Semester 1"}
              </span>
            </div>
          </div>
        )}
      </div>

      {session?.user?.mustChangePassword && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>You are currently using a temporary password. Please change it below to secure your account.</span>
        </div>
      )}

      {/* Enrolled Courses & Fee Installments */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <School className="h-5 w-5 text-primary" /> Enrolled Courses &amp; Fee Status
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((en: any) => {
            const is2Inst = en.paymentPlan === "INSTALLMENTS_2";
            const remaining = Math.max(0, en.expectedAmount - en.paidAmount);

            return (
              <Card key={en.id} className="shadow-sm border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-mono mb-1">
                        {en.rollNumber || en.studentCode}
                      </Badge>
                      <CardTitle className="text-base font-bold">{en.course?.name}</CardTitle>
                    </div>
                    <Badge
                      variant={en.status === "PAID" ? "success" : en.status === "PARTIAL" ? "secondary" : "destructive"}
                    >
                      {en.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Teacher: {en.course?.teacher?.name || "Assigned Teacher"} • {en.semester}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Semester Fee:</span>
                      <span className="font-bold text-foreground">{formatCurrency(Number(en.expectedAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Paid Amount:</span>
                      <span className="font-bold text-green-600">{formatCurrency(Number(en.paidAmount))}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-muted-foreground">Balance Due:</span>
                      <span className="font-bold text-destructive">{formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {/* Installment breakdown */}
                  {is2Inst ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="border p-2.5 rounded-lg bg-card">
                        <span className="text-[10px] text-muted-foreground block">Installment 1</span>
                        <span className="font-semibold text-sm block">
                          {formatCurrency(Number(en.installment1Amount || en.expectedAmount / 2))}
                        </span>
                        <Badge
                          variant={en.installment1Status === "PAID" ? "success" : "secondary"}
                          className="mt-1 text-[10px]"
                        >
                          {en.installment1Status === "PAID" ? "Paid" : "Pending"}
                        </Badge>
                      </div>

                      <div className="border p-2.5 rounded-lg bg-card">
                        <span className="text-[10px] text-muted-foreground block">Installment 2</span>
                        <span className="font-semibold text-sm block">
                          {formatCurrency(Number(en.installment2Amount || en.expectedAmount / 2))}
                        </span>
                        <Badge
                          variant={en.installment2Status === "PAID" ? "success" : "secondary"}
                          className="mt-1 text-[10px]"
                        >
                          {en.installment2Status === "PAID" ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded border">
                      Payment Plan: 1 Full Payment at a time
                    </div>
                  )}

                  {/* Bank Details Hint for payment */}
                  <div className="text-[11px] text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">
                    <span className="font-semibold text-foreground">Payment Reference (Verwendungszweck): </span>
                    <code className="font-mono font-bold text-primary">{en.rollNumber || en.studentCode} {en.course?.name}</code>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {enrollments.length === 0 && !loading && (
            <div className="sm:col-span-2 text-center py-8 text-muted-foreground text-sm">
              No active course enrollments found for this student account.
            </div>
          )}
        </div>
      </div>

      {/* Attendance & Evaluations Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Summary */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" /> My Attendance Record
            </CardTitle>
            <CardDescription className="text-xs">Class presence &amp; roll call history</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {primaryEnrollment?.attendances?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {primaryEnrollment.attendances.map((att: any) => (
                  <div key={att.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/40 border">
                    <div>
                      <span className="font-semibold">{formatDate(att.date)}</span>
                      {att.notes && <span className="text-muted-foreground text-[11px] block">{att.notes}</span>}
                    </div>
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
                      className="text-[10px]"
                    >
                      {att.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">No attendance recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Evaluation Card */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Academic Evaluation &amp; Grades
            </CardTitle>
            <CardDescription className="text-xs">Progress report and feedback from your teacher</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {primaryEnrollment?.evaluations?.length > 0 ? (
              <div className="space-y-3">
                {primaryEnrollment.evaluations.map((ev: any) => (
                  <div key={ev.id} className="p-3 bg-muted/40 rounded-lg border space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b pb-1.5">
                      <span className="font-bold text-foreground">{ev.semester}</span>
                      <Badge variant="success" className="font-bold">
                        {ev.grade || "Passed"} ({ev.totalScore}%)
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>Quran Recitation: <strong className="text-foreground">{ev.quranRecitation}%</strong></div>
                      <div>Tajweed Rules: <strong className="text-foreground">{ev.tajweed}%</strong></div>
                      <div>Memorization / Hifz: <strong className="text-foreground">{ev.memorization}%</strong></div>
                      <div>Islamic Studies: <strong className="text-foreground">{ev.islamicStudies}%</strong></div>
                      <div>Behavior / Adab: <strong className="text-foreground">{ev.behavior}%</strong></div>
                      <div>Attendance: <strong className="text-foreground">{ev.attendanceScore}%</strong></div>
                    </div>

                    {ev.remarks && (
                      <div className="pt-1 text-[11px] text-muted-foreground italic border-t">
                        &quot;{ev.remarks}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">No evaluations published yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Password Card */}
      <Card className="shadow-sm border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Change Password
          </CardTitle>
          <CardDescription className="text-xs">
            Update your temporary password to a new personal password
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {passwordMsg && (
            <div
              className={`p-3 rounded-lg border text-xs mb-4 ${
                passwordMsg.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid gap-3 sm:grid-cols-3 max-w-2xl">
            <div className="space-y-1">
              <Label className="text-xs">New Password *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirm New Password *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" size="sm" className="w-full text-xs h-9" disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

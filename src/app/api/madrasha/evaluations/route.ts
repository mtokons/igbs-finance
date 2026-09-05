import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { isAdmin, isTeacher } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  const user = session.user;
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  const enrollmentId = searchParams.get("enrollmentId");
  const semester = searchParams.get("semester");

  const isUserAdmin = isAdmin(user.role) || user.role === "TREASURER";
  const isUserTeacher = isTeacher(user.role);

  // If student is querying their own evaluations
  if (user.role === "STUDENT") {
    const studentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { studentEnrollments: true },
    });
    const enrollmentIds = studentUser?.studentEnrollments.map((e) => e.id) || [];
    const evaluations = await prisma.studentEvaluation.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: true,
        teacher: true,
        enrollment: true,
      },
      orderBy: { evaluationDate: "desc" },
    });
    return NextResponse.json(evaluations);
  }

  // Teacher or Admin access only
  if (!isUserAdmin && !isUserTeacher) {
    return NextResponse.json({ error: "Kein Zugriff auf Bewertungsdaten." }, { status: 403 });
  }

  let teacherId: string | null = null;
  if (!isUserAdmin && isUserTeacher) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: user.email, mode: "insensitive" } },
        ],
      },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Lehrerprofil nicht verknüpft." }, { status: 403 });
    }
    teacherId = teacher.id;
  }

  const whereClause: any = {};
  if (courseId) {
    whereClause.courseId = courseId;
  }
  if (enrollmentId) {
    whereClause.enrollmentId = enrollmentId;
  }
  if (semester) {
    whereClause.semester = semester;
  }
  if (teacherId) {
    whereClause.course = { teacherId };
  }

  const evaluations = await prisma.studentEvaluation.findMany({
    where: whereClause,
    include: {
      course: true,
      enrollment: {
        include: { member: true },
      },
      teacher: true,
    },
    orderBy: [{ evaluationDate: "desc" }, { totalScore: "desc" }],
  });

  return NextResponse.json(evaluations);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const user = session.user;
  const isUserAdmin = isAdmin(user.role) || user.role === "TREASURER";
  const isUserTeacher = isTeacher(user.role);

  if (!isUserAdmin && !isUserTeacher) {
    return NextResponse.json({ error: "Nur Lehrer und Administratoren können Bewertungen erfassen." }, { status: 403 });
  }

  const body = await req.json();
  const {
    id: evaluationId,
    courseId,
    enrollmentId,
    semester,
    quranRecitation,
    tajweed,
    memorization,
    islamicStudies,
    behavior,
    attendanceScore,
    remarks,
  } = body;

  if (!courseId || !enrollmentId) {
    return NextResponse.json({ error: "Kurs und Student sind erforderlich." }, { status: 400 });
  }

  let teacherId: string | null = null;
  if (!isUserAdmin) {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: user.email, mode: "insensitive" } },
        ],
      },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Lehrerprofil nicht gefunden." }, { status: 403 });
    }
    teacherId = teacher.id;
  }

  // Calculate scores
  const scores = [
    quranRecitation !== undefined ? Number(quranRecitation) : null,
    tajweed !== undefined ? Number(tajweed) : null,
    memorization !== undefined ? Number(memorization) : null,
    islamicStudies !== undefined ? Number(islamicStudies) : null,
    behavior !== undefined ? Number(behavior) : null,
    attendanceScore !== undefined ? Number(attendanceScore) : null,
  ].filter((s): s is number => s !== null && !isNaN(s));

  const totalScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

  let grade = "Pending";
  if (totalScore !== null) {
    if (totalScore >= 90) grade = "A+ (Excellent)";
    else if (totalScore >= 80) grade = "A (Very Good)";
    else if (totalScore >= 70) grade = "B (Good)";
    else if (totalScore >= 60) grade = "C (Satisfactory)";
    else if (totalScore >= 50) grade = "D (Pass)";
    else grade = "F (Needs Improvement)";
  }

  let evaluation;
  if (evaluationId) {
    evaluation = await prisma.studentEvaluation.update({
      where: { id: evaluationId },
      data: {
        semester: semester || "Semester 1",
        quranRecitation: quranRecitation !== undefined ? Number(quranRecitation) : null,
        tajweed: tajweed !== undefined ? Number(tajweed) : null,
        memorization: memorization !== undefined ? Number(memorization) : null,
        islamicStudies: islamicStudies !== undefined ? Number(islamicStudies) : null,
        behavior: behavior !== undefined ? Number(behavior) : null,
        attendanceScore: attendanceScore !== undefined ? Number(attendanceScore) : null,
        totalScore,
        grade,
        remarks: remarks || null,
        teacherId: teacherId || undefined,
      },
      include: { enrollment: true, course: true },
    });
  } else {
    // Check if an evaluation already exists for this enrollment and semester
    const existing = await prisma.studentEvaluation.findFirst({
      where: {
        enrollmentId,
        semester: semester || "Semester 1",
      },
    });

    if (existing) {
      evaluation = await prisma.studentEvaluation.update({
        where: { id: existing.id },
        data: {
          quranRecitation: quranRecitation !== undefined ? Number(quranRecitation) : null,
          tajweed: tajweed !== undefined ? Number(tajweed) : null,
          memorization: memorization !== undefined ? Number(memorization) : null,
          islamicStudies: islamicStudies !== undefined ? Number(islamicStudies) : null,
          behavior: behavior !== undefined ? Number(behavior) : null,
          attendanceScore: attendanceScore !== undefined ? Number(attendanceScore) : null,
          totalScore,
          grade,
          remarks: remarks || null,
          teacherId: teacherId || existing.teacherId,
        },
        include: { enrollment: true, course: true },
      });
    } else {
      evaluation = await prisma.studentEvaluation.create({
        data: {
          courseId,
          enrollmentId,
          teacherId: teacherId || null,
          semester: semester || "Semester 1",
          quranRecitation: quranRecitation !== undefined ? Number(quranRecitation) : null,
          tajweed: tajweed !== undefined ? Number(tajweed) : null,
          memorization: memorization !== undefined ? Number(memorization) : null,
          islamicStudies: islamicStudies !== undefined ? Number(islamicStudies) : null,
          behavior: behavior !== undefined ? Number(behavior) : null,
          attendanceScore: attendanceScore !== undefined ? Number(attendanceScore) : null,
          totalScore,
          grade,
          remarks: remarks || null,
        },
        include: { enrollment: true, course: true },
      });
    }
  }

  await logAudit(
    user.id,
    "RECORD_EVALUATION",
    "StudentEvaluation",
    evaluation.id,
    `Evaluated student for ${semester || "Semester 1"}: Grade ${grade} (${totalScore}%)`
  );

  return NextResponse.json(evaluation, { status: 201 });
}

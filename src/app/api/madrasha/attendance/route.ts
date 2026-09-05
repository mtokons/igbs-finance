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
  const dateStr = searchParams.get("date");
  const enrollmentId = searchParams.get("enrollmentId");

  const isUserAdmin = isAdmin(user.role) || user.role === "TREASURER";
  const isUserTeacher = isTeacher(user.role);

  // If student is querying their own attendance
  if (user.role === "STUDENT") {
    const studentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { studentEnrollments: true },
    });
    const enrollmentIds = studentUser?.studentEnrollments.map((e) => e.id) || [];
    const attendances = await prisma.attendance.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: true,
        teacher: true,
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(attendances);
  }

  // Teacher or Admin access only
  if (!isUserAdmin && !isUserTeacher) {
    return NextResponse.json({ error: "Kein Zugriff auf Anwesenheitsdaten." }, { status: 403 });
  }

  // If teacher, find teacher record
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
  if (dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const endD = new Date(d);
    endD.setHours(23, 59, 59, 999);
    whereClause.date = { gte: d, lte: endD };
  }

  // If restricted to teacher's courses
  if (teacherId) {
    whereClause.course = { teacherId };
  }

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      course: true,
      enrollment: {
        include: { member: true },
      },
      teacher: true,
    },
    orderBy: [{ date: "desc" }, { enrollment: { rollNumber: "asc" } }],
  });

  return NextResponse.json(attendances);
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const user = session.user;
  const isUserAdmin = isAdmin(user.role) || user.role === "TREASURER";
  const isUserTeacher = isTeacher(user.role);

  if (!isUserAdmin && !isUserTeacher) {
    return NextResponse.json({ error: "Nur Lehrer und Administratoren können Anwesenheit erfassen." }, { status: 403 });
  }

  const body = await req.json();
  const { courseId, date, records } = body;

  if (!courseId || !date || !Array.isArray(records)) {
    return NextResponse.json({ error: "Kurs, Datum und Schülerliste sind erforderlich." }, { status: 400 });
  }

  // Teacher check
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
    // Check if course belongs to teacher
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (course?.teacherId && course.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Sie können nur für Ihre eigenen Kurse die Anwesenheit erfassen." }, { status: 403 });
    }
    teacherId = teacher.id;
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(12, 0, 0, 0); // normalized time for date match

  const results = [];
  for (const record of records) {
    const { enrollmentId, status, notes } = record;
    if (!enrollmentId) continue;

    // find existing attendance for courseId, enrollmentId, and same day
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        courseId,
        enrollmentId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status || "PRESENT",
          notes: notes || null,
          teacherId: teacherId || existing.teacherId,
        },
      });
      results.push(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          courseId,
          enrollmentId,
          teacherId: teacherId || null,
          date: attendanceDate,
          status: status || "PRESENT",
          notes: notes || null,
        },
      });
      results.push(created);
    }
  }

  await logAudit(
    user.id,
    "RECORD_ATTENDANCE",
    "Course",
    courseId,
    `Roll call for ${records.length} students on ${date}`
  );

  return NextResponse.json({ success: true, count: results.length, records: results });
}

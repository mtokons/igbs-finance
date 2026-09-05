import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Membership Dues", type: "INCOME" },
  { name: "Course Fee", type: "INCOME" },
  { name: "Donations / Zakat / Sadaqah", type: "INCOME" },
  { name: "Other Income", type: "INCOME" },
  { name: "Teacher Honorarium / Salary", type: "EXPENSE" },
  { name: "Events", type: "EXPENSE" },
  { name: "Rent & Utilities", type: "EXPENSE" },
  { name: "Office & Software", type: "EXPENSE" },
  { name: "Other Expenses", type: "EXPENSE" },
];

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const treasurerPassword = await bcrypt.hash("treasurer123", 12);
  const userPass = await bcrypt.hash("Password123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@igbs.local" },
    update: { passwordHash: adminPassword },
    create: {
      email: "admin@igbs.local",
      name: "IGBS Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "treasurer@igbs.local" },
    update: { passwordHash: treasurerPassword },
    create: {
      email: "treasurer@igbs.local",
      name: "IGBS Treasurer",
      passwordHash: treasurerPassword,
      role: "TREASURER",
    },
  });

  await prisma.user.upsert({
    where: { email: "treasurer@igbs-hamburg.de" },
    update: { passwordHash: userPass },
    create: {
      email: "treasurer@igbs-hamburg.de",
      name: "IGBS Lead Treasurer",
      passwordHash: userPass,
      role: "ADMIN",
    },
  });

  const asifPassword = await bcrypt.hash("Asif@IGBS2026!", 12);
  const haiderPassword = await bcrypt.hash("Haider@IGBS2026!", 12);

  await prisma.user.upsert({
    where: { email: "habrontheraizo@gmail.com" },
    update: { passwordHash: asifPassword, role: "ADMIN", username: "asif", name: "Asif Hossain" },
    create: {
      email: "habrontheraizo@gmail.com",
      username: "asif",
      name: "Asif Hossain",
      passwordHash: asifPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "haider74hamburg@hotmail.com" },
    update: { passwordHash: haiderPassword, role: "ADMIN", username: "haider", name: "Julfiqur Haider" },
    create: {
      email: "haider74hamburg@hotmail.com",
      username: "haider",
      name: "Julfiqur Haider",
      passwordHash: haiderPassword,
      role: "ADMIN",
    },
  });

  const teacherPassword = await bcrypt.hash("teacher123", 12);
  const studentPassword = await bcrypt.hash("IGBS2026!", 12);

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@igbs.local" },
    update: { passwordHash: teacherPassword },
    create: {
      email: "teacher@igbs.local",
      name: "Sheikh Abdullah",
      passwordHash: teacherPassword,
      role: "TEACHER",
      mustChangePassword: false,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student1@igbs.local" },
    update: { passwordHash: studentPassword, username: "RN-2026-001" },
    create: {
      email: "student1@igbs.local",
      name: "Ibrahim Ahmed",
      username: "RN-2026-001",
      passwordHash: studentPassword,
      role: "STUDENT",
      mustChangePassword: true,
    },
  });

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isSystem: true },
    });
  }

  const sampleMembers: { fullName: string; email: string; monthlyFee: number; memberCode: string }[] = [];

  for (const member of sampleMembers) {
    await prisma.member.upsert({
      where: { memberCode: member.memberCode },
      update: {},
      create: member,
    });
  }

  const teacher = await prisma.teacher.upsert({
    where: { id: "seed-teacher-1" },
    update: { userId: teacherUser.id },
    create: {
      id: "seed-teacher-1",
      userId: teacherUser.id,
      name: "Sheikh Abdullah",
      email: "teacher@igbs.local",
      defaultSalary: 500,
      paymentHint: "Madrasha Honorarium",
    },
  });

  const course = await prisma.course.upsert({
    where: { id: "seed-course-1" },
    update: {
      teacherId: teacher.id,
      semester: "Semester 1 (2026)",
      schedule: "Sat & Sun 10:00 - 12:00",
      room: "Room 1 / Main Hall",
    },
    create: {
      id: "seed-course-1",
      name: "Quran Beginners & Tajweed",
      code: "QUR-101",
      semester: "Semester 1 (2026)",
      fee: 60,
      teacherId: teacher.id,
      schedule: "Sat & Sun 10:00 - 12:00",
      room: "Room 1 / Main Hall",
      startDate: new Date(),
      description: "Fundamentals of Quranic recitation, Noorani Qaida, and Islamic studies",
    },
  });

  // Seed sample student enrollment
  const enrollment = await prisma.courseEnrollment.upsert({
    where: { id: "seed-enrollment-1" },
    update: {},
    create: {
      id: "seed-enrollment-1",
      courseId: course.id,
      userId: studentUser.id,
      rollNumber: "RN-2026-001",
      studentCode: "STU-0001",
      studentType: "STUDENT_ONLY",
      studentName: "Ibrahim Ahmed",
      studentEmail: "student1@igbs.local",
      studentPhone: "+49 176 12345678",
      guardianName: "Ahmed Ali",
      guardianPhone: "+49 176 98765432",
      semester: "Semester 1 (2026)",
      expectedAmount: 60,
      paidAmount: 30,
      paymentPlan: "INSTALLMENTS_2",
      installment1Amount: 30,
      installment1Status: "PAID",
      installment1PaidAt: new Date(),
      installment2Amount: 30,
      installment2Status: "PENDING",
      status: "PARTIAL",
    },
  });

  // Seed sample attendance
  await prisma.attendance.upsert({
    where: {
      courseId_enrollmentId_date: {
        courseId: course.id,
        enrollmentId: enrollment.id,
        date: new Date(new Date().setHours(12, 0, 0, 0)),
      },
    },
    update: {},
    create: {
      courseId: course.id,
      enrollmentId: enrollment.id,
      teacherId: teacher.id,
      date: new Date(new Date().setHours(12, 0, 0, 0)),
      status: "PRESENT",
      notes: "On time, great participation",
    },
  });

  // Seed sample evaluation
  const existingEval = await prisma.studentEvaluation.findFirst({
    where: { enrollmentId: enrollment.id, semester: "Semester 1 (2026)" },
  });
  if (!existingEval) {
    await prisma.studentEvaluation.create({
      data: {
        courseId: course.id,
        enrollmentId: enrollment.id,
        teacherId: teacher.id,
        semester: "Semester 1 (2026)",
        quranRecitation: 88,
        tajweed: 84,
        memorization: 90,
        islamicStudies: 92,
        behavior: 95,
        attendanceScore: 94,
        totalScore: 90.5,
        grade: "A+ (Excellent)",
        remarks: "MashaAllah, outstanding memorization and good adherence to Tajweed rules.",
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

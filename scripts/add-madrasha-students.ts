import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const studentNames = [
  "Rafi",
  "Azad Faruk",
  "Hasan Rashedul Bhai",
  "Mahmudur Rahman",
  "Minhaj Bhai",
  "Munna",
  "Rafrad Bhuiyan TUHH",
  "Saimon Vai",
  "Sayem Bhai",
  "Zaheen Bhai HAM",
  "Kaiym Ahmed ভাই",
];

async function nextRollNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `RN-${currentYear}-`;
  const count = await prisma.courseEnrollment.count({ where: { rollNumber: { startsWith: prefix } } });
  let seq = count + 1;
  for (let i = 0; i < 200; i++) {
    const candidate = `${prefix}${String(seq).padStart(3, "0")}`;
    const existsEnrollment = await prisma.courseEnrollment.findUnique({ where: { rollNumber: candidate } });
    const existsUser = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existsEnrollment && !existsUser) return candidate;
    seq++;
  }
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

async function nextStudentCode(): Promise<string> {
  const count = await prisma.courseEnrollment.count();
  let seq = count + 1;
  for (let i = 0; i < 200; i++) {
    const candidate = `STU-${String(seq).padStart(4, "0")}`;
    const exists = await prisma.courseEnrollment.findUnique({ where: { studentCode: candidate } });
    if (!exists) return candidate;
    seq++;
  }
  return `STU-${Date.now().toString().slice(-4)}`;
}

async function main() {
  const course = await prisma.course.upsert({
    where: { id: "madrasha-new-batch-2026" },
    update: {},
    create: {
      id: "madrasha-new-batch-2026",
      name: "Madrasha New Batch (2026)",
      code: "MAD-NB-2026",
      semester: "Semester 1 (2026)",
      fee: 10,
      startDate: new Date(),
      description: "Newly enrolled Madrasha students batch",
    },
  });

  console.log(`Course ready: ${course.name} (${course.id})`);

  for (const name of studentNames) {
    const rollNumber = await nextRollNumber();
    const studentCode = await nextStudentCode();
    const email = `${studentCode.toLowerCase()}@student.igbs.local`;
    const passwordHash = await bcrypt.hash("IGBS2026!", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username: rollNumber,
        passwordHash,
        role: "STUDENT",
        mustChangePassword: true,
      },
    });

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: course.id,
        userId: user.id,
        rollNumber,
        studentCode,
        studentType: "STUDENT_ONLY",
        studentName: name,
        semester: course.semester,
        expectedAmount: course.fee,
        paidAmount: 0,
        paymentPlan: "FULL",
        installment1Amount: course.fee,
        installment1Status: "PENDING",
        status: "PENDING",
      },
    });

    console.log(`Enrolled: ${name} -> Roll ${rollNumber} / ${studentCode}`);
  }

  console.log("All students added successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

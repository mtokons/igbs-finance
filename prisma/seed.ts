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

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { ...cat, isSystem: true },
    });
  }

  const sampleMembers = [
    { fullName: "Ahmed Rahman", email: "ahmed@example.com", monthlyFee: 25, memberCode: "M001" },
    { fullName: "Fatima Begum", email: "fatima@example.com", monthlyFee: 25, memberCode: "M002" },
    { fullName: "Karim Hassan", email: "karim@example.com", monthlyFee: 30, memberCode: "M003" },
    { fullName: "Nadia Islam", email: "nadia@example.com", monthlyFee: 25, memberCode: "M004" },
    { fullName: "Yusuf Ali", email: "yusuf@example.com", monthlyFee: 25, memberCode: "M005" },
  ];

  for (const member of sampleMembers) {
    await prisma.member.upsert({
      where: { memberCode: member.memberCode },
      update: {},
      create: member,
    });
  }

  const teacher = await prisma.teacher.upsert({
    where: { id: "seed-teacher-1" },
    update: {},
    create: {
      id: "seed-teacher-1",
      name: "Sheikh Abdullah",
      defaultSalary: 500,
      paymentHint: "Madrasha Honorarium",
    },
  });

  const course = await prisma.course.upsert({
    where: { id: "seed-course-1" },
    update: {},
    create: {
      id: "seed-course-1",
      name: "Quran Beginners Course",
      fee: 50,
      startDate: new Date(),
      description: "Fundamentals of Quranic recitation and Arabic letters",
    },
  });

  // Ensure every enrollment has a unique student ID (STU-0001 ...).
  const missingCodes = await prisma.courseEnrollment.findMany({
    where: { studentCode: null },
    orderBy: { enrolledAt: "asc" },
  });
  let seq = await prisma.courseEnrollment.count({ where: { studentCode: { not: null } } });
  for (const en of missingCodes) {
    seq++;
    await prisma.courseEnrollment.update({
      where: { id: en.id },
      data: { studentCode: `STU-${String(seq).padStart(4, "0")}` },
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

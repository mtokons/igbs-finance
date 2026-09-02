import { prisma } from "@/lib/db";
import { decimalToNumber, getMonthName } from "@/lib/utils";

export interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  byCategory: { name: string; type: string; total: number }[];
}

export interface YearlySummary {
  year: number;
  months: MonthlySummary[];
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const transactions = await prisma.bankTransaction.findMany({
    where: {
      bookingDate: { gte: start, lte: end },
      categoryId: { not: null },
    },
    include: { category: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = new Map<string, { name: string; type: string; total: number }>();

  for (const tx of transactions) {
    const amount = decimalToNumber(tx.amount);
    const cat = tx.category!;
    const key = cat.id;

    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name: cat.name, type: cat.type, total: 0 });
    }
    categoryMap.get(key)!.total += amount;

    if (cat.type === "INCOME") totalIncome += amount;
    else totalExpense += Math.abs(amount);
  }

  return {
    year,
    month,
    monthName: getMonthName(month),
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    byCategory: Array.from(categoryMap.values()).sort((a, b) => b.total - a.total),
  };
}

export async function getYearlySummary(year: number): Promise<YearlySummary> {
  const months: MonthlySummary[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (let m = 1; m <= 12; m++) {
    const summary = await getMonthlySummary(year, m);
    months.push(summary);
    totalIncome += summary.totalIncome;
    totalExpense += summary.totalExpense;
  }

  return {
    year,
    months,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
  };
}

export async function getMembershipReport(year: number, month: number) {
  const payments = await prisma.membershipPayment.findMany({
    where: { periodYear: year, periodMonth: month },
    include: { member: true },
    orderBy: { member: { fullName: "asc" } },
  });

  return payments.map((p) => ({
    memberName: p.member.fullName,
    memberCode: p.member.memberCode,
    expected: decimalToNumber(p.expectedAmount),
    paid: decimalToNumber(p.paidAmount),
    status: p.status,
    outstanding: Math.max(0, decimalToNumber(p.expectedAmount) - decimalToNumber(p.paidAmount)),
  }));
}

export async function getCourseReport() {
  const enrollments = await prisma.courseEnrollment.findMany({
    include: { member: true, course: true },
    orderBy: { enrolledAt: "desc" },
  });

  return enrollments.map((e) => ({
    courseName: e.course.name,
    memberName: e.member?.fullName ?? e.studentName ?? "—",
    expected: decimalToNumber(e.expectedAmount),
    paid: decimalToNumber(e.paidAmount),
    status: e.status,
    enrolledAt: e.enrolledAt,
  }));
}

export async function getPayrollReport(year: number, month: number) {
  const payments = await prisma.salaryPayment.findMany({
    where: { periodYear: year, periodMonth: month },
    include: { teacher: true },
    orderBy: { teacher: { name: "asc" } },
  });

  return payments.map((p) => ({
    teacherName: p.teacher.name,
    amount: decimalToNumber(p.amount),
    status: p.status,
    paidAt: p.paidAt,
  }));
}

export async function getEventReport() {
  const events = await prisma.event.findMany({
    include: {
      transactions: {
        include: { bankTransaction: { include: { category: true } } },
      },
    },
    orderBy: { eventDate: "desc" },
  });

  return events.map((event) => {
    let actual = 0;
    for (const et of event.transactions) {
      actual += decimalToNumber(et.bankTransaction.amount);
    }
    return {
      title: event.title,
      eventDate: event.eventDate,
      budget: decimalToNumber(event.budget),
      actual,
      variance: decimalToNumber(event.budget) - actual,
    };
  });
}

export async function getDashboardStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [duesSummary, unmatchedCount, recentTransactions, bankConnection] = await Promise.all([
    prisma.membershipPayment.groupBy({
      by: ["status"],
      where: { periodYear: year, periodMonth: month },
      _count: true,
    }),
    prisma.bankTransaction.count({
      where: { reconciliationStatus: { in: ["UNMATCHED", "SUGGESTED"] } },
    }),
    prisma.bankTransaction.findMany({
      take: 5,
      orderBy: { bookingDate: "desc" },
      include: { category: true },
    }),
    prisma.bankConnection.findFirst({ orderBy: { updatedAt: "desc" } }),
  ]);

  const monthlySummary = await getMonthlySummary(year, month);

  const pendingDues =
    duesSummary.find((d) => d.status === "PENDING")?._count ?? 0;
  const overdueDues =
    duesSummary.find((d) => d.status === "OVERDUE")?._count ?? 0;

  return {
    pendingDues,
    overdueDues,
    unmatchedCount,
    monthlySummary,
    recentTransactions,
    bankConnection,
  };
}

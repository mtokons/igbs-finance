import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/utils";

export async function ensureMembershipPayments(year: number, month: number) {
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
  });

  for (const member of members) {
    await prisma.membershipPayment.upsert({
      where: {
        memberId_periodYear_periodMonth: {
          memberId: member.id,
          periodYear: year,
          periodMonth: month,
        },
      },
      update: {},
      create: {
        memberId: member.id,
        periodYear: year,
        periodMonth: month,
        expectedAmount: member.monthlyFee,
        status: "PENDING",
      },
    });
  }
}

export async function getDuesBoard(year: number, month: number) {
  await ensureMembershipPayments(year, month);

  const payments = await prisma.membershipPayment.findMany({
    where: { periodYear: year, periodMonth: month },
    include: {
      member: true,
      bankTransaction: true,
    },
    orderBy: { member: { fullName: "asc" } },
  });

  const summary = {
    totalExpected: 0,
    totalPaid: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
  };

  for (const p of payments) {
    summary.totalExpected += decimalToNumber(p.expectedAmount);
    summary.totalPaid += decimalToNumber(p.paidAmount);
    if (p.status === "PAID") summary.paidCount++;
    else if (p.status === "OVERDUE") summary.overdueCount++;
    else summary.pendingCount++;
  }

  return { payments, summary };
}

export async function markMembershipPaid(
  memberId: string,
  year: number,
  month: number,
  amount: number,
  bankTransactionId?: string
) {
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } });
  const isFullyPaid = amount >= decimalToNumber(member.monthlyFee);
  const statusStr = isFullyPaid ? "PAID" : "PARTIAL";

  const payment = await prisma.membershipPayment.upsert({
    where: {
      memberId_periodYear_periodMonth: { memberId, periodYear: year, periodMonth: month },
    },
    update: {
      paidAmount: amount,
      status: statusStr,
      paidAt: new Date(),
      bankTransactionId: bankTransactionId ?? undefined,
    },
    create: {
      memberId,
      periodYear: year,
      periodMonth: month,
      expectedAmount: member.monthlyFee,
      paidAmount: amount,
      status: statusStr,
      paidAt: new Date(),
      bankTransactionId,
    },
  });

  return payment;
}

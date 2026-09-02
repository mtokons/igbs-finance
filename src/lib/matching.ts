import { prisma } from "@/lib/db";
import { decimalToNumber } from "@/lib/utils";

export interface MatchSuggestion {
  transactionId: string;
  type: "membership" | "course" | "salary";
  entityId: string;
  entityLabel: string;
  confidence: "high" | "medium" | "low";
  reason: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9äöüß\s]/gi, " ").replace(/\s+/g, " ").trim();
}

function nameMatches(reference: string, name: string): boolean {
  const ref = normalizeText(reference);
  const parts = normalizeText(name).split(" ").filter(Boolean);
  if (parts.length === 0) return false;
  const matchedParts = parts.filter((p) => p.length > 2 && ref.includes(p));
  return matchedParts.length >= Math.min(2, parts.length);
}

export async function suggestMatches(transactionId: string): Promise<MatchSuggestion[]> {
  const tx = await prisma.bankTransaction.findUnique({ where: { id: transactionId } });
  if (!tx) return [];

  const suggestions: MatchSuggestion[] = [];
  const ref = [tx.reference, tx.counterparty].filter(Boolean).join(" ");
  const amount = decimalToNumber(tx.amount);

  if (amount > 0) {
    const members = await prisma.member.findMany({ where: { status: "ACTIVE" } });
    for (const member of members) {
      if (member.memberCode && ref.includes(member.memberCode)) {
        suggestions.push({
          transactionId,
          type: "membership",
          entityId: member.id,
          entityLabel: member.fullName,
          confidence: "high",
          reason: `Member code ${member.memberCode} found in reference`,
        });
      } else if (nameMatches(ref, member.fullName)) {
        suggestions.push({
          transactionId,
          type: "membership",
          entityId: member.id,
          entityLabel: member.fullName,
          confidence: "medium",
          reason: "Member name found in reference",
        });
      }
    }

    if (/kurs|course|madrasha|quran/i.test(ref)) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { status: { in: ["PENDING", "PARTIAL"] } },
        include: { member: true, course: true },
      });
      for (const en of enrollments) {
        const enrolleeName = en.member?.fullName ?? en.studentName;
        if (enrolleeName && nameMatches(ref, enrolleeName)) {
          suggestions.push({
            transactionId,
            type: "course",
            entityId: en.id,
            entityLabel: `${enrolleeName} - ${en.course.name}`,
            confidence: "medium",
            reason: "Course keyword and student name match",
          });
        }
      }
    }
  }

  if (amount < 0) {
    const teachers = await prisma.teacher.findMany({ where: { isActive: true } });
    for (const teacher of teachers) {
      if (nameMatches(ref, teacher.name)) {
        suggestions.push({
          transactionId,
          type: "salary",
          entityId: teacher.id,
          entityLabel: teacher.name,
          confidence: "high",
          reason: "Teacher name found in outgoing payment",
        });
      }
    }
  }

  if (suggestions.length > 0) {
    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: { reconciliationStatus: "SUGGESTED" },
    });
  }

  return suggestions;
}

export async function applyMembershipMatch(
  transactionId: string,
  memberId: string,
  year: number,
  month: number
) {
  const tx = await prisma.bankTransaction.findUniqueOrThrow({ where: { id: transactionId } });
  const amount = decimalToNumber(tx.amount);

  const category = await prisma.category.findFirst({ where: { name: "Membership Dues" } });

  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      categoryId: category?.id,
      reconciliationStatus: "MATCHED",
    },
  });

  const { markMembershipPaid } = await import("@/lib/membership");
  await markMembershipPaid(memberId, year, month, amount, transactionId);
}

export async function applyCourseMatch(transactionId: string, enrollmentId: string) {
  const tx = await prisma.bankTransaction.findUniqueOrThrow({ where: { id: transactionId } });
  const amount = decimalToNumber(tx.amount);
  const category = await prisma.category.findFirst({ where: { name: "Course Fee" } });

  // Record this bank transaction as a course payment (idempotent per transaction).
  const existingPayment = await prisma.coursePayment.findUnique({ where: { bankTransactionId: transactionId } });
  if (!existingPayment) {
    await prisma.coursePayment.create({
      data: {
        enrollmentId,
        amount,
        method: "BANK",
        bankTransactionId: transactionId,
        paidAt: tx.bookingDate,
      },
    });
  }

  const enrollment = await prisma.courseEnrollment.findUniqueOrThrow({ where: { id: enrollmentId } });
  const agg = await prisma.coursePayment.aggregate({
    where: { enrollmentId },
    _sum: { amount: true },
  });
  const paidAmount = agg._sum.amount ?? amount;
  const status = paidAmount >= decimalToNumber(enrollment.expectedAmount) ? "PAID" : "PARTIAL";

  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      paidAmount,
      status,
      paidAt: new Date(),
      bankTransactionId: transactionId,
    },
  });

  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      categoryId: category?.id,
      reconciliationStatus: "MATCHED",
    },
  });
}

export async function applySalaryMatch(
  transactionId: string,
  teacherId: string,
  year: number,
  month: number
) {
  const tx = await prisma.bankTransaction.findUniqueOrThrow({ where: { id: transactionId } });
  const amount = Math.abs(decimalToNumber(tx.amount));
  const category = await prisma.category.findFirst({ where: { name: "Teacher Honorarium / Salary" } });

  await prisma.salaryPayment.create({
    data: {
      teacherId,
      periodYear: year,
      periodMonth: month,
      amount,
      status: "PAID",
      paidAt: new Date(),
      bankTransactionId: transactionId,
    },
  });

  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      categoryId: category?.id,
      reconciliationStatus: "MATCHED",
    },
  });
}

export async function runAutoMatchForUnmatched() {
  const unmatched = await prisma.bankTransaction.findMany({
    where: { reconciliationStatus: { in: ["UNMATCHED", "SUGGESTED"] } },
    take: 100,
    orderBy: { bookingDate: "desc" },
  });

  let suggested = 0;
  for (const tx of unmatched) {
    const matches = await suggestMatches(tx.id);
    if (matches.length > 0) suggested++;
  }
  return { processed: unmatched.length, suggested };
}

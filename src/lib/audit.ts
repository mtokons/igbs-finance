import { prisma } from "@/lib/db";

export async function logAudit(
  userId: string | null | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

import { PrismaClient } from "@prisma/client";

const dbUrl =
  (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) ||
  process.env.POSTGRES_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_DATABASE_URL ||
  "postgres://cd60e02099467dfc830132d21ea279affe5a944af8a1e284650a64196c9e8a51:sk_NMdUbW28j7rqLZo6fI84D@db.prisma.io:5432/postgres?sslmode=require";

process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const asifPassword = await bcrypt.hash("Asif@IGBS2026!", 12);
  const haiderPassword = await bcrypt.hash("Haider@IGBS2026!", 12);

  // 1. Asif Admin
  const asif = await prisma.user.upsert({
    where: { email: "habrontheraizo@gmail.com" },
    update: {
      name: "Asif Hossain",
      role: "ADMIN",
      username: "asif",
      passwordHash: asifPassword,
      mustChangePassword: false,
    },
    create: {
      name: "Asif Hossain",
      email: "habrontheraizo@gmail.com",
      username: "asif",
      role: "ADMIN",
      passwordHash: asifPassword,
      mustChangePassword: false,
    },
  });

  // 2. Haider Admin
  const haider = await prisma.user.upsert({
    where: { email: "haider74hamburg@hotmail.com" },
    update: {
      name: "Julfiqur Haider",
      role: "ADMIN",
      username: "haider",
      passwordHash: haiderPassword,
      mustChangePassword: false,
    },
    create: {
      name: "Julfiqur Haider",
      email: "haider74hamburg@hotmail.com",
      username: "haider",
      role: "ADMIN",
      passwordHash: haiderPassword,
      mustChangePassword: false,
    },
  });

  console.log("Admin accounts created/updated:");
  console.log("Asif:", asif.email, "(username:", asif.username, ")");
  console.log("Haider:", haider.email, "(username:", haider.username, ")");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

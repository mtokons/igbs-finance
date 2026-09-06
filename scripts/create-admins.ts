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
  let haiderUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "haider74hamburg@hotmail.com" },
        { email: "haiderjulfiqur400@gmail.com" },
        { username: "haider" },
      ],
    },
  });

  let haider;
  if (haiderUser) {
    haider = await prisma.user.update({
      where: { id: haiderUser.id },
      data: {
        name: "Julfiqur Haider",
        email: "haiderjulfiqur400@gmail.com",
        username: "haider",
        role: "ADMIN",
        passwordHash: haiderPassword,
        mustChangePassword: false,
      },
    });
  } else {
    haider = await prisma.user.create({
      data: {
        name: "Julfiqur Haider",
        email: "haiderjulfiqur400@gmail.com",
        username: "haider",
        role: "ADMIN",
        passwordHash: haiderPassword,
        mustChangePassword: false,
      },
    });
  }

  // Also update Member profile email if exists
  await prisma.member.updateMany({
    where: {
      OR: [
        { memberCode: "IGBS02" },
        { email: "haider74hamburg@hotmail.com" },
      ],
    },
    data: {
      email: "haiderjulfiqur400@gmail.com",
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

import bcrypt from "bcryptjs";
import { SystemRole } from "@prisma/client";
import { db } from "../src/lib/db";

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  // 1. Seed default Vin account
  const vin = await db.user.upsert({
    where: { email: "vin@family.local" },
    update: {
      name: "Vin",
      passwordHash,
      emailVerified: new Date(),
      systemRole: SystemRole.ADMIN,
    },
    create: {
      name: "Vin",
      email: "vin@family.local",
      passwordHash,
      emailVerified: new Date(),
      systemRole: SystemRole.ADMIN,
    },
  });

  console.log(`User ${vin.name} (${vin.email}) ready.`);

  // 2. Seed initial default account and categories if none exist
  const existingAccounts = await db.account.count({ where: { userId: vin.id } });
  if (existingAccounts === 0) {
    await db.account.create({
      data: {
        userId: vin.id,
        name: "Everyday Checking",
        institution: "Main Bank",
        balance: 500000, // $5,000.00
      },
    });
  }

  const defaultCategories = [
    { name: "Groceries", color: "#0f766e" },
    { name: "Housing & Utilities", color: "#2563eb" },
    { name: "Dining & Entertainment", color: "#d97706" },
    { name: "Salary & Income", color: "#16a34a" },
  ];

  for (const cat of defaultCategories) {
    await db.category.upsert({
      where: { userId_name: { userId: vin.id, name: cat.name } },
      update: {},
      create: { userId: vin.id, name: cat.name, color: cat.color },
    });
  }

  // 3. Update any extra ADMIN_EMAILS if specified in environment
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length > 0) {
    await db.user.updateMany({
      where: { email: { in: emails } },
      data: { systemRole: SystemRole.ADMIN },
    });
  }
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

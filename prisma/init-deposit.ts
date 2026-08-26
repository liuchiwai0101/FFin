import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function init() {
  console.log("Creating DepositRecord table if not exists...");
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DepositRecord" (
      "id" TEXT NOT NULL,
      "userId" TEXT,
      "ownerName" TEXT NOT NULL,
      "bank" TEXT NOT NULL,
      "product" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "rate" DOUBLE PRECISION,
      "fromDate" TIMESTAMP(3),
      "toDate" TIMESTAMP(3),
      "months" DOUBLE PRECISION,
      "totalAmount" DOUBLE PRECISION,
      "interest" DOUBLE PRECISION,
      "currency" TEXT NOT NULL DEFAULT 'HKD',
      "isCurrent" BOOLEAN NOT NULL DEFAULT true,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DepositRecord_pkey" PRIMARY KEY ("id")
    );
  `);

  await db.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DepositRecord_userId_fkey') THEN
        ALTER TABLE "DepositRecord" ADD CONSTRAINT "DepositRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DepositRecord_ownerName_isCurrent_idx" ON "DepositRecord"("ownerName", "isCurrent");`);
  await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DepositRecord_bank_isCurrent_idx" ON "DepositRecord"("bank", "isCurrent");`);

  console.log("DepositRecord table ready!");
}

init()
  .catch((err) => {
    console.error("Init table error:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

-- AlterTable
ALTER TABLE "FixedExpense"
  ADD COLUMN "installmentsTotal" INTEGER,
  ADD COLUMN "installmentsStartMonth" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3);

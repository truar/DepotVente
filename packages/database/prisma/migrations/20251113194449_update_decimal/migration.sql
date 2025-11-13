/*
  Warnings:

  - You are about to alter the column `payment_amount` on the `deposits` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(6,2)`.

*/
-- AlterTable
ALTER TABLE "deposits" ALTER COLUMN "payment_amount" SET DATA TYPE DECIMAL(6,2);

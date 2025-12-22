/*
  Warnings:

  - Added the required column `type` to the `CashRegisterControl` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CashRegisterControlType" AS ENUM ('DEPOSIT', 'SALE');

-- AlterTable
ALTER TABLE "CashRegisterControl" ADD COLUMN     "type" "CashRegisterControlType" NOT NULL;

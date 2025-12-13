/*
  Warnings:

  - You are about to drop the column `userId` on the `deposits` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `sales` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "deposits" DROP CONSTRAINT "deposits_userId_fkey";

-- DropForeignKey
ALTER TABLE "predeposits" DROP CONSTRAINT "predeposits_deposit_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_userId_fkey";

-- AlterTable
ALTER TABLE "deposits" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "userId";

/*
  Warnings:

  - You are about to drop the column `payment_amount` on the `deposits` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `deposits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deposits" DROP COLUMN "payment_amount",
DROP COLUMN "signature",
ADD COLUMN     "signatory" TEXT;

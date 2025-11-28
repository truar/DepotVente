-- CreateEnum
CREATE TYPE "DepositType" AS ENUM ('PRO', 'PARTICULIER');

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "type" "DepositType" NOT NULL DEFAULT 'PARTICULIER';

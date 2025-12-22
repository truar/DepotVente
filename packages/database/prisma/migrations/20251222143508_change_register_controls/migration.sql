/*
  Warnings:

  - You are about to alter the column `cash200` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash100` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash50` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash20` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash10` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash5` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash2` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash1` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash05` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash02` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash01` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash005` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash002` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - You are about to alter the column `cash001` on the `CashRegisterControl` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `Integer`.
  - Changed the type of `cash_register_id` on the `CashRegisterControl` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CashRegisterControl" DROP COLUMN "cash_register_id",
ADD COLUMN     "cash_register_id" INTEGER NOT NULL,
ALTER COLUMN "cash200" SET DATA TYPE INTEGER,
ALTER COLUMN "cash100" SET DATA TYPE INTEGER,
ALTER COLUMN "cash50" SET DATA TYPE INTEGER,
ALTER COLUMN "cash20" SET DATA TYPE INTEGER,
ALTER COLUMN "cash10" SET DATA TYPE INTEGER,
ALTER COLUMN "cash5" SET DATA TYPE INTEGER,
ALTER COLUMN "cash2" SET DATA TYPE INTEGER,
ALTER COLUMN "cash1" SET DATA TYPE INTEGER,
ALTER COLUMN "cash05" SET DATA TYPE INTEGER,
ALTER COLUMN "cash02" SET DATA TYPE INTEGER,
ALTER COLUMN "cash01" SET DATA TYPE INTEGER,
ALTER COLUMN "cash005" SET DATA TYPE INTEGER,
ALTER COLUMN "cash002" SET DATA TYPE INTEGER,
ALTER COLUMN "cash001" SET DATA TYPE INTEGER;

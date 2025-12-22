/*
  Warnings:

  - You are about to drop the `CashRegisterControl` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CashRegisterControl";

-- CreateTable
CREATE TABLE "cashRegisterControls" (
    "id" UUID NOT NULL,
    "cash_register_id" INTEGER NOT NULL,
    "type" "CashRegisterControlType" NOT NULL,
    "initial_amount" DECIMAL(10,2) NOT NULL,
    "theoretical_cash_amount" DECIMAL(5,2) NOT NULL,
    "real_cash_amount" DECIMAL(5,2) NOT NULL,
    "difference" DECIMAL(5,2) NOT NULL,
    "total_amount" DECIMAL(5,2) NOT NULL,
    "cash200" INTEGER NOT NULL,
    "cash100" INTEGER NOT NULL,
    "cash50" INTEGER NOT NULL,
    "cash20" INTEGER NOT NULL,
    "cash10" INTEGER NOT NULL,
    "cash5" INTEGER NOT NULL,
    "cash2" INTEGER NOT NULL,
    "cash1" INTEGER NOT NULL,
    "cash05" INTEGER NOT NULL,
    "cash02" INTEGER NOT NULL,
    "cash01" INTEGER NOT NULL,
    "cash005" INTEGER NOT NULL,
    "cash002" INTEGER NOT NULL,
    "cash001" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cashRegisterControls_pkey" PRIMARY KEY ("id")
);

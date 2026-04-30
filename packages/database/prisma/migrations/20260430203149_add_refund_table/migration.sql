/*
  Warnings:

  - You are about to drop the column `refund_card_amount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `refund_cash_amount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `refund_comment` on the `sales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "refund_card_amount",
DROP COLUMN "refund_cash_amount",
DROP COLUMN "refund_comment";

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "increment_start" INTEGER NOT NULL,
    "card_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cash_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refunds_sale_id_idx" ON "refunds"("sale_id");

-- CreateIndex
CREATE INDEX "refunds_increment_start_idx" ON "refunds"("increment_start");

-- CreateIndex
CREATE INDEX "refunds_updated_at_idx" ON "refunds"("updated_at");

-- CreateIndex
CREATE INDEX "refunds_deleted_at_idx" ON "refunds"("deleted_at");

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

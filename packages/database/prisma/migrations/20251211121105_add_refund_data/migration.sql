-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "refund_card_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "refund_cash_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "refund_comment" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "club_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "seller_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sold_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "returned_calculation_date" TIMESTAMP(3),
ALTER COLUMN "club_amount" DROP NOT NULL,
ALTER COLUMN "club_amount" DROP DEFAULT,
ALTER COLUMN "seller_amount" DROP NOT NULL,
ALTER COLUMN "seller_amount" DROP DEFAULT,
ALTER COLUMN "sold_amount" DROP NOT NULL,
ALTER COLUMN "sold_amount" DROP DEFAULT;

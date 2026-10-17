-- AlterTable
-- DECIMAL(3,2) stops at 9.99 €: a seller bringing more than twenty
-- articles owes 10 € or more (2 € per started block of five).
ALTER TABLE "deposits" ALTER COLUMN "contribution_amount" SET DATA TYPE DECIMAL(10,2);

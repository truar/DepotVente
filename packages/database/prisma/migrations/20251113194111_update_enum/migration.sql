/*
  Warnings:

  - The values [PAYER] on the enum `ContributionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContributionStatus_new" AS ENUM ('PAYEE', 'A_PAYER', 'GRATUIT');
ALTER TABLE "public"."deposits" ALTER COLUMN "contribution_status" DROP DEFAULT;
ALTER TABLE "deposits" ALTER COLUMN "contribution_status" TYPE "ContributionStatus_new" USING ("contribution_status"::text::"ContributionStatus_new");
ALTER TYPE "ContributionStatus" RENAME TO "ContributionStatus_old";
ALTER TYPE "ContributionStatus_new" RENAME TO "ContributionStatus";
DROP TYPE "public"."ContributionStatus_old";
ALTER TABLE "deposits" ALTER COLUMN "contribution_status" SET DEFAULT 'A_PAYER';
COMMIT;

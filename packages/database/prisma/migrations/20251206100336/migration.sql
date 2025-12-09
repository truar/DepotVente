-- AlterTable
ALTER TABLE "predeposits" ADD COLUMN     "deposit_id" UUID;

-- AddForeignKey
ALTER TABLE "predeposits" ADD CONSTRAINT "predeposits_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

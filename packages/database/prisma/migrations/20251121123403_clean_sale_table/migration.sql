/*
  Warnings:

  - You are about to drop the column `postal_code` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `sale_at` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `sales` table. All the data in the column will be lost.
  - Added the required column `sale_code` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "postal_code",
DROP COLUMN "sale_at",
DROP COLUMN "total_amount",
ADD COLUMN     "sale_code" TEXT NOT NULL;

/*
  Warnings:

  - You are about to drop the column `sale_code` on the `sales` table. All the data in the column will be lost.
  - Added the required column `sale_index` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sales" DROP COLUMN "sale_code",
ADD COLUMN     "sale_index" INTEGER NOT NULL;

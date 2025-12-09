/*
  Warnings:

  - Added the required column `predeposit_index` to the `predeposits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "predeposits" ADD COLUMN     "predeposit_index" INTEGER NOT NULL;

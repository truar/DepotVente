/*
  Warnings:

  - Made the column `deposit_id` on table `articles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "deposit_id" SET NOT NULL;

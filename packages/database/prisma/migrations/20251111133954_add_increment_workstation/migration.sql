/*
  Warnings:

  - Added the required column `increment_start` to the `workstations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workstations" ADD COLUMN     "increment_start" INTEGER NOT NULL;

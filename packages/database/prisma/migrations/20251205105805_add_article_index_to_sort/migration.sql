/*
  Warnings:

  - You are about to drop the column `articleIndex` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `depositIndex` on the `articles` table. All the data in the column will be lost.
  - Added the required column `article_index` to the `articles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deposit_index` to the `articles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identification_letter` to the `articles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "articleIndex",
DROP COLUMN "depositIndex",
ADD COLUMN     "article_index" INTEGER NOT NULL,
ADD COLUMN     "deposit_index" INTEGER NOT NULL,
ADD COLUMN     "identification_letter" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "predeposits" (
    "id" UUID NOT NULL,
    "sellerLastName" TEXT NOT NULL,
    "sellerFirstName" TEXT NOT NULL,
    "sellerPhoneNumber" TEXT NOT NULL,
    "sellerCity" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "predeposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predepositArticles" (
    "id" UUID NOT NULL,
    "price" DECIMAL(10,2),
    "category" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "identification_letter" TEXT NOT NULL,
    "article_index" INTEGER NOT NULL,
    "predeposit_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "predepositArticles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "predeposits_updated_at_idx" ON "predeposits"("updated_at");

-- CreateIndex
CREATE INDEX "predeposits_deleted_at_idx" ON "predeposits"("deleted_at");

-- CreateIndex
CREATE INDEX "predepositArticles_predeposit_id_idx" ON "predepositArticles"("predeposit_id");

-- CreateIndex
CREATE INDEX "predepositArticles_updated_at_idx" ON "predepositArticles"("updated_at");

-- CreateIndex
CREATE INDEX "predepositArticles_deleted_at_idx" ON "predepositArticles"("deleted_at");

-- AddForeignKey
ALTER TABLE "predepositArticles" ADD CONSTRAINT "predepositArticles_predeposit_id_fkey" FOREIGN KEY ("predeposit_id") REFERENCES "predeposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

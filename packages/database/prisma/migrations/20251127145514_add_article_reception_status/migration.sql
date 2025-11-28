-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('RECEPTION_PENDING', 'RECEPTION_OK');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "status" "ArticleStatus" NOT NULL DEFAULT 'RECEPTION_PENDING';

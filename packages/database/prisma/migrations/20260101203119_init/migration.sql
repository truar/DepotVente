-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BENEVOLE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BENEVOLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashRegisterControls" (
    "id" UUID NOT NULL,
    "cash_register_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "initial_amount" DECIMAL(10,2) NOT NULL,
    "theoretical_cash_amount" DECIMAL(7,2) NOT NULL,
    "real_cash_amount" DECIMAL(7,2) NOT NULL,
    "difference" DECIMAL(7,2) NOT NULL,
    "total_amount" DECIMAL(7,2) NOT NULL,
    "cash200" INTEGER NOT NULL,
    "cash100" INTEGER NOT NULL,
    "cash50" INTEGER NOT NULL,
    "cash20" INTEGER NOT NULL,
    "cash10" INTEGER NOT NULL,
    "cash5" INTEGER NOT NULL,
    "cash2" INTEGER NOT NULL,
    "cash1" INTEGER NOT NULL,
    "cash05" INTEGER NOT NULL,
    "cash02" INTEGER NOT NULL,
    "cash01" INTEGER NOT NULL,
    "cash005" INTEGER NOT NULL,
    "cash002" INTEGER NOT NULL,
    "cash001" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cashRegisterControls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "city" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "contribution_status" TEXT NOT NULL DEFAULT 'A_PAYER',
    "contribution_amount" DECIMAL(3,2) NOT NULL DEFAULT 2,
    "depot_index" INTEGER NOT NULL,
    "increment_start" INTEGER NOT NULL,
    "deposit_workstation_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PARTICULIER',
    "returned_calculation_date" TIMESTAMP(3),
    "sold_amount" DECIMAL(10,2),
    "club_amount" DECIMAL(10,2),
    "due_contribution_amount" DECIMAL(10,2),
    "seller_amount" DECIMAL(10,2),
    "collect_workstation_id" INTEGER,
    "collected_at" TIMESTAMP(3),
    "cheque_number" TEXT,
    "signatory" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "sale_index" INTEGER NOT NULL,
    "increment_start" INTEGER NOT NULL DEFAULT 1,
    "card_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cash_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "check_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refund_card_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refund_cash_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refund_comment" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "price" DECIMAL(10,2),
    "category" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "size" TEXT,
    "color" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "deposit_index" INTEGER NOT NULL,
    "identification_letter" TEXT NOT NULL,
    "article_index" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEPTION_PENDING',
    "deposit_id" UUID NOT NULL,
    "sale_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predeposits" (
    "id" UUID NOT NULL,
    "predeposit_index" INTEGER NOT NULL,
    "sellerLastName" TEXT NOT NULL,
    "sellerFirstName" TEXT NOT NULL,
    "sellerPhoneNumber" TEXT NOT NULL,
    "sellerCity" TEXT NOT NULL,
    "deposit_id" UUID,
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
CREATE INDEX "users_updated_at_idx" ON "users"("updated_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "contacts_updated_at_idx" ON "contacts"("updated_at");

-- CreateIndex
CREATE INDEX "contacts_deleted_at_idx" ON "contacts"("deleted_at");

-- CreateIndex
CREATE INDEX "deposits_updated_at_idx" ON "deposits"("updated_at");

-- CreateIndex
CREATE INDEX "deposits_deleted_at_idx" ON "deposits"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_updated_at_idx" ON "sales"("updated_at");

-- CreateIndex
CREATE INDEX "sales_deleted_at_idx" ON "sales"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "articles_code_key" ON "articles"("code");

-- CreateIndex
CREATE INDEX "articles_code_idx" ON "articles"("code");

-- CreateIndex
CREATE INDEX "articles_deposit_id_idx" ON "articles"("deposit_id");

-- CreateIndex
CREATE INDEX "articles_sale_id_idx" ON "articles"("sale_id");

-- CreateIndex
CREATE INDEX "articles_updated_at_idx" ON "articles"("updated_at");

-- CreateIndex
CREATE INDEX "articles_deleted_at_idx" ON "articles"("deleted_at");

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
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predepositArticles" ADD CONSTRAINT "predepositArticles_predeposit_id_fkey" FOREIGN KEY ("predeposit_id") REFERENCES "predeposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

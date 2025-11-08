-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PAYER', 'A_PAYER', 'GRATUIT');

-- CreateEnum
CREATE TYPE "DepotStatus" AS ENUM ('PRE_DEPOT', 'VALIDE', 'EN_ATTENTE');

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkouts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "initial_cash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "current_cash" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "event_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workstations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workstation_id" UUID NOT NULL,
    "contribution_status" "ContributionStatus" NOT NULL DEFAULT 'A_PAYER',
    "status" "DepotStatus" NOT NULL DEFAULT 'PRE_DEPOT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workstation_id" UUID NOT NULL,
    "checkout_id" UUID NOT NULL,
    "card_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cash_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "check_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "postal_code" TEXT,
    "sale_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transactions" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "cash_received" DECIMAL(10,2) NOT NULL,
    "cash_given" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cash_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "discipline" TEXT,
    "categorie" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "color" TEXT,
    "size" TEXT,
    "price" DECIMAL(10,2),
    "code" TEXT,
    "deposit_id" UUID,
    "sale_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_updated_at_idx" ON "events"("updated_at");

-- CreateIndex
CREATE INDEX "events_deleted_at_idx" ON "events"("deleted_at");

-- CreateIndex
CREATE INDEX "checkouts_updated_at_idx" ON "checkouts"("updated_at");

-- CreateIndex
CREATE INDEX "checkouts_deleted_at_idx" ON "checkouts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "checkouts_event_id_name_key" ON "checkouts"("event_id", "name");

-- CreateIndex
CREATE INDEX "workstations_updated_at_idx" ON "workstations"("updated_at");

-- CreateIndex
CREATE INDEX "workstations_deleted_at_idx" ON "workstations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "workstations_event_id_name_key" ON "workstations"("event_id", "name");

-- CreateIndex
CREATE INDEX "users_updated_at_idx" ON "users"("updated_at");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "deposits_updated_at_idx" ON "deposits"("updated_at");

-- CreateIndex
CREATE INDEX "deposits_deleted_at_idx" ON "deposits"("deleted_at");

-- CreateIndex
CREATE INDEX "sales_updated_at_idx" ON "sales"("updated_at");

-- CreateIndex
CREATE INDEX "sales_deleted_at_idx" ON "sales"("deleted_at");

-- CreateIndex
CREATE INDEX "cash_transactions_updated_at_idx" ON "cash_transactions"("updated_at");

-- CreateIndex
CREATE INDEX "cash_transactions_deleted_at_idx" ON "cash_transactions"("deleted_at");

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

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workstations" ADD CONSTRAINT "workstations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

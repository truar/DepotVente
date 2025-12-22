-- CreateTable
CREATE TABLE "CashRegisterControl" (
    "id" UUID NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "initial_amount" DECIMAL(10,2) NOT NULL,
    "theoretical_cash_amount" DECIMAL(5,2) NOT NULL,
    "real_cash_amount" DECIMAL(5,2) NOT NULL,
    "difference" DECIMAL(5,2) NOT NULL,
    "total_amount" DECIMAL(5,2) NOT NULL,
    "cash200" DECIMAL(3,2) NOT NULL,
    "cash100" DECIMAL(3,2) NOT NULL,
    "cash50" DECIMAL(3,2) NOT NULL,
    "cash20" DECIMAL(3,2) NOT NULL,
    "cash10" DECIMAL(3,2) NOT NULL,
    "cash5" DECIMAL(3,2) NOT NULL,
    "cash2" DECIMAL(3,2) NOT NULL,
    "cash1" DECIMAL(3,2) NOT NULL,
    "cash05" DECIMAL(3,2) NOT NULL,
    "cash02" DECIMAL(3,2) NOT NULL,
    "cash01" DECIMAL(3,2) NOT NULL,
    "cash005" DECIMAL(3,2) NOT NULL,
    "cash002" DECIMAL(3,2) NOT NULL,
    "cash001" DECIMAL(3,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "CashRegisterControl_pkey" PRIMARY KEY ("id")
);

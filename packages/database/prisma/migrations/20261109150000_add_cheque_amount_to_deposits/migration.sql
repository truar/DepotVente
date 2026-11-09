-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "cheque_amount" DECIMAL(10,2);

-- Les chèques déjà faits l'ont été du montant de leur fiche : une fiche ne
-- pouvait pas être recalculée après son chèque. updated_at avance pour que
-- chaque poste reçoive ce montant à sa prochaine synchronisation.
UPDATE "deposits"
SET "cheque_amount" = COALESCE("seller_amount", 0), "updated_at" = NOW()
WHERE "cheque_number" IS NOT NULL;

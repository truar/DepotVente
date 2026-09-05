import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import type { IndividualReturnFormType } from '@/types/ReturnDepositForm.ts'

export function useReturnDepositMutation() {
  const depositsDb = useDepositsDb()
  async function mutate(data: IndividualReturnFormType) {
    if (!data.depositId) return
    const date = new Date()
    await depositsDb.update(data.depositId, {
      signatory: data.signatory,
      checkId: `${data.checkId}`,
      collectedAt: date,
      collectWorkstationId: data.workstation,
      // Une cotisation réglée au moment du retour est soldée, et rattachée au
      // poste qui l'encaisse — pas à la caisse de dépôt d'origine.
      ...(data.contributionPaid
        ? {
            contributionStatus: 'SOLDE' as const,
            contributionCollectWorkstationId: data.workstation,
          }
        : {}),
    })
  }

  return { mutate }
}

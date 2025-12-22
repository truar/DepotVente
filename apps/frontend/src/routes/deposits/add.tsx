import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { Page } from '@/components/Page.tsx'
import { DepositForm } from '@/components/forms/DepositForm.tsx'
import { useCallback, useMemo, useState } from 'react'
import { db } from '@/db.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  computeContributionAmount,
  generateArticleCode,
  generateIdentificationLetter,
  getYear,
  shortArticleCode,
} from '@/utils'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'

export const Route = createFileRoute('/deposits/add')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

export function RouteComponent() {
  const depotDb = useDepositsDb()
  const [workstation] = useWorkstation()
  const currentDepotCount = useLiveQuery(
    () => depotDb.count(workstation),
    [workstation],
  )
  if (currentDepotCount === undefined) return null
  const depositCurrentIndex = workstation.incrementStart + currentDepotCount + 1

  return (
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Enregistrer des articles"
    >
      <DepositAddComponent depositIndex={depositCurrentIndex} />
    </Page>
  )
}

type DepositAddComponentProps = {
  depositIndex: number
}
function DepositAddComponent(props: DepositAddComponentProps) {
  const { depositIndex } = props
  const createDepotMutation = useCreateDepot()
  const [formData, setFormData] = useState<
    DepositFormType['deposit'] | undefined
  >(undefined)
  const loadPredeposit = useCallback(
    async (predepositId: string) => {
      if (!depositIndex) return
      const predeposit = await db.predeposits.get(predepositId)
      if (!predeposit) return
      const predepositArticles = await db.predepositArticles
        .where({ predepositId })
        .sortBy('identificationLetter')
      const year = getYear()
      const data: DepositFormType['deposit'] = {
        depotIndex: depositIndex,
        predepositId: predeposit.id,
        lastName: predeposit.sellerLastName,
        firstName: predeposit.sellerFirstName,
        phoneNumber: predeposit.sellerPhoneNumber,
        city: predeposit.sellerCity,
        contributionStatus: 'A_PAYER',
        contributionAmount: computeContributionAmount(
          predepositArticles.length,
        ),
        articles: predepositArticles.map((article, index) => {
          const identificationLetter = generateIdentificationLetter(index)
          const articleCode = generateArticleCode(
            year,
            depositIndex,
            identificationLetter,
          )
          return {
            id: article.id,
            articleCode: articleCode,
            price: article.price,
            color: article.color,
            depotIndex: depositIndex,
            articleIndex: article.articleIndex,
            discipline: article.discipline,
            size: article.size,
            year: article.year,
            type: article.category,
            model: article.model,
            brand: article.brand,
            softDeletionEnabled: true,
            identificationLetter: article.identificationLetter,
            shortArticleCode: shortArticleCode(
              depositIndex,
              article.identificationLetter,
            ),
          }
        }) as DepositFormType['deposit']['articles'],
      }
      setFormData(data)
    },
    [depositIndex],
  )
  return (
    <div className="flex flex-col gap-5">
      <PredepositComboBox onChange={loadPredeposit} />
      <DepositForm
        depositIndex={depositIndex}
        formData={formData}
        mutation={createDepotMutation}
      />
    </div>
  )
}

type PredepositComboBoxProps = {
  onChange?: (id: string) => void
}
function PredepositComboBox(props: PredepositComboBoxProps) {
  const { onChange } = props
  const [predepositId, setPredepositId] = useState<string | null>(null)
  const predeposits = useLiveQuery(() => db.predeposits.toArray())
  const predepositItems = useMemo(() => {
    return (
      predeposits
        ?.filter((predeposit) => !predeposit.depositId)
        .map((predeposit) => ({
          value: predeposit.id,
          label: `${predeposit.sellerLastName} ${predeposit.sellerFirstName}`,
          keywords: [predeposit.sellerLastName, predeposit.sellerFirstName],
        })) ?? []
    )
  }, [predeposits])

  const handleClick = useCallback(
    () => onChange?.(predepositId ?? ''),
    [onChange, predepositId],
  )

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          items={predepositItems}
          value={predepositId}
          onSelect={setPredepositId}
          placeholder="Rechercher une fiche de pré-dépot"
        />
      </div>
      <Button
        className="col-span-2"
        type="button"
        variant="secondary"
        onClick={handleClick}
      >
        Rechercher
      </Button>
    </div>
  )
}

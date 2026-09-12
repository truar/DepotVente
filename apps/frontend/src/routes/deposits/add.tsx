import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState } from 'react'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import PublicLayout from '@/components/PublicLayout'
import { Page } from '@/components/Page.tsx'
import { DepositForm } from '@/components/forms/DepositForm.tsx'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'
import { db } from '@/db.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import { loadDepositFormFromPredeposit } from '@/services/deposit-from-predeposit.ts'

export const Route = createFileRoute('/deposits/add')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

export function RouteComponent() {
  const depotDb = useDepositsDb()
  const [workstation] = useWorkstation()
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)
  const currentDepotCount = useLiveQuery(
    () => depotDb.count(workstation),
    [workstation],
  )
  if (currentDepotCount === undefined) return null
  const depositCurrentIndex = workstation.incrementStart + currentDepotCount + 1

  return (
    <>
      <Page
        navigation={
          <Link
            to={'..'}
            onClick={(e) => {
              e.preventDefault()
              setBackOpen(true)
            }}
          >
            Retour au menu
          </Link>
        }
        title="Enregistrer des articles"
      >
        <DepositAddComponent depositIndex={depositCurrentIndex} />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title="Etes vous sur de vouloir quitter cette page ?"
        description="Les données non enregistrées seront perdues."
        onConfirm={() => navigate({ to: '..' })}
      />
    </>
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
  const [predepositId, setPredepositId] = useState<string | null>(null)
  const [changeOpen, setChangeOpen] = useState(false)
  const loadPredeposit = useCallback(
    async (predepositId: string) => {
      if (!depositIndex) return
      const data = await loadDepositFormFromPredeposit(
        predepositId,
        depositIndex,
      )
      if (data) setFormData(data)
    },
    [depositIndex],
  )
  // Charger une fiche écrase le formulaire : dès qu'un pré-dépôt y est déjà
  // chargé, on demande confirmation avant de le remplacer par un autre.
  const requestPredeposit = useCallback(
    (id: string) => {
      if (formData) {
        setChangeOpen(true)
        return
      }
      void loadPredeposit(id)
    },
    [formData, loadPredeposit],
  )
  return (
    <div className="flex flex-col gap-5">
      <PredepositComboBox
        onChange={requestPredeposit}
        value={predepositId}
        onSelect={setPredepositId}
      />
      <DepositForm
        depositIndex={depositIndex}
        formData={formData}
        mutation={createDepotMutation}
        onReset={() => {
          setFormData(undefined)
          setPredepositId(null)
        }}
      />
      <ConfirmationDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        title="Etes vous sur de vouloir changer de fiche de pré-dépot ?"
        description="Les données non enregistrées seront perdues."
        onConfirm={() => void loadPredeposit(predepositId ?? '')}
      />
    </div>
  )
}

type PredepositComboBoxProps = {
  onChange?: (id: string) => void
  value: string | null
  onSelect: (id: string | null) => void
}
function PredepositComboBox(props: PredepositComboBoxProps) {
  const { onChange, value: predepositId, onSelect: setPredepositId } = props
  const predepositItems = useLiveQuery(async () => {
    const collator = new Intl.Collator('fr', { sensitivity: 'base' })
    const predeposits = await db.predeposits
      .filter((predeposit) => !predeposit.depositId)
      .toArray()
    predeposits.sort((a, b) => {
      const lastNameCmp = collator.compare(a.sellerLastName, b.sellerLastName)
      if (lastNameCmp !== 0) return lastNameCmp
      return collator.compare(a.sellerFirstName, b.sellerFirstName)
    })
    return predeposits.map((predeposit) => ({
      value: predeposit.id,
      label: `${predeposit.sellerLastName} ${predeposit.sellerFirstName}`,
      keywords: [predeposit.sellerLastName, predeposit.sellerFirstName],
    }))
  }, [])

  const handleClick = useCallback(
    () => onChange?.(predepositId ?? ''),
    [onChange, predepositId],
  )

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          items={predepositItems ?? []}
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
        Valider
      </Button>
    </div>
  )
}

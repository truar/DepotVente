import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useState } from 'react'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import type { Deposit } from '@/db.ts'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { depositTypeOf, useWorkstation } from '@/hooks/useWorkstation.ts'
import PublicLayout from '@/components/PublicLayout'
import { Page } from '@/components/Page.tsx'
import { DepositForm } from '@/components/forms/DepositForm.tsx'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'
import { db } from '@/db.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { loadDepositFormFromPredeposit } from '@/services/deposit-from-predeposit.ts'
import { clearFormDraft } from '@/hooks/useFormDraft.ts'

// La fiche en cours, gardée dans l'onglet (voir useFormDraft).
const DRAFT_KEY = 'draft:/deposits/add'

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
  // La caisse vaut 0 tant qu'elle n'est pas lue (la route en exige une) :
  // le formulaire attend de savoir si c'est celle des pros, car il fixe à
  // son montage ses champs obligatoires et la cotisation choisie d'office.
  if (currentDepotCount === undefined || !workstation.incrementStart)
    return null
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
        <DepositAddComponent
          depositIndex={depositCurrentIndex}
          depositType={depositTypeOf(workstation)}
        />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title={'Etes vous sur de vouloir quitter cette page\u00a0?'}
        description="Les données non enregistrées seront perdues."
        onConfirm={() => {
          clearFormDraft(DRAFT_KEY)
          void navigate({ to: '..' })
        }}
      />
    </>
  )
}

type DepositAddComponentProps = {
  depositIndex: number
  depositType: Deposit['type']
}
function DepositAddComponent(props: DepositAddComponentProps) {
  const { depositIndex, depositType } = props
  const createDepotMutation = useCreateDepot()
  const [formData, setFormData] = useState<
    DepositFormType['deposit'] | undefined
  >(undefined)
  // La fiche chargée dans le formulaire, que la liste affiche ; et celle
  // choisie en attendant la confirmation de remplacement.
  const [loadedPredepositId, setLoadedPredepositId] = useState<string | null>(
    null,
  )
  const [requestedPredepositId, setRequestedPredepositId] = useState<
    string | null
  >(null)
  const loadPredeposit = useCallback(
    async (predepositId: string) => {
      if (!depositIndex) return
      const data = await loadDepositFormFromPredeposit(
        predepositId,
        depositIndex,
      )
      if (!data) return
      setFormData(data)
      setLoadedPredepositId(predepositId)
    },
    [depositIndex],
  )
  // Choisir une fiche dans la liste la charge aussitôt. Charger une fiche
  // écrase le formulaire : dès qu'un pré-dépôt y est déjà chargé, on demande
  // confirmation avant de le remplacer par un autre. Rechoisir la fiche déjà
  // chargée ne fait rien.
  const requestPredeposit = useCallback(
    (id: string) => {
      if (!id || id === loadedPredepositId) return
      if (formData) {
        setRequestedPredepositId(id)
        return
      }
      void loadPredeposit(id)
    },
    [formData, loadedPredepositId, loadPredeposit],
  )
  return (
    <div className="flex flex-col gap-5">
      <PredepositComboBox
        value={loadedPredepositId}
        onSelect={requestPredeposit}
      />
      <DepositForm
        depositIndex={depositIndex}
        depositType={depositType}
        formData={formData}
        mutation={createDepotMutation}
        onReset={() => {
          setFormData(undefined)
          setLoadedPredepositId(null)
        }}
        draftKey={DRAFT_KEY}
        // Une fiche de pré-dépôt restaurée reste affichée dans la liste, et
        // en choisir une autre demande confirmation, comme avant le
        // rechargement.
        onDraftRestored={(deposit) => {
          if (!deposit.predepositId) return
          setFormData(deposit)
          setLoadedPredepositId(deposit.predepositId)
        }}
      />
      <ConfirmationDialog
        open={requestedPredepositId !== null}
        onOpenChange={(open) => {
          if (!open) setRequestedPredepositId(null)
        }}
        title={'Etes vous sur de vouloir changer de fiche de pré-dépot\u00a0?'}
        description="Les données non enregistrées seront perdues."
        onConfirm={() => void loadPredeposit(requestedPredepositId ?? '')}
      />
    </div>
  )
}

type PredepositComboBoxProps = {
  value: string | null
  onSelect: (id: string) => void
}
function PredepositComboBox(props: PredepositComboBoxProps) {
  const { value, onSelect } = props
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

  return (
    <div className="w-[500px]">
      <Combobox
        items={predepositItems ?? []}
        value={value}
        onSelect={onSelect}
        placeholder="Rechercher une fiche de pré-dépot"
      />
    </div>
  )
}

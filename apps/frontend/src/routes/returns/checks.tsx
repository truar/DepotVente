import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { requireAdminAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { type Contact, db, toIsoString } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Field, FieldContent, FieldError } from '@/components/ui/field.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { CheckIdSchema } from '@/types/ReturnDepositForm.ts'
import { useMemo, useState } from 'react'
import { FormattedDate, FormattedNumber } from 'react-intl'
import { csvAmount, downloadCsv } from '@/lib/csv.ts'
import { printPdf } from '@/pdf/print.tsx'
import {
  CheckListingPdf,
  type CheckListingProps,
} from '@/pdf/check-listing-pdf.tsx'
import { getYear } from '@/utils'
import { writtenCheckAmount } from '@/services/return-computation.ts'

export const Route = createFileRoute('/returns/checks')({
  beforeLoad: requireAdminAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Visualiser les chèques"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <ChecksDataTable />
      </div>
    </Page>
  )
}

function ChecksDataTable() {
  const deposits = useLiveQuery(() =>
    db.deposits.where({ type: 'PARTICULIER' }).sortBy('depositIndex'),
  )
  const contact = useLiveQuery(() => db.contacts.toArray())
  const contactMap: Map<string, Contact> = useMemo(() => {
    return (
      contact?.reduce<Map<string, Contact>>((acc, el) => {
        acc.set(el.id, el)
        return acc
      }, new Map()) ?? new Map()
    )
  }, [contact])

  const data: CheckTableType[] = useMemo(
    () =>
      (deposits
        ?.map((deposit) => {
          const seller = contactMap.get(deposit.sellerId)
          if (!seller) return
          return {
            depositId: deposit.id,
            index: deposit.depositIndex,
            seller: `${seller.lastName} ${seller.firstName}`,
            // Ce qui est écrit sur le chèque, même si la fiche a été recalculée
            // depuis.
            checkAmount: writtenCheckAmount(deposit),
            collectWorkstationId: deposit.collectWorkstationId,
            checkId: deposit.checkId,
            signatory: deposit.signatory,
            // Date brute (ISO), formatée seulement à l'affichage : la valeur
            // lue est soit une chaîne ISO (synchro), soit une Date (retour
            // saisi sur ce poste) - voir StoredDate.
            collectedAt: toIsoString(deposit.collectedAt),
          }
        })
        .filter(
          (deposit) => !!deposit && !!deposit.signatory,
        ) as CheckTableType[]) ?? [],
    [contactMap, deposits],
  )

  return (
    <>
      <DataTable
        columnVisibility={{
          depositId: false,
        }}
        columns={columns}
        data={data}
        headerActions={(table) => <ChecksDataTableHeaderAction table={table} />}
      />
      <ChecksSummary checks={data} />
    </>
  )
}

function ChecksSummary({ checks }: { checks: CheckTableType[] }) {
  const total = checks.reduce((acc, check) => acc + (check.checkAmount ?? 0), 0)

  return (
    <div className="flex flex-row gap-5 font-bold">
      <p>Nombre de chèques: {checks.length}</p>
      <p>
        Montant réglé:{' '}
        <FormattedNumber value={total} style="currency" currency="EUR" />
      </p>
    </div>
  )
}

export type CheckTableType = {
  depositId: string
  index: number
  seller: string
  checkAmount?: number
  checkId?: string
  collectedAt?: string
  collectWorkstationId?: number
  signatory?: string
}

export const columns: ColumnDef<CheckTableType>[] = [
  {
    accessorKey: 'index',
    header: 'Identifiant',
  },
  {
    accessorKey: 'seller',
    header: 'Déposant',
  },
  {
    accessorKey: 'collectWorkstationId',
    header: 'Poste retour',
  },
  {
    accessorKey: 'checkId',
    header: 'Numéro du chèque',
  },
  {
    accessorKey: 'signatory',
    header: 'Signature',
  },
  {
    accessorKey: 'collectedAt',
    header: 'Heure retour',
    // Heure de Rumilly, quel que soit le fuseau du poste :
    // « 2026-09-12T14:58:00.000Z » -> « 12/09/2026 16:58:00 ».
    cell: ({ row }) => {
      const collectedAt = row.original.collectedAt
      return collectedAt ? (
        <FormattedDate
          value={collectedAt}
          dateStyle="short"
          timeStyle="medium"
          timeZone="Europe/Paris"
        />
      ) : null
    },
  },
  {
    id: 'amount',
    header: () => <div className="text-right pr-3">Montant du chèque</div>,
    cell: ({ row }) => {
      const checkAmount = row.original.checkAmount
      return (
        <p className="text-right pr-3">
          {checkAmount ? (
            <FormattedNumber
              value={checkAmount}
              style="currency"
              currency="EUR"
            />
          ) : null}
        </p>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <EditCheckIdButton check={row.original} />,
  },
]

// Un chèque sorti sur la mauvaise formule, ou un n° tapé au retour qui
// n'était pas celui du chèque dans l'imprimante : le retour est validé, la
// fiche a quitté l'écran de retour, et le n° gardé pour la comptabilité est
// faux. On le corrige ici, un chèque à la fois.
function EditCheckIdButton({ check }: { check: CheckTableType }) {
  const depositsDb = useDepositsDb()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Un n° déjà porté par une autre fiche : on prévient, et on l'enregistre
  // quand même si on le confirme.
  const [duplicate, setDuplicate] = useState<string | null>(null)

  const openBox = () => {
    setDraft(check.checkId ?? '')
    setError(null)
    setDuplicate(null)
    setOpen(true)
  }

  // Le n° change : l'erreur et l'avertissement visaient l'ancien.
  const changeDraft = (value: string) => {
    setDraft(value)
    setError(null)
    setDuplicate(null)
  }

  const save = async (confirmed: boolean) => {
    const parsed = CheckIdSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    const checkId = `${parsed.data}`
    if (checkId === check.checkId) {
      setOpen(false)
      return
    }
    if (!confirmed) {
      const other = await db.deposits
        .filter(
          (deposit) =>
            deposit.checkId === checkId &&
            deposit.id !== check.depositId &&
            !deposit.deletedAt,
        )
        .first()
      if (other) {
        const seller = await db.contacts.get(other.sellerId)
        setDuplicate(
          `Le chèque ${checkId} est déjà celui de la fiche ${other.depositIndex}` +
            (seller ? ` (${seller.lastName} ${seller.firstName}).` : '.'),
        )
        return
      }
    }
    await depositsDb.update(check.depositId, { checkId })
    setOpen(false)
    toast.success(`Fiche ${check.index} : chèque n° ${checkId}`)
  }

  return (
    <>
      <Button
        variant="ghost"
        type="button"
        onClick={openBox}
        aria-label="Modifier le n° de chèque"
        title="Modifier le n° de chèque"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              Modifier le n° de chèque — fiche {check.index}
            </DialogTitle>
            <DialogDescription>
              Le n° imprimé sur le chèque remis à {check.seller}.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!error}>
            <FieldContent>
              <Label htmlFor="edit-check-id">N° de chèque</Label>
              <Input
                id="edit-check-id"
                value={draft}
                onChange={(e) => changeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void save(false)
                  }
                }}
                aria-invalid={!!error}
                autoComplete="off"
                autoFocus
              />
              {error && <FieldError>{error}</FieldError>}
            </FieldContent>
          </Field>
          {duplicate && (
            <p
              role="alert"
              className="text-sm text-amber-800 bg-amber-50 p-3 rounded"
            >
              {duplicate}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            {duplicate ? (
              <Button type="button" onClick={() => void save(true)}>
                Enregistrer quand même
              </Button>
            ) : (
              <Button type="button" onClick={() => void save(false)}>
                Enregistrer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type ChecksDataTableHeaderActionProps = {
  table: Table<CheckTableType>
}
function ChecksDataTableHeaderAction({
  table,
}: ChecksDataTableHeaderActionProps) {
  const print = async () => {
    const rows = table
      .getGlobalFacetedRowModel()
      .rows.map((row) => row.original)

    const pdfData: CheckListingProps['data']['checks'] = []
    for (const row of rows) {
      pdfData.push(row)
    }

    await printPdf(
      <CheckListingPdf data={{ checks: pdfData, year: getYear() }} />,
    )
  }

  // Le comptable l'ouvre d'un double-clic dans Excel (voir lib/csv.ts).
  const exportCsv = () => {
    const rows = table
      .getGlobalFacetedRowModel()
      .rows.map((row) => row.original)
    downloadCsv('export-comptable.csv', [
      ['Cpte', 'Jal', 'Date', 'Libelle', 'Debit', 'Credit', 'N°CH'],
      ...rows.flatMap((row) => {
        const lines: Array<Array<string>> = []
        const collectedAt = new Date(
          row.collectedAt?.split(' ')?.at(0) || 0,
        ).toLocaleDateString('fr-FR')
        const amount = csvAmount(row.checkAmount ?? 0)
        const label = `${row.checkId} ${row.seller}`
        lines.push([
          '512100',
          'CAS',
          collectedAt,
          label,
          '',
          amount,
          row.checkId ?? '',
        ])
        lines.push([
          '580000',
          'CAS',
          collectedAt,
          label,
          amount,
          '',
          row.checkId ?? '',
        ])
        return lines
      }),
    ])
  }
  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={() => exportCsv()}>
        Générer l'export comptable
      </CustomButton>
      <CustomButton onClick={() => print()}>Imprimer en PDF</CustomButton>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { type Contact, type StoredDate, db, toIsoString } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useMemo } from 'react'
import { FormattedNumber, useIntl } from 'react-intl'
import { printPdf } from '@/pdf/print.tsx'
import {
  CheckListingPdf,
  type CheckListingProps,
} from '@/pdf/check-listing-pdf.tsx'
import { getYear } from '@/utils'

export const Route = createFileRoute('/returns/checks')({
  beforeLoad: requireAuthAndWorkstation,
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

// « 2026-09-12T14:58:00.000Z » -> « 2026-09-12 14:58:00 ».
//
// La valeur lue est soit une chaîne ISO (enregistrement venu de la synchro),
// soit un objet Date (retour saisi sur ce poste) - voir StoredDate. L'ancien
// code castait en `string` et appelait `.split`, ce qui jetait un TypeError sur
// la seconde forme et, faute d'error boundary, emportait toute la page.
//
// On formate depuis l'ISO et non en heure locale : c'est déjà ce qu'affichait
// la page pour les enregistrements synchronisés, et convertir ferait changer
// l'heure affichée d'un même retour au premier delta qui l'écrase.
function formatCollectedAt(value: StoredDate | undefined): string {
  const [date, time] = toIsoString(value)?.split('T') ?? []
  if (!date) return ''
  return `${date} ${time?.split('.')[0] ?? ''}`.trim()
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
            index: deposit.depositIndex,
            seller: `${seller.lastName} ${seller.firstName}`,
            sellerAmount: deposit.sellerAmount,
            collectWorkstationId: deposit.collectWorkstationId,
            checkId: deposit.checkId,
            signatory: deposit.signatory,
            collectedAt: formatCollectedAt(deposit.collectedAt),
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
  const total = checks.reduce(
    (acc, check) => acc + (check.sellerAmount ?? 0),
    0,
  )

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
  index: number
  seller: string
  sellerAmount?: number
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
  },
  {
    id: 'amount',
    header: () => <div className="text-right pr-3">Montant du chèque</div>,
    cell: ({ row }) => {
      const sellerAmount = row.original.sellerAmount
      return (
        <p className="text-right pr-3">
          {sellerAmount ? (
            <FormattedNumber
              value={sellerAmount}
              style="currency"
              currency="EUR"
            />
          ) : null}
        </p>
      )
    },
  },
]

type ChecksDataTableHeaderActionProps = {
  table: Table<CheckTableType>
}
function ChecksDataTableHeaderAction({
  table,
}: ChecksDataTableHeaderActionProps) {
  const intl = useIntl()
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

  const exportCsv = async () => {
    // Convert the data array into a CSV string
    const rows = table
      .getGlobalFacetedRowModel()
      .rows.map((row) => row.original)
    const csvString = [
      ['Cpte', 'Jal', 'Date', 'Libelle', 'Debit', 'Credit', 'N°CH'], // Specify your headers here
      ...rows.flatMap((row) => {
        const lines = []
        const collectedAt = new Date(
          row.collectedAt?.split(' ')?.at(0) || 0,
        ).toLocaleDateString()
        const amount = intl.formatNumber(row.sellerAmount ?? 0)
        const label = `${row.checkId} ${row.seller}`
        lines.push([
          '512100',
          'CAS',
          collectedAt,
          label,
          '',
          amount,
          row.checkId,
        ])
        lines.push([
          '580000',
          'CAS',
          collectedAt,
          label,
          amount,
          '',
          row.checkId,
        ])
        return lines
      }),
    ]
      .map((row) => row.join(';'))
      .join('\n')

    // Create a Blob from the CSV string
    const blob = new Blob([csvString], { type: 'text/csv' })

    // Generate a download link and initiate the download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'export-comptable.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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

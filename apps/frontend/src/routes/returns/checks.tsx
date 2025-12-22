import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { type Contact, db } from '@/db.ts'
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
          // FIXME by reading the DB, collectedAt is a string `2025-11-01T14:58:00.000Z` not a Date
          const collectedAt = (
            deposit.collectedAt as string | undefined
          )?.split('T')
          return {
            index: deposit.depositIndex,
            seller: `${seller.lastName} ${seller.firstName}`,
            sellerAmount: deposit.sellerAmount,
            collectWorkstationId: deposit.collectWorkstationId,
            checkId: deposit.checkId,
            signatory: deposit.signatory,
            collectedAt: `${collectedAt?.at(0) ?? ''} ${collectedAt?.at(1)?.split('.')[0] ?? ''}`,
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
    </>
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
    header: 'Montant vendu',
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

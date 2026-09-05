import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { Page } from '@/components/Page.tsx'
import PublicLayout from '@/components/PublicLayout.tsx'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DepositPdf,
  DepositsPdf,
  type DepositsPdfProps,
} from '@/pdf/deposit-pdf.tsx'
import { loadDepositPdfData } from '@/pdf/load-deposit-pdf-data.ts'
import { type Contact, db, type Deposit } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { ErrorDialog } from '@/components/custom/ErrorDialog.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { EyeIcon, SquarePenIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/deposits/listing')({
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
      title="Gérer les fiches des dépôts"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <DepositDataTable />
      </div>
    </Page>
  )
}

function DepositDataTable() {
  const deposits = useLiveQuery(() =>
    db.deposits.offset(0).sortBy('depositIndex'),
  )
  const contact = useLiveQuery(() => db.contacts.toArray())
  const contactMap = useMemo(() => {
    return (
      contact?.reduce<Map<string, Contact>>((acc, el) => {
        acc.set(el.id, el)
        return acc
      }, new Map()) ?? new Map()
    )
  }, [contact])

  const contributionStatuses = useMemo(() => {
    return new Map([
      ['PAYE', 'Payé'],
      ['SOLDE', 'Soldé'],
      ['DEDUITE', 'Déduite'],
      ['A_PAYER', 'A payer'],
      ['PRO', 'Pro'],
      ['GRATUIT', 'Gratuit'],
    ])
  }, [])

  const data: DepositTableType[] = useMemo(
    () =>
      deposits?.map((deposit) => {
        const seller = contactMap.get(deposit.sellerId)
        return {
          depositId: deposit.id,
          index: deposit.depositIndex,
          type: deposit.type,
          contributionStatus:
            contributionStatuses.get(deposit.contributionStatus) ?? '',
          contributionAmount: deposit.contributionAmount,
          seller: `${seller?.lastName} ${seller?.firstName}`,
        }
      }) ?? [],
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
        headerActions={(table) => (
          <DepositDataTableHeaderAction table={table} />
        )}
      />
      <DepositsSummary />
    </>
  )
}

export type DepositTableType = {
  depositId: string
  index: number
  type: Deposit['type']
  contributionStatus: string
  contributionAmount: number
  seller: string
}

export const columns: ColumnDef<DepositTableType>[] = [
  {
    id: 'depositId',
    accessorKey: 'depositId',
  },
  {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tous sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner une ligne"
      />
    ),
  },
  {
    accessorKey: 'index',
    header: 'Identifiant',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'seller',
    header: 'Déposant',
  },
  {
    id: 'countArticles',
    header: "Nombre d'articles",
    cell: ({ row }) => {
      const articlesCount = useLiveQuery(() =>
        db.articles
          .where({ depositId: row.original.depositId })
          .and((article) => article.status !== 'DELETED')
          .count(),
      )

      return <p>{articlesCount}</p>
    },
  },
  {
    accessorKey: 'contributionStatus',
    header: 'Statut de la contribution',
  },
  {
    accessorKey: 'contributionAmount',
    header: () => <div className="text-right pr-3">Montant cotisation</div>,
    cell: ({ row }) => (
      <p className="text-right pr-3">
        <FormattedNumber value={row.original.contributionAmount} style="currency" currency="EUR" />
      </p>
    ),
  },
  {
    id: 'amount',
    header: () => <div className="text-right pr-3">Montant</div>,
    cell: ({ row }) => {
      const articles = useLiveQuery(() =>
        db.articles
          .where({ depositId: row.original.depositId })
          .and((article) => article.status !== 'DELETED')
          .toArray(),
      )
      const sum =
        articles?.reduce((acc, article) => acc + article.price, 0) ?? 0

      return (
        <p className="text-right pr-3">
          <FormattedNumber value={sum} style="currency" currency="EUR" />
        </p>
      )
    },
  },
  {
    id: 'actions',
    size: 30,
    cell: ({ row }) => {
      const id = row.original.depositId
      const print = useCallback(async (depositId: string) => {
        const data = await loadDepositPdfData(depositId)
        if (!data) return
        await printPdf(<DepositPdf data={data} />)
      }, [])
      return (
        <div>
          <Link to="/deposits/$depositId/edit" params={{ depositId: id }}>
            <Button variant="ghost" size="icon">
              <SquarePenIcon />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => print(id)}>
            <EyeIcon />
          </Button>
        </div>
      )
    },
  },
]

type DepositDataTableHeaderActionProps = {
  table: Table<DepositTableType>
}
function DepositDataTableHeaderAction({
  table,
}: DepositDataTableHeaderActionProps) {
  const [errorOpen, setErrorOpen] = useState(false)

  const print = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    if (selectedDepositIds.length === 0) {
      setErrorOpen(true)
      return
    }

    const depositsPdfData: DepositsPdfProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await loadDepositPdfData(id)
      if (data) {
        depositsPdfData.push(data)
      }
    }

    await printPdf(<DepositsPdf data={depositsPdfData} />)
  }

  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={print}>Imprimer les fiches</CustomButton>
      <ErrorDialog
        open={errorOpen}
        onOpenChange={setErrorOpen}
        description="Veuillez sélectionner au moins une fiche à imprimer."
      />
    </div>
  )
}

function DepositsSummary() {
  const articles = useLiveQuery(() =>
    db.articles
      .offset(0)
      .and((article) => article.status !== 'DELETED')
      .toArray(),
  )
  const deposits = useLiveQuery(() => db.deposits.toArray())
  const total =
    articles?.reduce((acc, article) => acc + article.price, 0) ?? 0
  const count = articles?.length ?? 0
  const paidContributions =
    deposits
      ?.filter(
        (deposit) =>
          deposit.contributionStatus === 'PAYE' ||
          deposit.contributionStatus === 'SOLDE',
      )
      .reduce((acc, deposit) => acc + (deposit.contributionAmount ?? 0), 0) ?? 0
  const contributionsToCollect =
    deposits
      ?.filter((deposit) => deposit.contributionStatus === 'A_PAYER')
      .reduce((acc, deposit) => acc + (deposit.contributionAmount ?? 0), 0) ?? 0

  return (
    <div className="flex flew-row gap-5 font-bold">
      <p>Nombre d'articles: {count}</p>
      <p>
        Montant total:{' '}
        <FormattedNumber value={total} style="currency" currency="EUR" />
      </p>
      <p>
        Cotisations payées:{' '}
        <FormattedNumber
          value={paidContributions}
          style="currency"
          currency="EUR"
        />
      </p>
      <p>
        Cotisations à encaisser:{' '}
        <FormattedNumber
          value={contributionsToCollect}
          style="currency"
          currency="EUR"
        />
      </p>
    </div>
  )
}

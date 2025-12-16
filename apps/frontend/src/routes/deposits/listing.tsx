import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { getYear } from '@/utils'
import { type ColumnDef, type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DepositPdf,
  type DepositPdfProps,
  DepositsPdf,
  type DepositsPdfProps,
} from '@/pdf/deposit-pdf.tsx'
import { type Contact, db, type Deposit } from '@/db.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/custom/DataTable.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { printPdf } from '@/pdf/print.tsx'
import {
  EyeIcon,
  HandCoinsIcon,
  ScanEyeIcon,
  SquarePenIcon,
} from 'lucide-react'
import { useCallback, useMemo } from 'react'
import {
  ReturnDepositPdf,
  type ReturnDepositPdfProps,
  ReturnDepositsPdf,
  type ReturnDepositsPdfProps,
} from '@/pdf/return-deposit-pdf.tsx'
import { useComputeReturnMutation } from '@/hooks/useComputeReturnMutation.ts'
import { FormattedNumber } from 'react-intl'

export const Route = createFileRoute('/deposits/listing')({
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

async function createDepositPdfData(
  id: string,
): Promise<DepositPdfProps['data'] | undefined> {
  const year = getYear()
  const deposit = await db.deposits.get(id)
  if (!deposit) return undefined

  const articles = await db.articles
    .where({ depositId: deposit.id })
    .sortBy('articleIndex')
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  return {
    deposit: {
      depositIndex: deposit.depositIndex,
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      year: year,
    },
    contact: {
      lastName: contact.lastName,
      firstName: contact.firstName,
      city: contact.city,
      phoneNumber: contact.phoneNumber,
    },
    articles: articles.map((article) => ({
      shortCode: article.depositIndex + ' ' + article.identificationLetter,
      discipline: article.discipline,
      size: article.size,
      price: article.price,
      brand: article.brand,
      model: article.model,
      color: article.color,
      category: article.category,
    })),
  }
}

async function createReturnDepositPdfData(
  id: string,
): Promise<ReturnDepositPdfProps['data'] | undefined> {
  const year = getYear()
  const deposit = await db.deposits.get(id)
  if (!deposit) return undefined

  const articles = await db.articles
    .where({ depositId: deposit.id })
    .sortBy('code')
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  const soldArticles = articles.filter((article) => !!article.saleId)
  return {
    deposit: {
      depositIndex: deposit.depositIndex,
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      year: year,
      totalAmount: deposit.soldAmount ?? 0,
      clubAmount: deposit.clubAmount ?? 0,
      dueAmount: deposit.sellerAmount ?? 0,
      countSoldArticles: soldArticles.length,
    },
    contact: {
      lastName: contact.lastName,
      firstName: contact.firstName,
      city: contact.city,
      phoneNumber: contact.phoneNumber,
    },
    articles: articles.map((article) => ({
      shortCode: article.depositIndex + ' ' + article.identificationLetter,
      discipline: article.discipline,
      size: article.size,
      price: article.price,
      brand: article.brand,
      model: article.model,
      color: article.color,
      category: article.category,
      isSold: !!article.saleId,
    })),
  }
}

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
      ['PAYEE', 'Payée'],
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
          returnStatus: deposit.returnedCalculationDate
            ? 'PRÊT'
            : 'RETOUR A CALCULER',
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
  returnStatus: string
  contributionStatus: string
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
        db.articles.where({ depositId: row.original.depositId }).count(),
      )

      return <p>{articlesCount}</p>
    },
  },
  {
    accessorKey: 'returnStatus',
    header: 'Statut du retour',
  },
  {
    accessorKey: 'contributionStatus',
    header: 'Statut de la contribution',
  },
  {
    id: 'amount',
    header: 'Montant',
    cell: ({ row }) => {
      const articles = useLiveQuery(() =>
        db.articles.where({ depositId: row.original.depositId }).toArray(),
      )
      const sum =
        articles?.reduce(
          (acc, article) => acc + parseInt(`${article.price}`),
          0,
        ) ?? 0

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
      const mutation = useComputeReturnMutation()
      const id = row.original.depositId
      const print = useCallback(async (depositId: string) => {
        const data = await createDepositPdfData(depositId)
        if (!data) return
        await printPdf(<DepositPdf data={data} />)
      }, [])
      const printReturn = useCallback(async (depositId: string) => {
        const data = await createReturnDepositPdfData(depositId)
        if (!data) return
        await printPdf(<ReturnDepositPdf data={data} />)
      }, [])
      const computeReturn = useCallback(
        async (depositId: string) => {
          await mutation.mutate(depositId)
        },
        [mutation],
      )
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
          <Button variant="ghost" size="icon" onClick={() => computeReturn(id)}>
            <HandCoinsIcon />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => printReturn(id)}>
            <ScanEyeIcon />
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
  const mutation = useComputeReturnMutation()
  const print = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    const depositsPdfData: DepositsPdfProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await createDepositPdfData(id)
      if (data) {
        depositsPdfData.push(data)
      }
    }

    await printPdf(<DepositsPdf data={depositsPdfData} />)
  }

  const printReturn = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    const pdfsData: ReturnDepositsPdfProps['data'] = []
    for (const id of selectedDepositIds) {
      const data = await createReturnDepositPdfData(id)
      if (data) {
        pdfsData.push(data)
      }
    }

    await printPdf(<ReturnDepositsPdf data={pdfsData} />)
  }

  const computeReturns = async () => {
    const selectedDepositIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.depositId)

    for (const id of selectedDepositIds) {
      await mutation.mutate(id)
    }
  }

  return (
    <div className="flex flex-row gap-3">
      <CustomButton onClick={computeReturns}>
        Lancer le calcul des retours
      </CustomButton>
      <CustomButton onClick={print}>Imprimer les fiches</CustomButton>
      <CustomButton onClick={printReturn}>
        Imprimer les fiches retour
      </CustomButton>
    </div>
  )
}

function DepositsSummary() {
  const articles = useLiveQuery(() => db.articles.toArray())
  const total =
    articles?.reduce((acc, article) => acc + parseInt(`${article.price}`), 0) ??
    0
  const count = articles?.length ?? 0

  return (
    <div className="flex flew-row gap-5 font-bold">
      <p>Nombre d'articles: {count}</p>
      <p>
        Montant total:{' '}
        <FormattedNumber value={total} style="currency" currency="EUR" />
      </p>
    </div>
  )
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useState } from 'react'
import { getYear } from '@/utils'
import {
  type DepositPdfProps,
  DepositsPdf,
  type DepositsPdfProps,
} from '@/pdf/deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { db } from '@/db.ts'

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

function RouteComponent() {
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Gérer les fiches des dépôts"
    >
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <DepositPrintingComponent />
      </div>
    </Page>
  )
}

async function createDepositPdfData(
  index: number,
): Promise<DepositPdfProps['data'] | undefined> {
  const year = getYear()
  const deposit = await db.deposits.where({ depositIndex: index }).first()
  if (!deposit) return undefined

  const articles = await db.articles.where({ depositId: deposit.id }).toArray()
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  return {
    deposit: {
      depositIndex: index,
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
      shortCode: article.depositIndex + ' ' + article.articleIndex,
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

function DepositPrintingComponent() {
  const [firstDepositIndex, setFirstDepositIndex] = useState<
    string | undefined
  >(undefined)
  const [secondDepositIndex, setSecondDepositIndex] = useState<
    string | undefined
  >(undefined)

  const print = async () => {
    const firstIndex = parseInt(firstDepositIndex ?? '0')
    const secondIndex = parseInt(secondDepositIndex ?? '0')
    if (isNaN(firstIndex) || isNaN(secondIndex)) return

    const depositsPdfData: DepositsPdfProps['data'] = []
    for (let index = firstIndex; index <= secondIndex; index++) {
      const data = await createDepositPdfData(index)
      if (data) {
        depositsPdfData.push(data)
      }
    }

    await printPdf(<DepositsPdf data={depositsPdfData} />)
  }

  return (
    <div className="flex flex-row items-baseline gap-3">
      <div className="flex justify-end">
        <Label>Imprimer les fiches</Label>
      </div>
      <div className="flex">
        <Input
          value={firstDepositIndex}
          onChange={(e) => setFirstDepositIndex(e.target.value)}
        />
      </div>
      <div className="flex justify-center">à</div>
      <div className="flex">
        <Input
          value={secondDepositIndex}
          onChange={(e) => setSecondDepositIndex(e.target.value)}
        />
      </div>
      <div className="flex">
        <CustomButton type="button" onClick={print}>
          Imprimer
        </CustomButton>
      </div>
    </div>
  )
}

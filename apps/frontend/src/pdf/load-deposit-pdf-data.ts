import { toDepositPdfData } from './deposit-pdf-data'
import type { DepositPdfProps } from './deposit-pdf'
import { db } from '@/db'
import { getYear, sortByIdentificationLetter } from '@/utils'

export async function loadDepositPdfData(
  depositId: string,
): Promise<DepositPdfProps['data'] | undefined> {
  const deposit = await db.deposits.get(depositId)
  if (!deposit) return undefined

  const articles = sortByIdentificationLetter(
    await db.articles.where({ depositId: deposit.id }).toArray(),
  )
  const contact = await db.contacts.get(deposit.sellerId)
  if (!contact) throw new Error('No contact found for deposit')

  return toDepositPdfData({
    deposit: {
      depositIndex: deposit.depositIndex,
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      type: deposit.type,
      year: getYear(),
    },
    contact: {
      lastName: contact.lastName,
      firstName: contact.firstName,
      city: contact.city,
      phoneNumber: contact.phoneNumber,
    },
    articles: articles.map((a) => ({
      depositIndex: a.depositIndex,
      identificationLetter: a.identificationLetter,
      category: a.category,
      brand: a.brand,
      model: a.model,
      discipline: a.discipline,
      size: a.size,
      price: a.price,
      color: a.color,
      isDeleted: a.status === 'DELETED',
    })),
  })
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Article, type Contact, db, type Deposit } from '@/db.ts'
import { Page } from '@/components/Page.tsx'
import { useEditDepot } from '@/hooks/useEditDepot.ts'
import { DepositForm } from '@/components/forms/DepositForm.tsx'
import { useMemo } from 'react'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import { shortArticleCode } from '@/utils'

export const Route = createFileRoute('/deposits/$depositId/edit')({
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
  const { depositId } = Route.useParams()
  const deposit = useLiveQuery(() => db.deposits.get(depositId))
  const contact = useLiveQuery(
    () => db.contacts.get(deposit?.sellerId ?? ''),
    [deposit],
  )
  const articles = useLiveQuery(
    () => db.articles.where({ depositId }).sortBy('articleIndex'),
    [depositId],
  )
  if (!deposit || !contact || !articles) return
  return (
    <Page
      navigation={
        <Link to={'/deposits/listing'}>Retour à la liste des dépôts</Link>
      }
      title={`Modifier la fiche n°${deposit.depositIndex}`}
    >
      <EditDepositComponent
        deposit={deposit}
        contact={contact}
        articles={articles}
      />
    </Page>
  )
}

type EditDepositComponentProps = {
  deposit: Deposit
  articles: Article[]
  contact: Contact
}
function EditDepositComponent(props: EditDepositComponentProps) {
  const { deposit, articles, contact } = props
  const mutation = useEditDepot()
  const formData: DepositFormType['deposit'] = useMemo(() => {
    return {
      id: deposit.id,
      depotIndex: deposit.depositIndex,
      sellerId: contact.id,
      lastName: contact.lastName,
      firstName: contact.firstName,
      phoneNumber: contact.phoneNumber,
      city: contact.city ?? '',
      contributionStatus: deposit.contributionStatus,
      contributionAmount: deposit.contributionAmount,
      articles: (articles.map((article) => ({
        id: article.id,
        articleCode: article.code,
        price: article.price,
        color: article.color,
        isDeleted: article.status === 'REFUSED',
        status: article.status,
        depotIndex: deposit.depositIndex,
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
          deposit.depositIndex,
          article.identificationLetter,
        ),
      })) ?? []) as DepositFormType['deposit']['articles'],
    }
  }, [deposit, contact, articles])
  return (
    <DepositForm
      depositIndex={deposit.depositIndex}
      formData={formData}
      mutation={mutation}
    />
  )
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { Page } from '@/components/Page.tsx'
import { useDepositsDb } from '@/hooks/useDepositsDb.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Combobox } from '@/components/Combobox.tsx'
import { useContactsDb } from '@/hooks/useContactsDb.ts'
import { type KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { db } from '@/db.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'

export const Route = createFileRoute('/deposits/pros')({
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

export function RouteComponent() {
  const [depositId, setDepositId] = useState<string | null>(null)
  return (
    <Page
      navigation={<Link to="..">Retour au menu</Link>}
      title="Réceptionner les articles des pros"
    >
      <div className="flex flex-col gap-5">
        <ProSearchForm onClick={setDepositId} />
        {depositId && <ProArticlesForm depositId={depositId} />}
      </div>
    </Page>
  )
}
type ProSearchFormProps = {
  onClick: (depositId: string | null) => void
}

function ProSearchForm(props: ProSearchFormProps) {
  const { onClick } = props
  const [value, setValue] = useState<string | null>(null)
  const depositsDb = useDepositsDb()
  const contactsDb = useContactsDb()
  const deposits = useLiveQuery(() => depositsDb.findProfessionals())
  const sellerIds = useMemo(
    () => deposits?.map((deposit) => deposit.sellerId) ?? [],
    [deposits],
  )
  const contacts = useLiveQuery(
    () => contactsDb.findByIds(sellerIds),
    [sellerIds],
  )
  const items = useMemo(() => {
    return (
      deposits
        ?.map((deposit) => {
          const contact = contacts?.find(
            (contact) => contact.id === deposit.sellerId,
          )
          if (!contact) return undefined
          return {
            label: `${deposit.depositIndex} - ${contact.firstName} ${contact.lastName}`,
            value: deposit.id,
            keywords: [
              contact.firstName,
              contact.lastName,
              `${deposit.depositIndex}`,
            ],
          }
        })
        .filter((item) => item !== undefined) ?? []
    )
  }, [deposits, contacts])

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          emptyLabel="Aucun dépôt professionel"
          items={items}
          value={value}
          onSelect={setValue}
          placeholder="Rechercher un professionel"
        />
      </div>
      <div>
        <Button
          className="col-span-2"
          type="button"
          variant="secondary"
          onClick={() => onClick(value)}
        >
          Rechercher
        </Button>
      </div>
    </div>
  )
}

type ProArticlesFormProps = {
  depositId: string
}

function ProArticlesForm(props: ProArticlesFormProps) {
  const { depositId } = props
  const [shouldDisplayArticles, setShouldDisplayArticles] = useState(false)
  return (
    <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
      <ReceiveArticleInput />
      <ReceivedArticleCount depositId={depositId} />
      <TotalArticleCount depositId={depositId} />
      <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
        <div className="col-span-2 text-right">Articles non réceptionnés</div>
        <div>
          <Button
            className="cursor-pointer"
            type="button"
            variant="secondary"
            onClick={() => setShouldDisplayArticles(!shouldDisplayArticles)}
          >
            {shouldDisplayArticles ? 'Masquer' : 'Consulter'}
          </Button>
        </div>
      </div>

      {shouldDisplayArticles && <ArticleList depositId={depositId} />}
    </div>
  )
}

function ReceiveArticleInput() {
  const [articleCode, setArticleCode] = useState('')
  const articlesDb = useArticlesDb()
  const checkKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        await addArticle()
      }
    },
    [articleCode, articlesDb],
  )

  const addArticle = useCallback(async () => {
    const article = await articlesDb.findByCode(articleCode.trim())
    if (!article) {
      toast.error(`Article ${articleCode} inconnu`)
      setArticleCode('')
      return
    }
    if (article.status === 'RECEPTION_OK') {
      toast.error(`Dépôt de l'article ${articleCode} déja effectué`)
      setArticleCode('')
      return
    }

    await articlesDb.markArticleAsReceived(article.id)
    toast.success(`Dépôt de l'article ${articleCode} effectué`)

    setArticleCode('')
  }, [articleCode, articlesDb])

  return (
    <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
      <div className="col-span-2 text-right">Scanner un article</div>
      <div>
        <Input
          type="text"
          name="articleCode"
          id="articleCode"
          value={articleCode}
          onChange={(e) => setArticleCode(e.target.value)}
          onKeyDown={checkKeyDown}
        />
      </div>
      <div>
        <Button className="cursor-pointer" type="button" onClick={addArticle}>
          Ajouter
        </Button>
      </div>
    </div>
  )
}

function ReceivedArticleCount(props: { depositId: string }) {
  const { depositId } = props
  const alreadyReceivedArticlesCount = useLiveQuery(
    () =>
      db.articles
        .where({ depositId })
        .and((deposit) => deposit.status !== 'RECEPTION_PENDING')
        .count(),
    [depositId],
  )
  return (
    <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
      <div className="col-span-2 text-right">Nombre d'articles scannés</div>
      <div>
        <Input
          type="text"
          readOnly
          value={alreadyReceivedArticlesCount ?? ''}
        />
      </div>
    </div>
  )
}

function TotalArticleCount(props: { depositId: string }) {
  const { depositId } = props
  const articlesTotalCount = useLiveQuery(
    () => db.articles.where({ depositId }).count(),
    [depositId],
  )
  return (
    <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
      <div className="col-span-2 text-right">Nombre d'articles totals</div>
      <div>
        <Input type="text" readOnly value={articlesTotalCount ?? ''} />
      </div>
    </div>
  )
}

type ArticleListProps = {
  depositId: string
}
function ArticleList(props: ArticleListProps) {
  const { depositId } = props
  const articles = useLiveQuery(
    () =>
      db.articles
        .where({ depositId, status: 'RECEPTION_PENDING' })
        .sortBy('articleIndex'),
    [depositId],
  )

  if (!articles) return

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Code</TableHead>
          <TableHead>Discipline</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Marque</TableHead>
          <TableHead>Descriptif</TableHead>
          <TableHead>Couleur</TableHead>
          <TableHead>Taille</TableHead>
          <TableHead className="text-right">Prix</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {articles.map((article) => (
          <TableRow key={article.id}>
            <TableCell className="font-medium">{article.code}</TableCell>
            <TableCell>{article.discipline}</TableCell>
            <TableCell>{article.category}</TableCell>
            <TableCell>{article.brand}</TableCell>
            <TableCell>{article.model}</TableCell>
            <TableCell>{article.color}</TableCell>
            <TableCell>{article.size}</TableCell>
            <TableCell className="text-right">{article.price}€</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

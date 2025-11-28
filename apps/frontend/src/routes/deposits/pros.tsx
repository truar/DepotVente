import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import PublicLayout from '@/components/PublicLayout'
import { useAuthStore } from '@/stores/authStore.ts'
import { Page } from '@/components/Page.tsx'
import { useDepotsDb } from '@/hooks/useDepotsDb.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Combobox } from '@/components/Combobox.tsx'
import { useContactsDb } from '@/hooks/useContactsDb.ts'
import { type KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { toast } from 'sonner'
import { db } from '@/db.ts'

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
      title="Réceptionner les pros"
    >
      <div className="flex flex-col gap-5">
        <ProSearchForm value={depositId} onSelect={setDepositId} />
        {depositId && <ProArticlesForm depositId={depositId} />}
      </div>
    </Page>
  )
}
type ProSearchFormProps = {
  value: string | null
  onSelect: (depositId: string) => void
}

function ProSearchForm(props: ProSearchFormProps) {
  const { value, onSelect } = props
  const depositsDb = useDepotsDb()
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
            label: `${contact.firstName} ${contact.lastName}`,
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
          onSelect={onSelect}
          placeholder="Rechercher un professionel"
        />
      </div>
    </div>
  )
}

type ProArticlesFormProps = {
  depositId: string
}

function ProArticlesForm(props: ProArticlesFormProps) {
  const { depositId } = props
  const articlesDb = useArticlesDb()
  const articles = useLiveQuery(
    () => articlesDb.findByDepositId(depositId),
    [depositId],
  )
  const alreadyReceivedArticlesCount =
    articles?.filter((article) => article.status === 'RECEPTION_OK').length ?? 0
  const [articleCode, setArticleCode] = useState('')
  const checkKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        await addArticle()
      }
    },
    [articleCode, articlesDb],
  )

  const [shouldDisplayArticles, setShouldDisplayArticles] = useState(false)

  const addArticle = useCallback(async () => {
    const article = await articlesDb.findByCode(articleCode)
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

    articlesDb.markArticleAsReceived(article.id)
    toast.success(`Dépôt de l'article ${articleCode} effectué`)

    setArticleCode('')
  }, [articleCode, articlesDb])

  return (
    <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
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
      <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
        <div className="col-span-2 text-right">Nombre d'articles scannés</div>
        <div>
          <Input type="text" readOnly value={alreadyReceivedArticlesCount} />
        </div>
      </div>
      <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
        <div className="col-span-2 text-right">Nombre d'articles totals</div>
        <div>
          <Input type="text" readOnly value={articles?.length} />
        </div>
      </div>
      <div className="grid grid-cols-5 w-6/12 gap-3 items-baseline">
        <div className="col-span-2 text-right">Articles non réceptionnés</div>
        <div>
          <Button
            className="cursor-pointer"
            type="button"
            variant="secondary"
            onClick={() => setShouldDisplayArticles(!shouldDisplayArticles)}
          >
            Consulter
          </Button>
        </div>
      </div>

      {shouldDisplayArticles && <ArticleList depositId={depositId} />}
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
      db.articles.where({ depositId, status: 'RECEPTION_PENDING' }).toArray(),
    [depositId],
  )

  if (!articles) return

  return (
    <ul>
      {articles.map((article) => (
        <li key={article.id}>{article.code}</li>
      ))}
    </ul>
  )
}

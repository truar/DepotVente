import { Link, createFileRoute } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Loader2 } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode } from 'react'
import type { LiveBalance } from '@/services/live-balance.ts'
import { requireAdmin } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { loadLiveBalance } from '@/services/live-balance.ts'
import { add } from '@/pdf/load-bilan-pdf-data.ts'
import { pdfDec, pdfEur, pdfInt, pdfPct } from '@/pdf/format.ts'

export const Route = createFileRoute('/reports/live')({
  beforeLoad: requireAdmin,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

const timeFmt = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
})

// Suivi de la bourse pendant la journée, sur le poste administrateur : les
// chiffres du bilan tels qu'il les imprimerait maintenant, mis à jour à
// chaque synchronisation, sans relancer le calcul des retours.
function RouteComponent() {
  const live = useLiveQuery(() => loadLiveBalance(), [])

  return (
    <Page
      navigation={<Link to="/reports">Retour aux rapports</Link>}
      title="Suivi en direct de la bourse"
    >
      {live ? (
        <LiveBalanceView live={live} />
      ) : (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        </div>
      )}
    </Page>
  )
}

function LiveBalanceView({ live }: { live: LiveBalance }) {
  const { deposits, sales, rights, collection } = live.balance
  const deferred = add(-collection.deferredGap)
  const totalCollected = add(
    collection.totalCards,
    collection.totalChecks,
    live.expectedCash,
    deferred,
  )

  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="text-right text-sm text-gray-600">
        {live.lastSale
          ? `Dernière vente reçue à ${timeFmt.format(new Date(live.lastSale.at))} · caisse ${live.lastSale.cashRegisterId}`
          : 'Aucune vente reçue'}
      </p>

      <div className="grid grid-cols-4 gap-4">
        <Tile
          title="Articles vendus"
          value={`${pdfInt(sales.soldArticlesCount)} / ${pdfInt(deposits.articlesCount)}`}
        >
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600"
              style={{
                width: `${Math.min(100, sales.soldArticlesRatio * 100)}%`,
              }}
            />
          </div>
          <p>{pdfPct(sales.soldArticlesRatio)}</p>
        </Tile>
        <Tile title="Montant des ventes" value={pdfEur(sales.totalAmount)}>
          <p>{pdfPct(sales.depositValueRatio)} de la valeur du dépôt</p>
        </Tile>
        <Tile title="Acheteurs" value={pdfInt(sales.buyersCount)}>
          <p>panier {pdfEur(sales.averageBasketAmount)}</p>
          <p>{pdfDec(sales.averageBasketArticles)} articles</p>
        </Tile>
        <Tile
          title="Recette bourse théorique"
          value={pdfEur(rights.theoreticalRevenue)}
        >
          <p>détail ci-dessous</p>
        </Tile>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Block title="Recette bourse théorique">
          <Line
            label="Droits CMR"
            note="10 % particulier / 15 % pro du vendu"
            value={pdfEur(rights.cmrRights)}
          />
          <Line
            label="Cotisations payées"
            value={pdfEur(rights.paidContributions)}
          />
          <Line
            label="Cotisations non payées"
            value={pdfEur(rights.unpaidContributions)}
          />
          <Line
            label="Achats CMR"
            value={
              rights.cmrPurchases > 0
                ? `− ${pdfEur(rights.cmrPurchases)}`
                : pdfEur(0)
            }
          />
          <Line
            total
            label="Recette bourse théorique"
            value={pdfEur(rights.theoreticalRevenue)}
          />
        </Block>
        <Block title="Encaissements">
          <Line label="Cartes" value={pdfEur(collection.totalCards)} />
          <Line label="Chèques" value={pdfEur(collection.totalChecks)} />
          <Line
            label="Espèces attendues"
            note="d'après les ventes, pas encore comptées en caisse"
            value={pdfEur(live.expectedCash)}
          />
          <Line label="Paiements différés" value={pdfEur(deferred)} />
          <Line total label="Total" value={pdfEur(totalCollected)} />
        </Block>
      </div>
    </div>
  )
}

function Tile(props: { title: string; value: string; children: ReactNode }) {
  const { title, value, children } = props
  return (
    <article
      aria-label={title}
      className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-lg"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        {children}
      </div>
    </article>
  )
}

function Block(props: { title: string; children: ReactNode }) {
  const { title, children } = props
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-lg"
    >
      <h3 id={id} className="mb-2 text-lg font-semibold text-gray-800">
        {title}
      </h3>
      <table className="w-full text-sm">
        <tbody>{children}</tbody>
      </table>
    </section>
  )
}

function Line(props: {
  label: string
  value: string
  note?: string
  total?: boolean
}) {
  const { label, value, note, total } = props
  return (
    <tr
      className={
        total
          ? 'border-t border-gray-300 font-semibold'
          : 'border-b border-gray-100'
      }
    >
      <th
        scope="row"
        className={`py-1.5 pr-2 text-left ${total ? 'font-semibold' : 'font-normal'}`}
      >
        <span>{label}</span>
        {note && (
          <span className="block text-xs font-normal text-gray-500">
            {note}
          </span>
        )}
      </th>
      <td className="whitespace-nowrap py-1.5 text-right font-mono">{value}</td>
    </tr>
  )
}

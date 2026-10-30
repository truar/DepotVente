import { Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { FormattedNumber } from 'react-intl'
import type { CashRegisterControl, StoredDate } from '@/db.ts'
import { Page } from '@/components/Page.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { db, toIsoString } from '@/db.ts'
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'
import { PRO_WORKSTATION } from '@/hooks/useWorkstation.ts'

// Les caisses sont numérotées de 1000 en 1000 : le numéro sert de départ à la
// numérotation des dépôts et des ventes. La liste est fixe, que la caisse ait
// servi ou non : sans contrôle enregistré, elle est « Manquant ».
const CASH_REGISTER_IDS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]

// Une caisse ajoutée entre deux milliers pour absorber l'affluence (6500 à
// côté de 6000) a son propre tiroir : elle rejoint la liste du comptoir où
// elle a travaillé, ou dès qu'elle y a été contrôlée. La caisse 1 des pros
// n'est pas un tiroir à compter.
async function cashRegisterIdsOf(type: CashRegisterControl['type']) {
  const worked = await workedCashRegisterIds(type)
  const counted = await db.cashRegisterControls
    .filter((control) => control.type === type)
    .toArray()
  const extra = [...worked, ...counted.map((c) => c.cashRegisterId)].filter(
    (id): id is number => id != null && id > 0 && id !== PRO_WORKSTATION,
  )
  return Array.from(new Set([...CASH_REGISTER_IDS, ...extra])).sort(
    (a, b) => a - b,
  )
}

// Ce qui compte dans le théorique de la caisse, comptoir par comptoir.
async function workedCashRegisterIds(
  type: CashRegisterControl['type'],
): Promise<Array<number | null | undefined>> {
  const live = <T extends { deletedAt?: unknown }>(row: T) =>
    row.deletedAt == null
  switch (type) {
    case 'DEPOSIT':
      return (await db.deposits.filter(live).toArray()).map(
        (deposit) => deposit.incrementStart,
      )
    case 'SALE': {
      const [sales, refunds] = await Promise.all([
        db.sales.filter(live).toArray(),
        db.refunds.filter(live).toArray(),
      ])
      return [...sales, ...refunds].map((row) => row.incrementStart)
    }
    case 'RETURN':
      return (
        await db.deposits
          .filter(
            (deposit) =>
              live(deposit) && deposit.contributionStatus === 'SOLDE',
          )
          .toArray()
      ).map((deposit) => deposit.contributionCollectWorkstationId)
  }
}

type DetailRoute =
  | '/deposits/cash-register-controls/$cashRegisterId'
  | '/sales/cash-register-controls/$cashRegisterId'
  | '/returns/cash-register-controls/$cashRegisterId'

export type CashRegisterControlsScreenProps = {
  type: CashRegisterControl['type']
  title: string
  detailRoute: DetailRoute
}

/**
 * Liste, pour l'administrateur, des contrôles d'un type (dépôt, vente ou
 * retour) sur toutes les caisses. Chaque caisse s'ouvre sur son écran de
 * contrôle, pour le consulter, le corriger ou le saisir s'il manque.
 */
export function CashRegisterControlsScreen(
  props: CashRegisterControlsScreenProps,
) {
  const { type, title, detailRoute } = props
  const cashRegisterControlsDb = useCashRegisterControlsDb()
  // Caisse par caisse, le contrôle que son écran ouvrira.
  const tills = useLiveQuery(
    async () =>
      Promise.all(
        (await cashRegisterIdsOf(type)).map(async (cashRegisterId) => ({
          cashRegisterId,
          control: await cashRegisterControlsDb.findByCashRegisterIdAndType(
            cashRegisterId,
            type,
          ),
        })),
      ),
    [type],
  )

  return (
    <Page navigation={<Link to="..">Retour au menu</Link>} title={title}>
      <div className="flex flex-col gap-6 bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caisse</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Compté</TableHead>
              <TableHead className="text-right">Écart</TableHead>
              <TableHead>Mis à jour</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Rien avant la lecture de la base : une caisse ne doit pas
                s'afficher « Manquant » le temps que son contrôle arrive. */}
            {tills?.map(({ cashRegisterId, control }) => {
              return (
                <TableRow key={cashRegisterId}>
                  <TableCell className="font-medium">
                    {cashRegisterId}
                  </TableCell>
                  <TableCell>
                    {control ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                        Fait
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-900">
                        Manquant
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {control ? (
                      <FormattedNumber
                        value={control.realCashAmount}
                        style="currency"
                        currency="EUR"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      control && control.difference !== 0
                        ? 'text-right font-medium text-red-600'
                        : 'text-right'
                    }
                  >
                    {control ? (
                      <FormattedNumber
                        value={control.difference}
                        style="currency"
                        currency="EUR"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {control ? formatUpdatedAt(control.updatedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={detailRoute}
                        params={{ cashRegisterId: String(cashRegisterId) }}
                        aria-label={`Ouvrir la caisse ${cashRegisterId}`}
                      >
                        Ouvrir
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Page>
  )
}

// « 10/10 18:42 » : la bourse dure deux jours, l'heure seule ne suffit pas.
function formatUpdatedAt(value: StoredDate) {
  const iso = toIsoString(value)
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

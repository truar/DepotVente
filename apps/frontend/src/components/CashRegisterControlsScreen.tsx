import { Link } from '@tanstack/react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { FormattedNumber } from 'react-intl'
import type {CashRegisterControl, StoredDate} from '@/db.ts';
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
import {   toIsoString } from '@/db.ts'
import { useCashRegisterControlsDb } from '@/hooks/useCashRegisterControlsDb.ts'

// Les caisses sont numérotées de 1000 en 1000 : le numéro sert de départ à la
// numérotation des dépôts et des ventes. La liste est fixe, que la caisse ait
// servi ou non : sans contrôle enregistré, elle est « Manquant ».
const CASH_REGISTER_IDS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]

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
  const controls = useLiveQuery(
    () =>
      Promise.all(
        CASH_REGISTER_IDS.map((cashRegisterId) =>
          cashRegisterControlsDb.findByCashRegisterIdAndType(
            cashRegisterId,
            type,
          ),
        ),
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
            {controls?.map((control, index) => {
              const cashRegisterId = CASH_REGISTER_IDS[index]
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

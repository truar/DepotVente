import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { db, type Workstation } from '@/db.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useContactsDb } from '@/hooks/useContactsDb.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import { FormattedNumber } from 'react-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'

export function numberToFrenchWords(num: number): string {
  if (num === 0) return 'zéro'

  const units = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
    'dix-sept',
    'dix-huit',
    'dix-neuf',
  ]

  const tens = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante', // 70s use base 60
    'quatre-vingt', // 80s
    'quatre-vingt', // 90s use base 80
  ]

  function convertLessThanHundred(n: number): string {
    if (n < 20) return units[n]

    const ten = Math.floor(n / 10)
    const unit = n % 10

    // 20-69
    if (n < 70) {
      const tensStr = tens[ten]
      if (unit === 0) return tensStr
      if (unit === 1) return `${tensStr} et un`
      return `${tensStr}-${units[unit]}`
    }

    // 70-79
    if (n < 80) {
      const tensStr = 'soixante'
      if (n === 71) return `${tensStr} et onze`
      // n - 60 gives 10-19, which maps correctly to dix...dix-neuf
      return `${tensStr}-${units[n - 60]}`
    }

    // 80-99
    const tensStr = 'quatre-vingt'
    if (n === 80) return `${tensStr}s` // Plural
    // 81-99 (Note: 81 is quatre-vingt-un, no 'et')
    // n - 80 gives 1-19
    return `${tensStr}-${units[n - 80]}`
  }

  function convertHundreds(n: number): string {
    const hundred = Math.floor(n / 100)
    const remainder = n % 100
    let result = ''

    if (hundred > 0) {
      if (hundred === 1) {
        result = 'cent'
      } else {
        result = `${units[hundred]} cent`
        if (remainder === 0) result += 's'
      }
    }

    if (remainder > 0) {
      if (result) result += ' '
      result += convertLessThanHundred(remainder)
    } else if (hundred === 0) {
      // Fallback for numbers < 100 called directly
      return convertLessThanHundred(n)
    }

    return result
  }

  // Thousands
  const thousand = Math.floor(num / 1000)
  const remainder = num % 1000
  let result = ''

  if (thousand > 0) {
    if (thousand === 1) {
      result = 'mille'
    } else {
      result = `${convertLessThanHundred(thousand)} mille`
    }
  }

  if (remainder > 0) {
    if (result) result += ' '
    result += convertHundreds(remainder)
  } else if (thousand === 0) {
    return convertHundreds(num)
  }

  return result
}

export const Route = createFileRoute('/returns/individuals')({
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
  const [workstation] = useWorkstation()
  if (!workstation || !workstation.incrementStart) return null
  return (
    <Page navigation={<Link to="..">Retour au menu</Link>} title="Retour">
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <IndividualReturnPage workstation={workstation} />
      </div>
    </Page>
  )
}

type IndividualReturnPageProps = {
  workstation: Workstation
}

const IndividualReturnForm = z.object({
  signatory: z.string(),
  workstation: z.coerce.number(),
  firstCheckId: z.coerce.number(),
})
type IndividualReturnFormType = z.infer<typeof IndividualReturnForm>
function IndividualReturnPage(props: IndividualReturnPageProps) {
  const { workstation } = props
  const methods = useForm<IndividualReturnFormType>({
    resolver: zodResolver(IndividualReturnForm),
    defaultValues: {
      workstation: workstation.incrementStart,
    },
  })
  const { control } = methods

  const [depositId, setDepositId] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Édition des chèques
        </h3>
        <div className="flex flew-row gap-3">
          <div>
            <Controller
              name="workstation"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldContent>
                    <Label>N° du poste</Label>
                    <InputGroup>
                      <InputGroupInput {...field} type="text" readOnly />
                    </InputGroup>
                  </FieldContent>
                </Field>
              )}
            />
          </div>
          <div>
            <Controller
              name="signatory"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldContent>
                    <Label>Édition chèque signé par</Label>
                    <InputGroup>
                      <InputGroupInput {...field} type="text" />
                    </InputGroup>
                  </FieldContent>
                </Field>
              )}
            />
          </div>
          <div>
            <Controller
              name="firstCheckId"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldContent>
                    <Label>N° de chèque</Label>
                    <InputGroup>
                      <InputGroupInput {...field} type="text" />
                    </InputGroup>
                  </FieldContent>
                </Field>
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <DepositSearchForm onClick={(id) => setDepositId(id)} />
        {depositId && <DepositData depositId={depositId} />}
      </div>
      <div>
        <ReturnedDepositSummary />
      </div>
    </div>
  )
}

type DepositSearchFormProps = {
  onClick: (depositId: string | null) => void
}

function DepositSearchForm(props: DepositSearchFormProps) {
  const { onClick } = props
  const [value, setValue] = useState<string | null>(null)
  const contactsDb = useContactsDb()
  const deposits = useLiveQuery(
    () => db.deposits.where({ type: 'PARTICULIER' }).sortBy('depositIndex'),
    [],
  )
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
          if (deposit.signatory || !contact) return undefined
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
          emptyLabel="Aucune fiche dépôt"
          items={items}
          value={value}
          onSelect={setValue}
          placeholder="Rechercher une fiche"
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
type DepositDataProps = { depositId: string }
function DepositData(props: DepositDataProps) {
  const { depositId } = props
  const deposit = useLiveQuery(() => db.deposits.get(depositId), [depositId])
  const contact = useLiveQuery(
    () => (deposit ? db.contacts.get(deposit?.sellerId) : undefined),
    [deposit],
  )
  if (!deposit || !contact) return

  const dueAmount = Math.round(totalAmount * 0.9)
  return (
    <Table className="max-w-1/2">
      <TableHeader>
        <TableRow>
          <TableHead>Fiche</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="text-right">Montant total</TableHead>
          <TableHead className="text-right">Montant due</TableHead>
          <TableHead>Montant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{deposit.depositIndex}</TableCell>
          <TableCell>
            {contact.lastName} {contact.firstName}
          </TableCell>
          <TableCell className="text-right">
            <FormattedNumber
              value={deposit.soldAmount}
              style="currency"
              currency="EUR"
            />
          </TableCell>
          <TableCell className="text-right">
            <FormattedNumber
              value={deposit.clubAmount}
              style="currency"
              currency="EUR"
            />
          </TableCell>
          <TableCell>{numberToFrenchWords(deposit.clubAmount)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

function ReturnedDepositSummary() {
  const allDeposits = useLiveQuery(
    () => db.deposits.where({ type: 'PARTICULIER' }).sortBy('depositIndex'),
    [],
  )
  const toBeTreated = useMemo(
    () => allDeposits?.filter((deposit) => !!deposit.soldAmount) ?? [],
    [allDeposits],
  )
  const returned = useMemo(
    () => allDeposits?.filter((deposit) => !!deposit.signatory) ?? [],
    [allDeposits],
  )
  if (!allDeposits) return
  return (
    <Table className="max-w-1/2">
      <TableHeader>
        <TableRow>
          <TableHead>Nombre de fiche à traiter</TableHead>
          <TableHead>Nombre de fiche traitées</TableHead>
          <TableHead>Reste à traiter</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{toBeTreated.length}</TableCell>
          <TableCell>{returned.length}</TableCell>
          <TableCell>{toBeTreated.length - returned.length}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

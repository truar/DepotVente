import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Page } from '@/components/Page.tsx'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { db, type Workstation } from '@/db.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Controller, type SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useMemo, useState } from 'react'
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
import { CustomButton } from '@/components/custom/Button.tsx'
import { numberToFrenchWords } from '@/utils'
import { printPdf } from '@/pdf/print.tsx'
import {
  SellerCheckPdf,
  type SellerCheckPdfProps,
} from '@/pdf/seller-check.tsx'
import { useReturnDepositMutation } from '@/hooks/useReturnDepositMutation.ts'
import {
  IndividualReturnForm,
  type IndividualReturnFormType,
} from '@/types/ReturnDepositForm.ts'

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

function IndividualReturnPage(props: IndividualReturnPageProps) {
  const mutation = useReturnDepositMutation()
  const { workstation } = props
  const methods = useForm<IndividualReturnFormType>({
    resolver: zodResolver(IndividualReturnForm),
    defaultValues: {
      workstation: workstation.incrementStart,
    },
  })
  const { control, handleSubmit, watch, setValue } = methods

  const depositId = watch('depositId')

  const printCheck = useCallback(async () => {
    if (!depositId) return
    const deposit = await db.deposits.get(depositId)
    if (!deposit) return
    const contact = await db.contacts.get(deposit.sellerId)
    if (!contact) return
    const data: SellerCheckPdfProps['data'] = {
      textualAmount: numberToFrenchWords(deposit.sellerAmount ?? 0),
      amount: deposit.sellerAmount ?? 0,
      city: 'Rumilly',
      seller: `${contact.firstName} ${contact.lastName}`,
      date: new Date(),
    }
    await printPdf(<SellerCheckPdf data={data} />)
  }, [depositId])

  const onSubmit: SubmitHandler<IndividualReturnFormType> = useCallback(
    async (formData) => {
      await mutation.mutate(formData)
      setValue('checkId', formData.checkId + 1)
      setValue('depositId', null)
    },
    [depositId],
  )
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                name="checkId"
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
          <div className="flex flex-row gap-5">
            <DepositSearchForm onClick={(id) => setValue('depositId', id)} />
          </div>
          {depositId && <DepositData depositId={depositId} />}
        </div>
        <div>
          <ReturnedDepositSummary />
        </div>
        {depositId && (
          <div className="flex flex-row justify-end gap-5">
            <div>
              <CustomButton
                type="button"
                onClick={printCheck}
                variant="outline"
              >
                Imprimer le chèque
              </CustomButton>
            </div>
            <div>
              <CustomButton type="submit">Valider</CustomButton>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}

type DepositSearchFormProps = {
  onClick: (depositId: string | null) => void
}

function DepositSearchForm(props: DepositSearchFormProps) {
  const { onClick } = props
  const [value, setValue] = useState<string | null>(null)
  const contactsDb = useContactsDb()
  const allDeposits = useLiveQuery(
    () => db.deposits.where({ type: 'PARTICULIER' }).sortBy('depositIndex'),
    [],
  )

  const toBeTreated = useMemo(
    () =>
      allDeposits?.filter(
        (deposit) =>
          !deposit.signatory &&
          !!deposit.soldAmount &&
          parseFloat(`${deposit.soldAmount}`) > 0,
      ) ?? [],
    [allDeposits],
  )
  const sellerIds = useMemo(
    () => toBeTreated?.map((deposit) => deposit.sellerId) ?? [],
    [toBeTreated],
  )
  const contacts = useLiveQuery(
    () => contactsDb.findByIds(sellerIds),
    [sellerIds],
  )
  const items = useMemo(() => {
    return (
      toBeTreated
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
  }, [toBeTreated, contacts])

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Fiche</TableHead>
          <TableHead className="w-[200px]">Nom</TableHead>
          <TableHead className="text-right w-[100px]">Montant total</TableHead>
          <TableHead className="text-right w-[100px]">Montant due</TableHead>
          <TableHead>Montant</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>{deposit.depositIndex}</TableCell>
          <TableCell>
            {contact.lastName} {contact.firstName}
          </TableCell>
          <TableCell className="text-right w-[100px]">
            <FormattedNumber
              value={deposit.soldAmount ?? 0}
              style="currency"
              currency="EUR"
            />
          </TableCell>
          <TableCell className="text-right w-[100px]">
            <FormattedNumber
              value={deposit.sellerAmount ?? 0}
              style="currency"
              currency="EUR"
            />
          </TableCell>
          <TableCell>
            {numberToFrenchWords(deposit.sellerAmount ?? 0)}
          </TableCell>
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
    () =>
      allDeposits?.filter(
        (deposit) =>
          !!deposit.soldAmount && parseFloat(`${deposit.soldAmount}`) > 0,
      ) ?? [],
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

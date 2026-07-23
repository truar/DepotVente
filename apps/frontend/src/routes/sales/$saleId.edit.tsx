import {
  createFileRoute,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { type KeyboardEvent, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cities } from '@/types/cities.ts'
import { getYear, shortArticleCode } from '@/utils'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'
import { Field, FieldContent, FieldError } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { Euro, RotateCcwIcon, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  type Article,
  type Contact,
  db,
  type Refund,
  type Sale,
} from '@/db.ts'
import { Page } from '@/components/Page.tsx'
import { type EditSaleFormType, EditSaleSchema } from '@/types/EditSaleForm.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import { useEditSale } from '@/hooks/useEditSale.ts'
import { InvoicePdf, type InvoicePdfProps } from '@/pdf/invoice-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { Button } from '@/components/ui/button.tsx'

export const Route = createFileRoute('/sales/$saleId/edit')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const { saleId } = Route.useParams()
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)

  const sale = useLiveQuery(() => db.sales.get(saleId))
  const contact = useLiveQuery(
    () => db.contacts.get(sale?.buyerId ?? ''),
    [sale],
  )
  const articles = useLiveQuery(
    () => db.articles.where({ saleId }).sortBy('code'),
    [saleId],
  )
  const refund = useLiveQuery(
    () => db.refunds.where({ saleId }).first(),
    [saleId],
  )
  if (!sale || !contact || !articles) return
  const activeRefund = refund && refund.deletedAt == null ? refund : null
  return (
    <>
      <Page
        navigation={
          <Link
            to={'/sales/listing'}
            onClick={(e) => {
              e.preventDefault()
              setBackOpen(true)
            }}
          >
            Retour à la liste des ventes
          </Link>
        }
        title={`Modifier la vente n°${sale.saleIndex}`}
      >
        <SaleForm
          sale={sale}
          buyer={contact}
          articles={articles}
          refund={activeRefund}
        />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title="Etes vous sur de vouloir quitter cette page ?"
        description="Les modifications non enregistrées seront perdues."
        onConfirm={() => navigate({ to: '/sales/listing' })}
      />
    </>
  )
}
type SaleFormProps = {
  sale: Sale
  articles: Article[]
  buyer: Contact
  refund: Refund | null
}
function SaleForm(props: SaleFormProps) {
  const { sale, articles, buyer, refund } = props
  const mutation = useEditSale()
  const navigate = useNavigate()
  const methods = useForm<EditSaleFormType>({
    resolver: typedZodResolver(EditSaleSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: sale.id,
      saleIndex: sale.saleIndex,
      checkAmount: sale.checkAmount,
      cashAmount: sale.cashAmount,
      cardAmount: sale.cardAmount,
      deferredAmount: sale.deferredAmount,
      refundCardAmount: refund?.cardAmount || 0,
      refundCashAmount: refund?.cashAmount || 0,
      refundComment: refund?.comment ?? '',
      buyer: {
        city: buyer.city,
        lastName: buyer.lastName,
        contactId: buyer.id,
        firstName: buyer.firstName,
        phoneNumber: buyer.phoneNumber,
      },
      articles: articles.map((article) => ({
        id: article.id,
        articleCode: article.code,
        year: article.year,
        depotIndex: article.depositIndex,
        identificationLetter: article.identificationLetter,
        articleIndex: article.articleIndex,
        shortArticleCode: shortArticleCode(
          article.depositIndex,
          article.identificationLetter,
        ),
        price: article.price,
        color: article.color,
        model: article.model,
        brand: article.brand,
        category: article.category,
        size: article.size,
        discipline: article.discipline,
      })),
    },
  })
  const { handleSubmit, setError, trigger, getValues, watch } = methods
  const watchedArticles = watch('articles')
  const hasArticles = (watchedArticles ?? []).some((a) => !a.isDeleted)
  const toNumber = (value: unknown) => {
    const n = typeof value === 'number' ? value : parseFloat(value as string)
    return Number.isNaN(n) ? 0 : n
  }
  const checkPaymentTotal = (data: EditSaleFormType) => {
    const totalPrice =
      data.articles?.reduce(
        (acc, cur) => acc + (cur.isDeleted ? 0 : toNumber(cur.price)),
        0,
      ) ?? 0
    const cashAmount = toNumber(data.cashAmount)
    const cardAmount = toNumber(data.cardAmount)
    const checkAmount = toNumber(data.checkAmount)
    const deferredAmount = toNumber(data.deferredAmount)
    const refundCardAmount = toNumber(data.refundCardAmount)
    const refundCashAmount = toNumber(data.refundCashAmount)
    if (
      totalPrice !==
      cashAmount +
        cardAmount +
        checkAmount +
        deferredAmount -
        (refundCardAmount + refundCashAmount)
    ) {
      setError('root.totalPrice', {
        type: 'value',
        message:
          'Les montants saisis sont incohérents. Vérifiez les règlements et remboursements.',
      })
      return false
    }
    return true
  }

  const onSubmit: SubmitHandler<EditSaleFormType> = async (data) => {
    if (!checkPaymentTotal(data)) return

    await mutation.mutate(data)
    toast.success(`Vente ${data.saleIndex} enregistré`)
    await navigate({ to: '/sales/listing' })
  }

  const onCancel = async () => {
    await navigate({ to: '/sales/listing' })
  }

  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  const print = useCallback(async () => {
    const valid = await trigger()
    if (!valid) {
      return
    }
    const formData = getValues()
    if (!checkPaymentTotal(formData)) return
    const year = getYear()
    const data: InvoicePdfProps['data'] = {
      sale: {
        saleIndex: formData.saleIndex,
        year,
        date: new Date(),
      },
      contact: {
        lastName: formData.buyer.lastName,
        firstName: formData.buyer.firstName,
        phoneNumber: formData.buyer.phoneNumber,
      },
      articles: formData.articles
        .filter((article) => !article.isDeleted)
        .map((article) => ({
          code: article.articleCode,
          category: article.category,
          brand: article.brand,
          model: article.model,
          discipline: article.discipline,
          price: article.price,
        })),
      payments: {
        cash: toNumber(formData.cashAmount) - toNumber(formData.refundCashAmount),
        card: toNumber(formData.cardAmount) - toNumber(formData.refundCardAmount),
        check: toNumber(formData.checkAmount),
      },
    }
    await printPdf(<InvoicePdf data={data} copy={1} />)
  }, [])

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={checkKeyDown}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <BuyerInformationForm />
          <ArticleForm />
          <PaymentForm />
          <RefundForm previousTotalRefund={sale.totalRefundAmount ?? 0} />
          <div className="flex justify-end gap-4">
            <ConfirmationDialog
              trigger={
                <Button type="button" variant="destructive">
                  Annuler
                </Button>
              }
              title="Etes vous sur de vouloir annuler ?"
              description="Les modifications non enregistrées seront perdues."
              onConfirm={onCancel}
            />
            <Button
              type="button"
              onClick={print}
              variant="secondary"
              disabled={!hasArticles}
            >
              Facture
            </Button>
            <Button type="submit">Valider</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function BuyerInformationForm() {
  const cityOptions = useMemo(() => {
    return cities.map((city) => <option key={city} value={city}></option>)
  }, [cities])
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Acheteur</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="buyer.lastName"
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="lastName">Nom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="lastName"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="buyer.firstName"
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="firstName">Prénom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="firstName"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="buyer.phoneNumber"
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="phoneNumber">Téléphone</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="phoneNumber"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                  {fieldState.invalid && fieldState.error?.message && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Controller
            name="buyer.city"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="city">Ville</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      list="city-list"
                      id="city"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    <datalist id="city-list">{cityOptions}</datalist>
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function ArticleForm() {
  const { watch, setValue } = useFormContext<EditSaleFormType>()

  const onRemove = useCallback((index: number) => {
    setValue(`articles.${index}.isDeleted`, true)
  }, [])

  const onAccept = useCallback((index: number) => {
    setValue(`articles.${index}.isDeleted`, false)
  }, [])

  const articles = watch('articles')
  if (!articles || articles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center text-gray-500">
        Aucun article dans cette vente.
      </div>
    )
  }
  const total = articles.reduce((acc, cur) => {
    acc += cur.isDeleted ? 0 : cur.price
    return acc
  }, 0)
  return (
    <>
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
          {articles.map((article, index) => (
            <TableRow
              key={article.id}
              className={
                article.isDeleted ? 'bg-gray-100 opacity-60' : ''
              }
            >
              <TableCell className="font-medium">
                {article.articleCode}
              </TableCell>
              <TableCell>{article.discipline}</TableCell>
              <TableCell>{article.category}</TableCell>
              <TableCell>{article.brand}</TableCell>
              <TableCell>{article.model}</TableCell>
              <TableCell>{article.color}</TableCell>
              <TableCell>{article.size}</TableCell>
              <TableCell className="text-right">{article.price}€</TableCell>
              <TableCell className="text-center">
                {article.isDeleted ? (
                  <button
                    type="button"
                    onClick={() => onAccept(index)}
                    className="p-2 text-green-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcwIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-row justify-end">
        <div className="flex flex-row gap-5 items-baseline font-bold">
          <div>
            Nombre d'articles :{' '}
            {articles.filter((a) => !a.isDeleted).length}
          </div>
          <div>Montant total : {total}€</div>
        </div>
      </div>
    </>
  )
}

function PaymentForm() {
  return (
    <div className="flex flex-col gap-3">
      <Controller
        name="root.totalPrice"
        render={({ fieldState }) => <FieldError errors={[fieldState.error]} />}
      />
      <h3 className="text-2xl font-bold">Règlements</h3>
      <div className="grid grid-cols-6 gap-6 align-baseline">
        <Controller
          name="cardAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="cardAmount">Montant CB</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="cardAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          name="checkAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="checkAmount">Montant chèque</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="checkAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          name="deferredAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="deferredAmount">Montant différé</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="deferredAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          name="cashAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="cashAmount">Montant espèces</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="cashAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </div>
    </div>
  )
}

function RefundForm({ previousTotalRefund }: { previousTotalRefund: number }) {
  const { watch } = useFormContext<EditSaleFormType>()
  const articles = watch('articles')
  const newRefundDelta = (articles ?? []).reduce((acc, cur) => {
    acc += cur.isDeleted ? cur.price : 0
    return acc
  }, 0)
  const totalRefund = previousTotalRefund + newRefundDelta
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Remboursement</h3>
      <div className="grid grid-cols-6 gap-6 align-baseline">
        <Field>
          <FieldContent>
            <Label>Montant à rembourser</Label>
            <InputGroup>
              <InputGroupInput
                id="checkAmount"
                type="text"
                value={totalRefund}
              />
              <InputGroupAddon align="inline-end">
                <Euro />
              </InputGroupAddon>
            </InputGroup>
          </FieldContent>
        </Field>
        <Controller
          name="refundCardAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="refundCardAmount">Remboursement CB</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="refundCardAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          name="refundCashAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <Label htmlFor="refundCashAmount">Remboursement espèce</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="refundCashAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
                    autoComplete="off"
                  />
                  <InputGroupAddon align="inline-end">
                    <Euro />
                  </InputGroupAddon>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
        <Controller
          name="refundComment"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="col-span-2">
              <FieldContent>
                <Label htmlFor="refundComment">Commentaire</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="refundComment"
                    aria-invalid={fieldState.invalid}
                    type="text"
                  />
                </InputGroup>
                {fieldState.invalid && fieldState.error?.message && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </FieldContent>
            </Field>
          )}
        />
      </div>
    </div>
  )
}

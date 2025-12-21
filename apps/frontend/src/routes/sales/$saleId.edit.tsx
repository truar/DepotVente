import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type KeyboardEvent, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { cities } from '@/types/cities.ts'
import { getYear, shortArticleCode } from '@/utils'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Field, FieldContent, FieldError } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { Euro, RotateCcwIcon, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Article, type Contact, db, type Sale } from '@/db.ts'
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
  const { saleId } = Route.useParams()

  const sale = useLiveQuery(() => db.sales.get(saleId))
  const contact = useLiveQuery(
    () => db.contacts.get(sale?.buyerId ?? ''),
    [sale],
  )
  const articles = useLiveQuery(
    () => db.articles.where({ saleId }).sortBy('code'),
    [saleId],
  )
  if (!sale || !contact || !articles) return
  return (
    <Page
      navigation={
        <Link to={'/sales/listing'}>Retour à la liste des ventes</Link>
      }
      title={`Modifier la vente n°${sale.saleIndex}`}
    >
      <SaleForm sale={sale} buyer={contact} articles={articles} />
    </Page>
  )
}
type SaleFormProps = {
  sale: Sale
  articles: Article[]
  buyer: Contact
}
function SaleForm(props: SaleFormProps) {
  const { sale, articles, buyer } = props
  const mutation = useEditSale()
  const methods = useForm<EditSaleFormType>({
    resolver: zodResolver(EditSaleSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: sale.id,
      saleIndex: sale.saleIndex,
      checkAmount: sale.checkAmount,
      cashAmount: sale.cashAmount,
      cardAmount: sale.cardAmount,
      refundCardAmount: sale.refundCardAmount || 0,
      refundCashAmount: sale.refundCashAmount || 0,
      refundComment: sale.refundComment,
      city: buyer.city,
      lastName: buyer.lastName,
      contactId: buyer.id,
      firstName: buyer.firstName,
      phoneNumber: buyer.phoneNumber,
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
  const { handleSubmit, reset, setError, trigger, getValues } = methods
  const onSubmit: SubmitHandler<EditSaleFormType> = async (data) => {
    const articles = data.articles
    const totalPrice =
      articles?.reduce(
        (acc, cur) => acc + parseInt(`${!cur.isDeleted ? cur.price : 0}`),
        0,
      ) ?? 0
    const cashAmount = data.cashAmount ?? 0
    const cardAmount = data.cardAmount ?? 0
    const checkAmount = data.checkAmount ?? 0
    const refundCardAmount = data.refundCardAmount ?? 0
    const refundCashAmount = data.refundCashAmount ?? 0

    if (
      totalPrice !==
      cashAmount +
        cardAmount +
        checkAmount -
        (refundCardAmount + refundCashAmount)
    ) {
      setError('root.totalPrice', {
        type: 'value',
        message:
          'Merci de vérifier que le montant total et le montant de remboursement soient couverts par tous les modes de paiement',
      })
      return
    }

    await mutation.mutate(data)
    toast.success(`Vente ${data.saleIndex} enregistré`)
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
    const year = getYear()
    const data: InvoicePdfProps['data'] = {
      sale: {
        saleIndex: formData.saleIndex,
        year,
        date: new Date(),
      },
      contact: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        phoneNumber: formData.phoneNumber,
      },
      articles: formData.articles.map((article) => ({
        code: article.articleCode,
        category: article.category,
        brand: article.brand,
        model: article.model,
        discipline: article.discipline,
        price: article.price,
      })),
    }
    await printPdf(<InvoicePdf data={data} copy={2} />)
  }, [])

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={checkKeyDown}
        className="flex flex-col gap-4"
      >
        <ErrorMessages />

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <BuyerInformationForm />
          <ArticleForm />
          <PaymentForm />
          <RefundForm />
          <div className="flex justify-end gap-4">
            <CustomButton
              type="button"
              onClick={() => reset()}
              variant="destructive"
            >
              Annuler les modifications
            </CustomButton>
            <Button type="button" onClick={print} variant="secondary">
              Facture
            </Button>
            <SubmitButton />
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
            name="lastName"
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
            name="firstName"
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
            name="phoneNumber"
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
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Controller
            name="city"
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

function SubmitButton() {
  const { formState } = useFormContext<EditSaleFormType>()
  const { isSubmitting } = formState

  return (
    <CustomButton type="submit" loading={isSubmitting}>
      Valider et enregistrer la vente
    </CustomButton>
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
  if (!articles || articles.length === 0) return null
  const total = articles.reduce((acc, cur) => {
    acc += parseInt(`${cur.isDeleted ? 0 : cur.price}`)
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
              className={`${article.isDeleted ? 'line-through' : ''}`}
            >
              <TableCell className="font-medium">
                {article.shortArticleCode}
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
          <div>Nombre d'articles : {articles.length}</div>
          <div>Montant droit de dépôt : {total}€</div>
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
                <Label htmlFor="cashAmount">Montant espèce</Label>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="cashAmount"
                    aria-invalid={fieldState.invalid}
                    type="text"
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

function RefundForm() {
  const { watch } = useFormContext<EditSaleFormType>()
  const articles = watch('articles')
  if (!articles || articles.length === 0) return null
  const totalRefund = articles.reduce((acc, cur) => {
    acc += parseInt(`${cur.isDeleted ? cur.price : 0}`)
    return acc
  }, 0)
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Remboursement</h3>
      <Controller
        name="root.incorretRefund"
        render={({ fieldState }) => <FieldError errors={[fieldState.error]} />}
      />
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
              </FieldContent>
            </Field>
          )}
        />
      </div>
    </div>
  )
}

function ErrorMessages() {
  const {
    formState: { errors },
  } = useFormContext<EditSaleFormType>()

  console.log(errors)

  const errorsDisplayed = Object.keys(errors).map((key, index) => {
    if (typeof errors[key]?.message === 'string') {
      return <li key={index}>{errors[key]?.message}</li>
    }
    return null
  })
  if (errorsDisplayed.length === 0) return null
  return (
    <ul className="pl-3 text-red-600">
      Merci de compléter les champs obligatoires
    </ul>
  )
}

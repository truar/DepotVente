import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requireAuthAndWorkstation } from '@/lib/route-guards'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSalesDb } from '@/hooks/useSalesDb.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import {
  createContext,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useContactsDb } from '@/hooks/useContactsDb.ts'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { cities } from '@/types/cities.ts'
import { SaleFormSchema, type SaleFormType } from '@/types/saleForm.ts'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { Input } from '@/components/ui/input.tsx'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Euro, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { showErrorAlert } from '@/stores/errorAlertStore'
import { useCreateSale } from '@/hooks/useCreateSale.ts'
import { getYear, shortArticleCode } from '@/utils'
import { printPdf } from '@/pdf/print.tsx'
import { InvoicePdf, type InvoicePdfProps } from '@/pdf/invoice-pdf.tsx'
import { TextField } from '@/components/custom/input/TextField.tsx'
import { DataListField } from '@/components/custom/input/DataListField.tsx'
import { ConfirmationDialog } from '@/components/custom/ConfirmationDialog.tsx'

export const Route = createFileRoute('/sales/add')({
  beforeLoad: requireAuthAndWorkstation,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function toNumber(value: unknown) {
  const n = typeof value === 'number' ? value : parseFloat(value as string)
  return Number.isNaN(n) ? 0 : n
}

const ArticleCodeFocusContext =
  createContext<RefObject<HTMLInputElement | null> | null>(null)

function RouteComponent() {
  const salesDb = useSalesDb()
  const [workstation] = useWorkstation()
  const navigate = useNavigate()
  const [backOpen, setBackOpen] = useState(false)
  const currentSaleCount = useLiveQuery(
    () => salesDb.count(workstation),
    [workstation],
  )

  if (currentSaleCount == null) return null
  const saleCurrentIndex = workstation.incrementStart + currentSaleCount + 1
  return (
    <>
      <Page
        navigation={
          <Link
            to={'..'}
            onClick={(e) => {
              e.preventDefault()
              setBackOpen(true)
            }}
          >
            Retour au menu
          </Link>
        }
        title="Faire une vente"
      >
        <SalesForm saleIndex={saleCurrentIndex} />
      </Page>
      <ConfirmationDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        title="Etes vous sur de vouloir quitter cette page ?"
        description="Les données non enregistrées seront perdues."
        onConfirm={() => navigate({ to: '..' })}
      />
    </>
  )
}

type SalesFormProps = {
  saleIndex: number
}

function SalesForm(props: SalesFormProps) {
  const { saleIndex } = props
  const methods = useForm<SaleFormType>({
    resolver: typedZodResolver(SaleFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      buyer: {
        contactId: null,
        lastName: '',
        firstName: '',
        phoneNumber: '',
        city: '',
      },
      articles: [],
      cashAmount: 0,
      cardAmount: 0,
      checkAmount: 0,
      deferredAmount: 0,
    },
  })
  const { setValue, handleSubmit, reset, setError, trigger, getValues } =
    methods
  const articleCodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('saleIndex', saleIndex)
  }, [saleIndex])

  const checkPaymentTotal = (data: SaleFormType) => {
    const totalPrice =
      data.articles?.reduce((acc, cur) => acc + toNumber(cur.price), 0) ?? 0
    const cashAmount = toNumber(data.cashAmount)
    const cardAmount = toNumber(data.cardAmount)
    const checkAmount = toNumber(data.checkAmount)
    const deferredAmount = toNumber(data.deferredAmount)
    if (totalPrice !== cashAmount + cardAmount + checkAmount + deferredAmount) {
      setError('root.totalPrice', {
        type: 'value',
        message: `Merci de vérifier que le montant total est couvert par les 4 modes de règlements.`,
      })
      return false
    }
    return true
  }

  const createSaleMutation = useCreateSale()
  const onSubmit: SubmitHandler<SaleFormType> = async (data) => {
    if (!checkPaymentTotal(data)) return

    await createSaleMutation.mutate(data)
    reset()
    toast.success(`Vente ${saleIndex} enregistrée`)
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
      articles: formData.articles.map((article) => ({
        code: article.articleCode,
        category: article.category,
        brand: article.brand,
        model: article.model,
        discipline: article.discipline,
        price: article.price,
      })),
      payments: {
        cash: toNumber(formData.cashAmount),
        card: toNumber(formData.cardAmount),
        check: toNumber(formData.checkAmount),
      },
    }
    await printPdf(<InvoicePdf data={data} copy={1} />)
  }, [])

  return (
    <FormProvider {...methods}>
      <ArticleCodeFocusContext.Provider value={articleCodeRef}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={checkKeyDown}
          className="flex flex-col gap-4"
        >
          <ContactSearchForm />

          <ErrorMessages />

          <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
            <BuyerInformationForm />
            <SaleArticlesForm />
            <PaymentForm />
            <div className="flex justify-end gap-4">
              <ConfirmationDialog
                trigger={
                  <Button type="button" variant="destructive">
                    Annuler
                  </Button>
                }
                title="Etes vous sur de vouloir annuler ?"
                description="Cette action va réinitialiser le formulaire. Les données non enregistrées seront perdues."
                onConfirm={() => {
                  reset()
                  setValue('saleIndex', saleIndex)
                }}
              />
              <Button type="button" onClick={print} variant="secondary">
                Facture
              </Button>
              <Button type="submit">Valider et enregistrer la vente</Button>
            </div>
          </div>
        </form>
      </ArticleCodeFocusContext.Provider>
    </FormProvider>
  )
}

function ContactSearchForm() {
  const { setValue, watch } = useFormContext<SaleFormType>()
  const articleCodeRef = useContext(ArticleCodeFocusContext)
  const contactsDb = useContactsDb()
  const contacts = useLiveQuery(() => contactsDb.getAll())
  const contactItems = useMemo(
    () =>
      (contacts ?? [])
        .slice()
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName, 'fr') ||
            a.firstName.localeCompare(b.firstName, 'fr'),
        )
        .map((contact) => ({
          label: `${contact.lastName} ${contact.firstName}`,
          value: contact.id,
          keywords: [contact.lastName, contact.firstName],
        })),
    [contacts],
  )

  const [contactId, setContactId] = useState<string | null>(null)
  const formContactId = watch('buyer.contactId')
  useEffect(() => {
    if (formContactId == null) setContactId(null)
  }, [formContactId])
  const prefillBuyerInformation = useCallback(async () => {
    if (!contactId) return
    const contact = await contactsDb.findById(contactId)
    if (!contact) return
    setValue('buyer.contactId', contact.id)
    setValue('buyer.lastName', contact.lastName)
    setValue('buyer.firstName', contact.firstName)
    setValue('buyer.phoneNumber', contact.phoneNumber)
    setValue('buyer.city', contact.city)
    articleCodeRef?.current?.focus()
  }, [setValue, contactId, contactsDb, articleCodeRef])

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          items={contactItems}
          value={contactId}
          onSelect={setContactId}
          placeholder="Rechercher un nom"
        />
      </div>
      <Button
        className="col-span-2"
        type="button"
        variant="secondary"
        onClick={prefillBuyerInformation}
      >
        Valider
      </Button>
    </div>
  )
}

function BuyerInformationForm() {
  const { setValue, watch, getFieldState } = useFormContext<SaleFormType>()
  const buyer = watch('buyer')
  useEffect(() => {
    const state = getFieldState('buyer')
    if (state.isDirty) {
      setValue('buyer.contactId', null)
    }
  }, [
    buyer.lastName,
    buyer.firstName,
    buyer.phoneNumber,
    buyer.city,
    setValue,
    getFieldState,
  ])

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Acheteur</h3>
      <div className="grid grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="buyer.lastName"
            render={({ field, fieldState }) => (
              <TextField invalid={fieldState.invalid} {...field} label="Nom" />
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="buyer.firstName"
            render={({ field, fieldState }) => (
              <TextField
                invalid={fieldState.invalid}
                {...field}
                label="Prénom"
              />
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="buyer.phoneNumber"
            render={({ field, fieldState }) => (
              <TextField
                invalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                {...field}
                label="Téléphone"
              />
            )}
          />
        </div>
        <div className="grid gap-2">
          <Controller
            name="buyer.city"
            render={({ field, fieldState }) => (
              <DataListField
                invalid={fieldState.invalid}
                {...field}
                items={cities}
                label="Ville"
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}
function SaleArticlesForm() {
  const { getValues, watch } = useFormContext<SaleFormType>()
  const articleCodeRef = useContext(ArticleCodeFocusContext)
  const { append } = useFieldArray<SaleFormType>({
    name: 'articles',
  })
  const articlesDb = useArticlesDb()
  const [articleCode, setArticleCode] = useState('')
  const checkKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        await addArticle()
      }
    },
    [articleCode, articlesDb],
  )

  const saleIndex = watch('saleIndex')

  const addArticle = useCallback(async () => {
    const article = await articlesDb.findByCode(articleCode)
    if (!article) {
      showErrorAlert(`Article ${articleCode} inconnu`)
      setArticleCode('')
      return
    }
    if (article.saleId) {
      showErrorAlert(`Article ${articleCode} déja vendu`)
      setArticleCode('')
      return
    }
    // Seul un article effectivement réceptionné au dépôt peut être vendu.
    if (article.status !== 'RECEPTION_OK') {
      const reason: Record<
        Exclude<typeof article.status, 'RECEPTION_OK'>,
        { title: string; description: string }
      > = {
        RECEPTION_PENDING: {
          title: 'Article non réceptionné',
          description: `L'article ${articleCode} n'a pas été réceptionné au dépôt : il ne peut pas être vendu. Faites-le réceptionner avant de l'encaisser.`,
        },
        DELETED: {
          title: 'Article invendable',
          description: `Article ${articleCode} invendable, contactez l'administrateur`,
        },
        RETURNED: {
          title: 'Article restitué',
          description: `L'article ${articleCode} a été restitué à son déposant : il ne peut pas être vendu.`,
        },
        SOLD: {
          title: 'Article déjà vendu',
          description: `L'article ${articleCode} a déjà été vendu.`,
        },
      }
      const { title, description } = reason[article.status]
      showErrorAlert(description, { title })
      setArticleCode('')
      return
    }

    const articles = getValues('articles')
    if (!articles?.some(({ id }) => id === article.id)) {
      append({
        id: article.id,
        articleCode: article.code,
        shortArticleCode: shortArticleCode(
          article.depositIndex,
          article.identificationLetter,
        ),
        discipline: article.discipline,
        category: article.category,
        brand: article.brand,
        model: article.model,
        color: article.color,
        size: article.size,
        price: article.price,
      })
    }
    setArticleCode('')
  }, [articleCode, articlesDb, getValues])

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Articles</h3>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-8 gap-6 items-baseline">
          <div>Vente: {saleIndex}</div>
          <div className="flex flex-row col-span-4 gap-3 items-baseline">
            <div>
              <Label htmlFor="articleCode">Scanner un article</Label>
            </div>
            <div>
              <Input
                ref={articleCodeRef}
                type="text"
                name="articleCode"
                id="articleCode"
                value={articleCode}
                onChange={(e) => setArticleCode(e.target.value)}
                onKeyDown={checkKeyDown}
              />
            </div>
            <div>
              <Button type="button" onClick={addArticle}>
                Ajouter
              </Button>
            </div>
          </div>
        </div>
        <ScannedArticles />
      </div>
    </div>
  )
}

function ScannedArticles() {
  const { watch } = useFormContext<SaleFormType>()
  const { remove } = useFieldArray<SaleFormType>({
    name: 'articles',
  })

  const onRemove = useCallback(
    (index: number) => {
      remove(index)
    },
    [remove],
  )

  const articles = watch('articles')
  if (!articles || articles.length === 0) return null
  const total = articles.reduce((acc, cur) => {
    acc += cur.price
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
            <TableRow key={article.id}>
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
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-row justify-end">
        <div className="flex flex-row gap-5 items-baseline font-bold">
          <div>Nombre d'articles : {articles.length}</div>
          <div>Montant total : {total}€</div>
        </div>
      </div>
    </>
  )
}

function PaymentForm() {
  const {
    watch,
    formState: { errors, isSubmitSuccessful },
  } = useFormContext<SaleFormType>()
  const totalPriceError = errors.root?.totalPrice?.message
  const [cashReceived, setCashReceived] = useState<string>('')
  useEffect(() => {
    if (isSubmitSuccessful) setCashReceived('')
  }, [isSubmitSuccessful])
  const cashAmount = watch('cashAmount')
  const cardAmount = watch('cardAmount')
  const checkAmount = watch('checkAmount')
  const deferredAmount = watch('deferredAmount')
  const totalPayment =
    toNumber(cashAmount) +
    toNumber(cardAmount) +
    toNumber(checkAmount) +
    toNumber(deferredAmount)
  const cashReceivedNumber = parseFloat(cashReceived)
  let cashReturned = Math.max(0, cashReceivedNumber - toNumber(cashAmount))
  if (Number.isNaN(cashReturned)) {
    cashReturned = 0
  }
  const cashReceivedInvalid =
    cashReceived !== '' &&
    !Number.isNaN(cashReceivedNumber) &&
    toNumber(cashAmount) > cashReceivedNumber
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Règlements</h3>
      {totalPriceError && (
        <p className="text-red-600">{totalPriceError}</p>
      )}
      <div className="grid grid-cols-8 gap-6 align-baseline">
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
        <Field data-invalid={cashReceivedInvalid}>
          <FieldContent>
            <Label htmlFor="cashReceived">Espèces reçues</Label>
            <InputGroup>
              <InputGroupInput
                id="cashReceived"
                aria-invalid={cashReceivedInvalid}
                type="text"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                autoComplete="off"
              />
              <InputGroupAddon align="inline-end">
                <Euro />
              </InputGroupAddon>
            </InputGroup>
          </FieldContent>
        </Field>
        <Field>
          <FieldContent>
            <Label>Monnaie rendue</Label>
            <InputGroup>
              <InputGroupInput
                id="cashReceived"
                type="text"
                value={cashReturned}
                readOnly
                autoComplete="off"
              />
              <InputGroupAddon align="inline-end">
                <Euro />
              </InputGroupAddon>
            </InputGroup>
          </FieldContent>
        </Field>
      </div>
      <div className="font-bold">Total règlement : {totalPayment}€</div>
    </div>
  )
}

function collectErrorMessages(node: unknown): string[] {
  if (!node || typeof node !== 'object') return []
  const record = node as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.length > 0) {
    return [record.message]
  }
  return Object.values(record).flatMap(collectErrorMessages)
}

function ErrorMessages() {
  const {
    formState: { errors },
  } = useFormContext()

  const { root: _root, ...fieldErrors } = errors
  const messages = collectErrorMessages(fieldErrors)
  if (messages.length === 0) return null
  return (
    <ul className="pl-5 text-red-600 list-disc">
      {messages.map((message, index) => (
        <li key={index}>{message}</li>
      ))}
    </ul>
  )
}

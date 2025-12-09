import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
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
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useContactsDb } from '@/hooks/useContactsDb.ts'
import { Field, FieldContent, FieldError } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group.tsx'
import { citiesItems } from '@/types/cities.ts'
import { SaleFormSchema, type SaleFormType } from '@/types/saleForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input.tsx'
import { useArticlesDb } from '@/hooks/useArticlesDb.ts'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Euro, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateSale } from '@/hooks/useCreateSale.ts'

export const Route = createFileRoute('/sales/add')({
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
  const salesDb = useSalesDb()
  const [workstation] = useWorkstation()
  const [currentSaleCount, setCurrentSaleCount] = useState<number | null>(null)
  useEffect(() => {
    async function getCount() {
      if (workstation.incrementStart > 0) {
        const count = await salesDb.count(workstation)
        setCurrentSaleCount(count)
      }
    }
    getCount()
  }, [workstation, setCurrentSaleCount])

  if (currentSaleCount === null) return null
  const saleCurrentIndex = workstation.incrementStart + currentSaleCount + 1
  return (
    <Page navigation={<Link to={'..'}>Retour</Link>} title="Faire une vente">
      <SalesForm saleIndex={saleCurrentIndex} />
    </Page>
  )
}

type SalesFormProps = {
  saleIndex: number
}

function SalesForm(props: SalesFormProps) {
  const { saleIndex } = props
  const methods = useForm<SaleFormType>({
    resolver: zodResolver(SaleFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      saleIndex,
      contactId: null,
      lastName: '',
      firstName: '',
      phoneNumber: '',
      city: '',
      articles: [],
      cashAmount: 0,
      cardAmount: 0,
      checkAmount: 0,
    },
  })
  const { handleSubmit, reset, setError } = methods
  const createSaleMutation = useCreateSale()
  const onSubmit: SubmitHandler<SaleFormType> = async (data) => {
    const articles = data.articles
    const totalPrice =
      articles?.reduce((acc, cur) => acc + parseInt(`${cur.price}`), 0) ?? 0
    const cashAmount = data.cashAmount ?? 0
    const cardAmount = data.cardAmount ?? 0
    const checkAmount = data.checkAmount ?? 0

    if (totalPrice !== cashAmount + cardAmount + checkAmount) {
      setError('root.totalPrice', {
        type: 'value',
        message: `Merci de vérifier que le montant total est couvert par les 3 modes de règlements.`,
      })
      return
    }

    await createSaleMutation.mutate(data)
    reset()
    toast.success(`Vente ${saleIndex} enregistrée`)
  }

  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={checkKeyDown}
        className="flex flex-col gap-4"
      >
        <ContactSearchForm />

        <ErrorMessages />

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <BuyerInformationForm />
          <SaleArticlesForm saleIndex={saleIndex} />
          <PaymentForm />
          <div className="flex justify-end gap-4">
            <Button type="button" onClick={() => reset()} variant="destructive">
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => console.log('printing...')}
              variant="secondary"
            >
              Facture
            </Button>
            <Button type="submit">Valider et enregistrer la vente</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function ContactSearchForm() {
  const { setValue, watch } = useFormContext()
  const contactsDb = useContactsDb()
  const contacts = useLiveQuery(() => contactsDb.getAll())
  const contactItems = useMemo(
    () =>
      (contacts ?? []).map((contact) => ({
        label: `${contact.firstName} ${contact.lastName}`,
        value: contact.id,
        keywords: [contact.firstName, contact.lastName],
      })),
    [contacts],
  )
  const formContactId = watch('contactId')
  useEffect(() => {
    setContactId(formContactId)
  }, [formContactId])
  const [contactId, setContactId] = useState<string | null>(formContactId)
  const prefillBuyerInformation = useCallback(async () => {
    if (!contactId) return
    const contact = await contactsDb.findById(contactId)
    setValue('contactId', contact?.id)
    setValue('lastName', contact?.lastName)
    setValue('firstName', contact?.firstName)
    setValue('phoneNumber', contact?.phoneNumber)
    setValue('city', contact?.city)
  }, [setValue, contactId, contactsDb])

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          items={contactItems}
          value={contactId}
          onSelect={setContactId}
          placeholder="Rechercher un vendeur"
        />
      </div>
      <Button
        className="col-span-2"
        type="button"
        variant="secondary"
        onClick={prefillBuyerInformation}
      >
        Rechercher
      </Button>
    </div>
  )
}

function BuyerInformationForm() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Acheteur</h3>
      <div className="grid grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="lastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="lastName">Nom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
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
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="firstName">Prénom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
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
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="phoneNumber">Téléphone</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
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
                  <Combobox
                    invalid={fieldState.invalid}
                    items={citiesItems}
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  )
}
type SaleArticlesFormProps = {
  saleIndex: number
}
function SaleArticlesForm(props: SaleArticlesFormProps) {
  const { saleIndex } = props
  const { getValues } = useFormContext<SaleFormType>()
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

  const addArticle = useCallback(async () => {
    const article = await articlesDb.findByCode(articleCode)
    if (!article) {
      toast.error(`Article ${articleCode} inconnu`)
      setArticleCode('')
      return
    }
    if (article.saleId) {
      toast.error(`Article ${articleCode} déja vendu`)
      setArticleCode('')
      return
    }

    const articles = getValues('articles')
    if (!articles?.some(({ id }) => id === article.id)) {
      append({
        id: article.id,
        articleCode: article.depositIndex + ' ' + article.identificationLetter,
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
    acc += parseInt(`${cur.price}`)
    return acc
  }, 0)
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
        {articles.map((article, index) => (
          <TableRow key={article.id}>
            <TableCell className="font-medium">{article.articleCode}</TableCell>
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
      <TableFooter>
        <TableRow className="font-bold">
          <TableCell colSpan={4}></TableCell>
          <TableCell>Nombre d'articles</TableCell>
          <TableCell>{articles.length}</TableCell>
          <TableCell>Total</TableCell>
          <TableCell className="text-right">{total}€</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function PaymentForm() {
  const { watch } = useFormContext<SaleFormType>()
  const [cashReceived, setCashReceived] = useState<string>('')
  const cashAmount = watch('cashAmount')
  let cashReturned = Math.max(
    0,
    parseInt(cashReceived, 10) - parseInt(`${cashAmount}`, 10),
  )
  if (Number.isNaN(cashReturned)) {
    cashReturned = 0
  }
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Règlements</h3>
      <Controller
        name="root.totalPrice"
        render={({ fieldState }) => <FieldError errors={[fieldState.error]} />}
      />
      <div className="grid grid-cols-8 gap-6 align-baseline">
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
        <Field>
          <FieldContent>
            <Label htmlFor="cashReceived">Espèces reçues</Label>
            <InputGroup>
              <InputGroupInput
                id="cashReceived"
                type="text"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
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
              />
              <InputGroupAddon align="inline-end">
                <Euro />
              </InputGroupAddon>
            </InputGroup>
          </FieldContent>
        </Field>
      </div>
    </div>
  )
}

function ErrorMessages() {
  const {
    formState: { errors },
  } = useFormContext()

  console.log(errors)

  const errorsDisplayed = Object.keys(errors).map((key, index) => {
    if (typeof errors[key]?.message === 'string') {
      return <li key={index}>{errors[key]?.message}</li>
    }
    return null
  })
  if (errorsDisplayed.length === 0) return null
  return <ul className="pl-3 text-red-600 list-disc">{errorsDisplayed}</ul>
}

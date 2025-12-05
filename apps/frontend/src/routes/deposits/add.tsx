import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { Euro, Plus, Printer, Trash2 } from 'lucide-react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useDepotsDb } from '@/hooks/useDepotsDb.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { Label } from '@/components/ui/label.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLiveQuery } from 'dexie-react-hooks'
import { useDymo } from '@/hooks/useDymo.ts'
import PublicLayout from '@/components/PublicLayout'
import { DepositFormSchema, type DepositFormType } from '@/types/depotForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import { Field, FieldContent } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { disciplineItems } from '@/types/disciplines.ts'
import { categoriesItems } from '@/types/categories.ts'
import { brandsItems } from '@/types/brands.ts'
import { colors } from '@/types/colors.ts'
import { citiesItems } from '@/types/cities.ts'
import { Combobox } from '@/components/Combobox'
import { Page } from '@/components/Page.tsx'
import { generateArticleCode, generateArticleIndex, getYear } from '@/utils'
import { toast } from 'sonner'
import { DepositPdf, type DepositPdfProps } from '@/pdf/deposit-pdf.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useDebouncedCallback } from 'use-debounce'
import { printPdf } from '@/pdf/print.tsx'
import { db } from '@/db.ts'

export const Route = createFileRoute('/deposits/add')({
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
  const depotDb = useDepotsDb()
  const [workstation] = useWorkstation()
  const [currentDepotCount, setCurrentDepotCount] = useState<number | null>(
    null,
  )
  useEffect(() => {
    async function getDepotCount() {
      if (workstation.incrementStart > 0) {
        const count = await depotDb.count(workstation)
        setCurrentDepotCount(count)
      }
    }
    getDepotCount()
  }, [workstation, setCurrentDepotCount])

  if (currentDepotCount === null) return null
  const depositCurrentIndex = workstation.incrementStart + currentDepotCount + 1

  return (
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Faire un dépôt"
    >
      <DepositForm depositIndex={depositCurrentIndex} />
    </Page>
  )
}

function SubmitButton() {
  const { formState } = useFormContext<DepositFormType>()
  const { isSubmitting } = formState

  return (
    <CustomButton type="submit" loading={isSubmitting}>
      Valider et enregistrer le dépôt
    </CustomButton>
  )
}

function DepositForm({ depositIndex }: { depositIndex: number }) {
  const createDepotMutation = useCreateDepot()
  const methods = useForm<DepositFormType>({
    resolver: zodResolver(DepositFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      isSummaryPrinted: false,
      deposit: {
        depotIndex: depositIndex,
        lastName: '',
        firstName: '',
        phoneNumber: '',
        contributionStatus: '',
        city: '',
        contributionAmount: 2,
        articles: [],
      },
    },
  })
  const { handleSubmit, setValue, reset } = methods

  const [countArticle, setCountArticle] = useState(0)

  const onSubmit: SubmitHandler<DepositFormType> = async (data) => {
    await createDepotMutation.mutate(data.deposit)
    reset()
    setCountArticle(0)
    toast.success(`Dépôt ${depositIndex} enregistré`)
  }

  const loadPredeposit = useCallback(async (predepositId: string) => {
    if (!depositIndex) return
    const predeposit = await db.predeposits.get(predepositId)
    if (!predeposit) return
    const predepositArticles = await db.predepositArticles
      .where({ predepositId })
      .toArray()
    setValue('isSummaryPrinted', true)
    setValue('deposit.lastName', predeposit.sellerLastName)
    setValue('deposit.firstName', predeposit.sellerFirstName)
    setValue('deposit.phoneNumber', predeposit.sellerPhoneNumber)
    setValue('deposit.city', predeposit.sellerCity)
    setValue('deposit.contributionStatus', 'A PAYER')
    const year = getYear()
    setValue(
      'deposit.articles',
      predepositArticles.map((article, index) => {
        const articleIndex = generateArticleIndex(index)
        const articleCode = generateArticleCode(
          year,
          depositIndex,
          articleIndex,
        )
        return {
          price: article.price,
          discipline: article.discipline,
          brand: article.brand,
          type: article.category,
          size: article.size,
          color: article.color,
          model: article.model,
          articleCode,
          year,
          depotIndex: depositIndex,
          articleIndex,
          shortArticleCode: `${depositIndex} ${articleIndex}`,
        }
      }),
    )
    setCountArticle(predepositArticles.length)
  }, [])

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
        <PredepositComboBox onChange={loadPredeposit} />

        <ErrorMessages />

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <SellerInformationForm />
          <ArticleForm
            onArticleAdd={() => setCountArticle(countArticle + 1)}
            articleCount={countArticle}
            depositIndex={depositIndex}
          />

          <div className="flex justify-end gap-4">
            <SummaryPrintButton />
            <CustomButton
              type="button"
              onClick={() => reset()}
              variant="destructive"
            >
              Annuler
            </CustomButton>
            <SubmitButton />
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

type PredepositComboBoxProps = {
  onChange?: (id: string) => void
}
function PredepositComboBox(props: PredepositComboBoxProps) {
  const { onChange } = props
  const [predepositId, setPredepositId] = useState<string | null>(null)
  const predeposits = useLiveQuery(() => db.predeposits.toArray())
  const predepositItems = useMemo(() => {
    return (
      predeposits?.map((predeposit) => ({
        value: predeposit.id,
        label: `${predeposit.sellerLastName} ${predeposit.sellerFirstName}`,
        keywords: [predeposit.sellerLastName, predeposit.sellerFirstName],
      })) ?? []
    )
  }, [predeposits])

  const handleClick = useCallback(
    () => onChange?.(predepositId ?? ''),
    [onChange, predepositId],
  )

  return (
    <div className="grid grid-cols-6 gap-2 w-[500px]">
      <div className="col-span-4">
        <Combobox
          items={predepositItems}
          value={predepositId}
          onSelect={setPredepositId}
          placeholder="Rechercher une fiche de pré-dépot"
        />
      </div>
      <Button
        className="col-span-2"
        type="button"
        variant="secondary"
        onClick={handleClick}
      >
        Rechercher
      </Button>
    </div>
  )
}

function SellerInformationForm() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Vendeur</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="deposit.lastName"
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
            name="deposit.firstName"
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
            name="deposit.phoneNumber"
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
            name="deposit.city"
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

type ArticleFormProps = {
  onArticleAdd: () => void
  articleCount: number
  depositIndex: number
}

function ArticleForm(props: ArticleFormProps) {
  const { onArticleAdd, articleCount, depositIndex } = props
  const { fields, append, remove } = useFieldArray<DepositFormType>({
    name: 'deposit.articles',
  })
  const { trigger, setValue, watch } = useFormContext<DepositFormType>()

  const addArticle = useCallback(async () => {
    const valid = await trigger(`deposit.articles.${fields.length - 1}`)
    if (!valid) {
      return
    }
    const year = getYear()
    const articleIndex = generateArticleIndex(articleCount)
    const articleCode = generateArticleCode(year, depositIndex, articleIndex)
    append({
      price: 0,
      discipline: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      model: '',
      articleCode,
      year,
      depotIndex: depositIndex,
      articleIndex,
      shortArticleCode: `${depositIndex} ${articleIndex}`,
    })
    onArticleAdd()
  }, [fields, depositIndex, articleCount])

  const contributionAmount = watch('deposit.contributionAmount')

  useEffect(() => {
    setValue(
      'deposit.contributionAmount',
      (Math.floor((fields.length - 1) / 10) + 1) * 2,
    )
  }, [fields.length])

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold ">Articles</h3>

      <div className="overflow-x-auto overflow-y-scroll">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[100px]">
                Code
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Discipline
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[150px]">
                Catégorie
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Marque
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Descriptif
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Couleur
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Taille
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Prix
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <ArticleLineForm key={field.id} index={index} onRemove={remove} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-row justify-between">
        <div>
          <Button type="button" variant="ghost" onClick={addArticle}>
            <Plus className="w-5 h-5" />
            Ajouter un nouvel article
          </Button>
        </div>
        <div className="flex flex-row gap-5 items-baseline">
          <div>Nombre d'articles : {fields.length}</div>
          <div>Montant droit de dépôt : {contributionAmount}€</div>
          <div>
            <Controller
              name="deposit.contributionStatus"
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="A_PAYER">A payer</SelectItem>
                        <SelectItem value="PAYEE">Payée</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="GRATUIT">Gratuit</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

type ArticleLineFormProps = {
  index: number
  onRemove: (index: number) => void
}

function ArticleLineForm(props: ArticleLineFormProps) {
  const { index, onRemove } = props
  const colorOptions = useMemo(() => {
    return colors.map((color) => <option key={color} value={color}></option>)
  }, [colors])

  return (
    <tr className="border-b border-gray-100">
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.shortArticleCode`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                    readOnly
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.discipline`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={disciplineItems}
              onSelect={field.onChange}
              value={field.value}
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.type`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={categoriesItems}
              onSelect={field.onChange}
              value={field.value}
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.brand`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={brandsItems}
              onSelect={field.onChange}
              value={field.value}
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.model`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`deposit.articles.${index}.color`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    list={`articles-${index}-color-list`}
                    id={`articles-${index}-color`}
                    aria-invalid={fieldState.invalid}
                    type="text"
                  />
                  <datalist id={`articles-${index}-color-list`}>
                    {colorOptions}
                  </datalist>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td className="py-1 px-1 w-[75px]">
        <Controller
          name={`deposit.articles.${index}.size`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-1">
          <Controller
            name={`deposit.articles.${index}.price`}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    <Euro className="w-5 pr-1" />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-2">
          <PrintArticleButton index={index} />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

type PrintArticleButtonProps = {
  index: number
}

function PrintArticleButton(props: PrintArticleButtonProps) {
  const { index } = props
  const dymo = useDymo()
  const { trigger, getValues } = useFormContext<DepositFormType>()

  const printDymo = useCallback(async () => {
    const valid = await trigger(`deposit.articles.${index}`)
    if (!valid) return
    const field = getValues(`deposit.articles.${index}`)
    dymo.print({
      color: field.color,
      brand: field.brand,
      size: field.size,
      category: field.type,
      code: field.articleCode,
      price: `${field.price}`,
      shortCode: field.shortArticleCode,
      model: field.model,
    })
  }, [dymo, getValues, index])

  const debouncedPrintDymo = useDebouncedCallback(printDymo, 1000)

  return (
    <CustomButton type="button" variant="ghost" onClick={debouncedPrintDymo}>
      <Printer className="w-4 h-4" />
    </CustomButton>
  )
}

function SummaryPrintButton() {
  const { getValues, trigger, setValue } = useFormContext<DepositFormType>()
  const print = async () => {
    const valid = await trigger('deposit')
    if (!valid) {
      return
    }
    const formData = getValues('deposit')
    const year = getYear()
    const data: DepositPdfProps['data'] = {
      deposit: {
        depositIndex: formData.depotIndex,
        year,
        contributionStatus: formData.contributionStatus,
        contributionAmount: formData.contributionAmount,
      },
      contact: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
      },
      articles: formData.articles.map((article) => ({
        shortCode: `${formData.depotIndex} ${article.articleIndex}`,
        category: article.type,
        brand: article.brand,
        model: article.model,
        discipline: article.discipline,
        size: article.size,
        price: article.price,
        color: article.color,
      })),
    }
    await printPdf(<DepositPdf data={data} copy={2} />)
    setValue('isSummaryPrinted', true)
  }

  return (
    <CustomButton type="button" onClick={print} variant="secondary">
      Imprimer
    </CustomButton>
  )
}

function ErrorMessages() {
  const {
    formState: { errors },
  } = useFormContext<DepositFormType>()

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

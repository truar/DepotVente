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
import { fakerFR as faker } from '@faker-js/faker'
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
import { type DepotFormType, DepotSchema } from '@/types/depotForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import { Field, FieldContent } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { disciplineItems, disciplines } from '@/types/disciplines.ts'
import { categories, categoriesItems } from '@/types/categories.ts'
import { brands, brandsItems } from '@/types/brands.ts'
import { colors } from '@/types/colors.ts'
import { cities, citiesItems } from '@/types/cities.ts'
import { Combobox } from '@/components/Combobox'
import { Page } from '@/components/Page.tsx'
import { generateArticleCode, generateArticleIndex, getYear } from '@/utils'
import { toast } from 'sonner'
import { pdf } from '@react-pdf/renderer'
import { DepositPdf, type DepositPdfProps } from '@/pdf/deposit-pdf.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useDebouncedCallback } from 'use-debounce'

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
  if (!workstation) return null

  const currentDepotCount = useLiveQuery(() => depotDb.count())
  if (!currentDepotCount) return null
  const depotCurrentIndex = workstation.incrementStart + currentDepotCount + 1

  return (
    <Page
      navigation={<Link to={'..'}>Retour au menu</Link>}
      title="Faire un dépôt"
    >
      <DepositForm depotIndex={depotCurrentIndex} />
    </Page>
  )
}

const predeposits = [
  {
    value: '001',
    label: '001 - Ruaro Thibault',
    keywords: ['ruaro', 'thibault', '001'],
  },
  {
    value: '002',
    label: '002 - Jacques Henry',
    keywords: ['Jacques', 'Henry', '002'],
  },
  {
    value: '003',
    label: '003 - El tomato',
    keywords: ['El', 'tomato', '003'],
  },
]

function DepositForm({ depotIndex }: { depotIndex: number }) {
  const createDepotMutation = useCreateDepot()
  const methods = useForm<DepotFormType>({
    resolver: zodResolver(DepotSchema),
    mode: 'onSubmit',
    defaultValues: {
      depotIndex: depotIndex,
      lastName: '',
      firstName: '',
      phoneNumber: '',
      contributionStatus: '',
      city: '',
      contributionAmount: 2,
      articles: [
        {
          articleCode: generateArticleCode(
            2025,
            depotIndex,
            generateArticleIndex(0),
          ),
          articleIndex: generateArticleIndex(0),
          brand: '',
          color: '',
          type: '',
          model: '',
          depotIndex: depotIndex,
          size: '',
          year: 2025,
          discipline: '',
          price: 0,
          shortArticleCode: depotIndex + ' ' + generateArticleIndex(0),
        },
      ],
    },
  })
  const { handleSubmit, setValue, reset, formState } = methods
  const { isSubmitting } = formState
  const [predeposit, setPredeposit] = useState<string | null>(null)

  const [countArticle, setCountArticle] = useState(1)

  const onSubmit: SubmitHandler<DepotFormType> = async (data) => {
    await createDepotMutation.mutate(data)
    reset()
    setCountArticle(0)
    toast.success(`Dépôt ${depotIndex} enregistré`)
  }

  const generateFakeVente = useCallback(() => {
    if (!depotIndex) return

    setValue('lastName', faker.person.lastName())
    setValue('firstName', faker.person.firstName())
    setValue('phoneNumber', faker.phone.number({ style: 'national' }))
    setValue('city', faker.helpers.arrayElement(cities))
    setValue('contributionStatus', 'PAYEE')
    const nbArticles = 11
    setValue(
      'articles',
      Array.from({ length: nbArticles }).map((_, index) => {
        const year = getYear()
        const articleIndex = generateArticleIndex(index)
        const articleCode = generateArticleCode(year, depotIndex, articleIndex)
        return {
          price: parseInt(faker.commerce.price({ min: 10, max: 150 })),
          discipline: faker.helpers.arrayElement(disciplines),
          brand: faker.helpers.arrayElement(brands),
          type: faker.helpers.arrayElement(categories),
          size: faker.number.int({ min: 1, max: 180 }) + '',
          color: faker.color.human(),
          model: faker.commerce.productName(),
          articleCode,
          year,
          depotIndex: depotIndex,
          articleIndex,
          shortArticleCode: `${depotIndex} ${articleIndex}`,
        }
      }),
    )
    setCountArticle(nbArticles)
  }, [depotIndex, setValue])

  const loadPredeposit = useCallback(() => {
    console.log('loadPredeposit', predeposit)
  }, [predeposit])

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
        <div className="grid grid-cols-6 gap-2 w-[500px]">
          <div className="col-span-4">
            <Combobox
              items={predeposits}
              value={predeposit}
              onSelect={setPredeposit}
              placeholder="Rechercher une fiche de pré-dépot"
            />
          </div>
          <Button
            className="col-span-2"
            type="button"
            variant="secondary"
            onClick={loadPredeposit}
          >
            Rechercher
          </Button>
        </div>

        <ErrorMessages />

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <SellerInformationForm />
          <ArticleForm
            onArticleAdd={() => setCountArticle(countArticle + 1)}
            articleCount={countArticle}
            depotIndex={depotIndex}
          />

          <div className="flex justify-end gap-4">
            <CustomButton
              type="button"
              onClick={() => generateFakeVente()}
              variant="ghost"
            >
              Générer une fausse vente
            </CustomButton>
            <SummaryPrintButton />
            <CustomButton
              type="button"
              onClick={() => reset()}
              variant="destructive"
            >
              Annuler
            </CustomButton>
            <CustomButton
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Valider et enregistrer le dépôt
            </CustomButton>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function SellerInformationForm() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Vendeur</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name={`lastName`}
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
            name={`firstName`}
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
            name={`phoneNumber`}
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
            name={`city`}
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
  depotIndex: number
}

function ArticleForm(props: ArticleFormProps) {
  const { onArticleAdd, articleCount, depotIndex } = props
  const { fields, append, remove } = useFieldArray<DepotFormType>({
    name: 'articles',
  })
  const { trigger, getFieldState, setValue, watch } = useFormContext()

  const addArticle = useCallback(async () => {
    const lastArticleFieldName = `articles.${fields.length - 1}`
    await trigger(lastArticleFieldName)
    const fieldState = getFieldState(lastArticleFieldName)
    if (fieldState.invalid) return
    const year = getYear()
    const articleIndex = generateArticleIndex(articleCount)
    const articleCode = generateArticleCode(year, depotIndex, articleIndex)
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
      depotIndex,
      articleIndex,
      shortArticleCode: `${depotIndex} ${articleIndex}`,
    })
    onArticleAdd()
  }, [fields, depotIndex, articleCount])

  const contributionAmount = watch('contributionAmount')

  useEffect(() => {
    setValue(
      'contributionAmount',
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
              name={`contributionStatus`}
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
          name={`articles.${index}.shortArticleCode`}
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
          name={`articles.${index}.discipline`}
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
          name={`articles.${index}.type`}
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
          name={`articles.${index}.brand`}
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
          name={`articles.${index}.model`}
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
          name={`articles.${index}.color`}
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
          name={`articles.${index}.size`}
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
            name={`articles.${index}.price`}
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
  const { trigger, getValues, getFieldState } = useFormContext<DepotFormType>()

  const printDymo = useCallback(async () => {
    await trigger(`articles.${index}`)
    const state = getFieldState(`articles.${index}`)
    if (state.invalid) return
    const field = getValues(`articles.${index}`)
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
  const { getValues, trigger, formState } = useFormContext<DepotFormType>()
  const print = async () => {
    await trigger()
    if (!formState.isValid) {
      console.log('invalid form')
      return
    }
    const formData = getValues()
    const year = getYear()
    const data: DepositPdfProps['data'] = {
      deposit: {
        depositIndex: formData.depotIndex,
        year,
      },
      contact: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
      },
      articles: formData.articles.map((article) => ({
        index: article.articleIndex,
        category: article.type,
        brand: article.brand,
        model: article.model,
        discipline: article.discipline,
        size: article.size,
        price: article.price,
        color: article.color,
      })),
    }
    const blob = await pdf(<DepositPdf data={data} />).toBlob()
    const blobURL = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe') //load content in an iframe to print later
    document.body.appendChild(iframe)

    iframe.style.display = 'none'
    iframe.src = blobURL
    iframe.onload = function () {
      setTimeout(function () {
        iframe.focus()
        if (iframe.contentWindow) {
          iframe.contentWindow.print()
        }
      }, 1)
    }
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
  } = useFormContext()

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

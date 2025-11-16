import {
  Controller,
  type FieldArrayWithId,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { ChevronLeft, Euro, Plus, Printer, Trash2 } from 'lucide-react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { type KeyboardEvent, useCallback, useState } from 'react'
import { fakerFR as faker } from '@faker-js/faker'
import { useCreateDepot } from '@/hooks/useCreateDepot.ts'
import { useDepotDb } from '@/hooks/useDepotDb.ts'
import { useWorkstation } from '@/hooks/useWorkstation.ts'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
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
import { type DepotFormType, DepotSchema, TypeEnum } from '@/types/depotForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button.tsx'
import { useAuthStore } from '@/stores/authStore.ts'
import { Field, FieldContent } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import type { Workstation } from '@/db.ts'

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
      <DepositFormPage />
    </PublicLayout>
  ),
})

function generateArticleIndex(articleIndex: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  let index = articleIndex

  while (index >= 0) {
    result = alphabet[index % 26] + result
    index = Math.floor(index / 26) - 1
  }

  return result
}

function generateArticleCode(
  year: number,
  depotIndex: number,
  articleIndex: string,
) {
  // Combine all parts into the final code
  return `${year} ${depotIndex}${articleIndex}`
}

export function DepositFormPage() {
  const depotDb = useDepotDb()
  const [workstation] = useWorkstation()
  if (!workstation) return null

  const currentDepotCount = useLiveQuery(() => depotDb.count())
  const depotCurrentIndex = currentDepotCount
    ? workstation.incrementStart + currentDepotCount + 1
    : undefined

  if (!depotCurrentIndex) return null

  return (
    <main className="flex-1 p-6">
      <Button variant="link" className="cursor-pointer">
        <ChevronLeft />
        <Link to={'..'}>Retour au menu</Link>
      </Button>
      <DepositForm depotIndex={depotCurrentIndex} workstation={workstation} />
    </main>
  )
}

function DepositForm({
  depotIndex,
  workstation,
}: {
  depotIndex: number
  workstation: Workstation
}) {
  const createDepotMutation = useCreateDepot()
  const methods = useForm<DepotFormType>({
    resolver: zodResolver(DepotSchema),
    mode: 'onSubmit',
    defaultValues: {
      depotIndex: depotIndex,
      lastName: '',
      firstName: '',
      phoneNumber: '',
      cotisationPayee: false,
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
          type: TypeEnum.Skis,
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
  const { handleSubmit, setValue, reset } = methods

  const [countArticle, setCountArticle] = useState(1)

  const onSubmit = async (data: DepotFormType) => {
    await createDepotMutation.mutate(data)
    reset()
    setCountArticle(0)
  }

  const generateFakeVente = useCallback(() => {
    if (!depotIndex) return

    setValue('lastName', faker.person.lastName())
    setValue('firstName', faker.person.firstName())
    setValue('phoneNumber', faker.phone.number({ style: 'national' }))
    const nbArticles = Math.floor(Math.random() * 10) + 1
    setValue(
      'articles',
      Array.from({ length: nbArticles }).map((_, index) => {
        const year = new Date().getFullYear()
        const articleIndex = generateArticleIndex(index)
        const articleCode = generateArticleCode(year, depotIndex, articleIndex)
        return {
          price: parseInt(faker.commerce.price({ min: 10, max: 150 })),
          discipline: faker.lorem.words({ min: 1, max: 4 }),
          brand: faker.commerce.department(),
          type: faker.helpers.enumValue(TypeEnum),
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

  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={checkKeyDown}>
        <h2 className="text-4xl font-bold text-gray-800 mb-8">
          Enregistrer un nouveau dépôt vendeur
        </h2>

        <ErrorMessages />

        <div className="flex gap-6 flex-col">
          <div className="flex gap-8">
            <div className="flex flex-1 flex-col bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-5">
                Informations du Dépot
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="workstation">Numéro de poste</Label>
                  <Input
                    readOnly={true}
                    id="workstation"
                    type="text"
                    value={workstation.incrementStart}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="depotIndex">Dépot</Label>
                  <Input
                    readOnly={true}
                    id="depotIndex"
                    type="text"
                    value={depotIndex}
                  />
                </div>
              </div>
            </div>

            <SellerInformationForm />
          </div>
          <ArticleForm
            onArticleAdd={() => setCountArticle(countArticle + 1)}
            articleCount={countArticle}
            depotIndex={depotIndex}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" onClick={generateFakeVente} variant="secondary">
            Générer une fausse vente
          </Button>
          <Button type="button" onClick={() => reset()} variant="destructive">
            Annuler
          </Button>
          <Button type="submit">Valider et enregistrer le dépôt</Button>
        </div>
      </form>
    </FormProvider>
  )
}

function SellerInformationForm() {
  const { register, control } = useFormContext()
  return (
    <div className="flex flex-2 flex-col bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-5">
        Informations du Vendeur
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="grid gap-2">
          <Controller
            name={`lastName`}
            control={control}
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
            control={control}
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
            control={control}
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
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register('cotisationPayee')}
          id="cotisation"
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-400"
        />
        <label htmlFor="cotisation" className="text-sm text-gray-700">
          Cotisation annuelle payée
        </label>
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
  const { trigger, getFieldState } = useFormContext()
  const addArticle = useCallback(async () => {
    if (!depotIndex) return
    await trigger()
    const fieldState = getFieldState('articles')
    if (fieldState.invalid) return
    const year = new Date().getFullYear()
    const articleIndex = generateArticleIndex(articleCount)
    const articleCode = generateArticleCode(year, depotIndex, articleIndex)
    append({
      price: 0,
      discipline: '',
      brand: '',
      type: TypeEnum.Skis,
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
  }, [depotIndex, articleCount])

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-5">
        Liste des articles déposés
      </h3>

      <div className="overflow-x-auto overflow-y-scroll">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Code
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Type
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Marque
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Modèle
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Taille
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Couleur
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Discipline
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Prix
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[75px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <ArticleLineForm
                field={field}
                key={field.id}
                index={index}
                onRemove={remove}
              />
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addArticle}
        className="mt-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
      >
        <Plus className="w-5 h-5" />
        Ajouter un nouvel article
      </button>
    </div>
  )
}

type ArticleLineFormProps = {
  field: FieldArrayWithId<DepotFormType, 'articles'>
  index: number
  onRemove: (index: number) => void
}

function ArticleLineForm(props: ArticleLineFormProps) {
  const { field, index, onRemove } = props
  const { control } = useFormContext()

  return (
    <tr className="border-b border-gray-100">
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.shortArticleCode`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-code-${index}`}
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
        <Select name={`articles.${index}.type`} value={field.type}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Chaussures">Chaussures</SelectItem>
              <SelectItem value="Skis">Skis</SelectItem>
              <SelectItem value="Bâtons">Bâtons</SelectItem>
              <SelectItem value="Snowboard">Snowboard</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.brand`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-brand-${index}`}
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
          name={`articles.${index}.model`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-model-${index}`}
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
          name={`articles.${index}.size`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-size-${index}`}
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
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-color-${index}`}
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
          name={`articles.${index}.discipline`}
          control={control}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    id={`article-discipline-${index}`}
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
            control={control}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id={`article-price-${index}`}
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
          <PrintArticleButton index={index} field={field} />
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
  field: FieldArrayWithId<DepotFormType, 'articles'>
}

function PrintArticleButton(props: PrintArticleButtonProps) {
  const { field } = props
  const dymo = useDymo()

  const printDymo = useCallback(
    (field: FieldArrayWithId<DepotFormType, 'articles'>) => {
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
    },
    [dymo],
  )

  return (
    <Button variant="ghost" onClick={() => printDymo(field)}>
      <Printer className="w-4 h-4" />
    </Button>
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
  return <ul className="mb-6 pl-5 text-red-600 list-disc">{errorsDisplayed}</ul>
}

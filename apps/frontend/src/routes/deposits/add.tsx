import {
  type FieldArrayWithId,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { ChevronLeft, Plus, Printer, Trash2 } from 'lucide-react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useCallback, useState, type KeyboardEvent } from 'react'
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
  const createDepotMutation = useCreateDepot()
  const depotDb = useDepotDb()
  const [workstation] = useWorkstation()
  if (!workstation) return null

  const currentDepotCount = useLiveQuery(() => depotDb.count()) ?? 0
  const depotCurrentIndex = workstation.incrementStart + currentDepotCount + 1

  const methods = useForm<DepotFormType>({
    resolver: zodResolver(DepotSchema),
    defaultValues: {
      depotIndex: depotCurrentIndex,
      lastName: '',
      firstName: '',
      phoneNumber: '',
      cotisationPayee: false,
      articles: [],
    },
  })
  const { handleSubmit, setValue, reset } = methods

  const [countArticle, setCountArticle] = useState(0)

  const onSubmit = async (data: DepotFormType) => {
    await createDepotMutation.mutate(data)
    reset()
    setCountArticle(0)
  }

  const generateFakeVente = useCallback(() => {
    if (!depotCurrentIndex) return

    setValue('lastName', faker.person.lastName())
    setValue('firstName', faker.person.firstName())
    setValue('phoneNumber', faker.phone.number({ style: 'national' }))
    const nbArticles = Math.floor(Math.random() * 10) + 1
    setValue(
      'articles',
      Array.from({ length: nbArticles }).map((_, index) => {
        const year = new Date().getFullYear()
        const articleIndex = generateArticleIndex(index)
        const articleCode = generateArticleCode(
          year,
          depotCurrentIndex,
          articleIndex,
        )
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
          depotIndex: depotCurrentIndex,
          articleIndex,
          shortArticleCode: `${depotCurrentIndex} ${articleIndex}`,
        }
      }),
    )
    setCountArticle(nbArticles)
  }, [depotCurrentIndex, setValue])

  if (!depotCurrentIndex) {
    return null
  }

  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  return (
    <main className="flex-1 p-6">
      <Button variant="link" className="cursor-pointer">
        <ChevronLeft />
        <Link to={'..'}>Retour au menu</Link>
      </Button>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={checkKeyDown}>
          <h2 className="text-4xl font-bold text-gray-800 mb-8">
            Enregistrer un nouveau dépôt vendeur
          </h2>

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
                      value={depotCurrentIndex}
                    />
                  </div>
                </div>
              </div>

              <SellerInformationForm />
            </div>
            <ArticleForm
              onArticleAdd={() => setCountArticle(countArticle + 1)}
              articleCount={countArticle}
              depotIndex={depotCurrentIndex}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={generateFakeVente}
              variant="secondary"
            >
              Générer une fausse vente
            </Button>
            <Button type="button" onClick={() => reset()} variant="destructive">
              Annuler
            </Button>
            <Button type="submit">Valider et enregistrer le dépôt</Button>
          </div>
        </form>
      </FormProvider>
    </main>
  )
}

function SellerInformationForm() {
  const { register } = useFormContext()
  return (
    <div className="flex flex-2 flex-col bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-5">
        Informations du Vendeur
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="grid gap-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" type="text" {...register('lastName')} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            type="text"
            {...register('firstName')}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phoneNumber">Téléphone</Label>
          <Input
            id="phoneNumber"
            type="text"
            {...register('phoneNumber')}
            required
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

  const addArticle = useCallback(() => {
    if (!depotIndex) return
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
  const { register } = useFormContext()
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
    <tr className="border-b border-gray-100">
      <td className="py-1 px-1">
        <input
          type="text"
          readOnly={true}
          {...register(`articles.${index}.shortArticleCode`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
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
        <input
          type="text"
          {...register(`articles.${index}.brand`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
        />
      </td>
      <td className="py-1 px-1">
        <input
          type="text"
          {...register(`articles.${index}.model`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
        />
      </td>
      <td className="py-1 px-1">
        <input
          type="text"
          {...register(`articles.${index}.size`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
        />
      </td>
      <td className="py-1 px-1">
        <input
          type="text"
          {...register(`articles.${index}.color`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
        />
      </td>
      <td className="py-1 px-1">
        <input
          type="text"
          {...register(`articles.${index}.discipline`)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
        />
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-1">
          <input
            type="number"
            {...register(`articles.${index}.price`)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
          />
          <span className="text-sm text-gray-600">€</span>
        </div>
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => printDymo(field)}
            type="button"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
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

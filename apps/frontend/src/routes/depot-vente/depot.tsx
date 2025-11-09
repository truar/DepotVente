import { type FieldArrayWithId, useFieldArray, useForm } from 'react-hook-form'
import { Plus, Printer, Trash2 } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState, type KeyboardEvent } from 'react'
import { fakerFR as faker } from '@faker-js/faker'
import { type DepotFormType, TypeEnum } from '@/types/depot.ts'
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

export const Route = createFileRoute('/depot-vente/depot')({
  component: () => (
    <PublicLayout>
      <DepotVendeurFormPage />
    </PublicLayout>
  ),
})

function generateArticleIndex(articleIndex: number) {
  // Generate the alphabetical representation of the articleIndex
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let alphaPart = ''
  let alphaIndex = articleIndex

  // Convert the articleIndex into "Excel-style" column representation
  do {
    alphaPart = alphabet[alphaIndex % 26] + alphaPart
    alphaIndex = Math.floor(alphaIndex / 26)
  } while (alphaIndex > 0)
  return alphaPart
}

function generateArticleCode(
  year: number,
  depotIndex: number,
  articleIndex: string,
) {
  // Combine all parts into the final code
  return `${year} ${depotIndex}${articleIndex}`
}

export function DepotVendeurFormPage() {
  const createDepotMutation = useCreateDepot()
  const dymo = useDymo()
  const depotDb = useDepotDb()
  const [workstation] = useWorkstation()
  const currentDepotCount = useLiveQuery(() => depotDb.count()) ?? 0
  const depotCurrentIndex = workstation + currentDepotCount + 1

  const { register, control, handleSubmit, setValue, reset } =
    useForm<DepotFormType>({
      defaultValues: {
        depotIndex: depotCurrentIndex,
        lastName: '',
        firstName: '',
        phoneNumber: '',
        cotisationPayee: false,
        articles: [],
      },
    })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'articles',
  })

  const onSubmit = async (data: DepotFormType) => {
    await createDepotMutation.mutate(data)
    reset()
    setCountArticle(0)
  }
  const [countArticle, setCountArticle] = useState(0)
  const addArticle = useCallback(() => {
    if (!depotCurrentIndex) return
    const year = new Date().getFullYear()
    const articleIndex = generateArticleIndex(countArticle)
    const articleCode = generateArticleCode(
      year,
      depotCurrentIndex,
      articleIndex,
    )
    append({
      price: 0,
      description: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      model: '',
      articleCode,
      year,
      depotIndex: depotCurrentIndex,
      articleIndex,
      shortArticleCode: `${depotCurrentIndex} ${articleIndex}`,
    })
    setCountArticle(countArticle + 1)
  }, [depotCurrentIndex, countArticle])

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
          description: faker.lorem.words({ min: 1, max: 4 }),
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

  const printDymo = useCallback(
    (field: FieldArrayWithId<DepotFormType, 'articles', 'id'>) => {
      dymo.print({
        color: field.color,
        brand: field.brand,
        size: field.size,
        category: field.type,
        code: field.articleCode,
        price: `${field.price}`,
        shortCode: field.articleCode.substring(5),
        shortDescription: field.description,
      })
    },
    [dymo],
  )
  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  return (
    <main className="flex-1 px-6 py-8">
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={checkKeyDown}>
        <div className="mx-auto">
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
                        value={workstation}
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

                <div className="flex flex-2 flex-col bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-5">
                    Informations du Vendeur
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                        required
                      />
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
                    <label
                      htmlFor="cotisation"
                      className="text-sm text-gray-700"
                    >
                      Cotisation annuelle payée
                    </label>
                  </div>
                </div>
              </div>
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
                          Descriptif
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
                        <tr key={field.id} className="border-b border-gray-100">
                          <td className="py-1 px-1">
                            <input
                              type="text"
                              readOnly={true}
                              {...register(
                                `articles.${index}.shortArticleCode`,
                              )}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Select
                              name={`articles.${index}.type`}
                              value={field.type}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="Chaussures">
                                    Chaussures
                                  </SelectItem>
                                  <SelectItem value="Skis">Skis</SelectItem>
                                  <SelectItem value="Bâtons">Bâtons</SelectItem>
                                  <SelectItem value="Snowboard">
                                    Snowboard
                                  </SelectItem>
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
                              {...register(`articles.${index}.description`)}
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
                                onClick={() => remove(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
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
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                onClick={generateFakeVente}
              >
                Générer une fausse vente
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors shadow-md"
              >
                Valider et enregistrer le dépôt
              </button>
            </div>
          </div>
        </form>
      </main>
  )
}

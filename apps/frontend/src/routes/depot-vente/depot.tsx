import { useFieldArray, useForm } from 'react-hook-form'
import { LogOut, Plus, Printer, Trash2 } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/depot-vente/depot')({
  component: DepotVendeurFormPage,
})

type ArticleFormType = {
  price: number
  description: string
  brand: string
  type: string
  size: string
  color: string
  model: string
}

type DepotFormType = {
  lastName: string
  firstName: string
  phoneNumber: string
  cotisationPayee: boolean
  articles: ArticleFormType[]
}

export function DepotVendeurFormPage() {
  const { register, control, handleSubmit } = useForm<DepotFormType>({
    defaultValues: {
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

  const onSubmit = (data: DepotFormType) => {
    console.log(data)
  }

  const addArticle = () => {
    append({
      price: 0,
      description: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      model: '',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
              ⛷
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Gestion Dépôt-Vente
              </h1>
              <p className="text-sm text-blue-600">Matériel de ski</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Quitter le mode Dépôt</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              Enregistrer un nouveau dépôt vendeur
            </h2>

            {/* Informations du Vendeur */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Informations du Vendeur
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    placeholder="Saisir le nom de famille"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    placeholder="Saisir le prénom"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    {...register('phoneNumber')}
                    placeholder="Saisir le numéro de téléphone"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
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

            {/* Liste des articles déposés */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Liste des articles déposés
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Type
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Marque
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Modèle
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Taille
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Couleur
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Descriptif
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Prix
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b border-gray-100">
                        <td className="py-3 px-2">
                          <select
                            {...register(`articles.${index}.type`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          >
                            <option value="Chaussures">Chaussures</option>
                            <option value="Skis">Skis</option>
                            <option value="Bâtons">Bâtons</option>
                            <option value="Snowboard">Snowboard</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            {...register(`articles.${index}.brand`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            {...register(`articles.${index}.model`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            {...register(`articles.${index}.size`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            {...register(`articles.${index}.color`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            {...register(`articles.${index}.description`)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              {...register(`articles.${index}.price`)}
                              className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                            />
                            <span className="text-sm text-gray-600">€</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <button
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
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
    </div>
  )
}

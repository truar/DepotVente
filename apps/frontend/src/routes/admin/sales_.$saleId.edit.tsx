import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import type { UpdateSaleInput } from '@cmr-apps/types'

import AdminLayout from '@/components/AdminLayout'
import { salesService } from '@/services/implementations/ApiSalesService'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/admin/sales_/$saleId/edit')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  loader: ({ params }) => salesService.getSaleById(params.saleId),
  component: () => (
    <AdminLayout>
      <SaleEditPage />
    </AdminLayout>
  ),
})

function SaleEditPage() {
  const navigate = useNavigate()
  const sale = Route.useLoaderData()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<UpdateSaleInput>({
    defaultValues: {
      cashAmount: sale.cashAmount ?? 0,
      cardAmount: sale.cardAmount ?? 0,
      checkAmount: sale.checkAmount ?? 0,
    },
  })

  const cashAmount = watch('cashAmount')
  const cardAmount = watch('cardAmount')
  const checkAmount = watch('checkAmount')

  // Calculate total when individual amounts change
  const totalAmount =
    (cashAmount ?? 0) + (cardAmount ?? 0) + (checkAmount ?? 0)

  const onSubmit = async (data: UpdateSaleInput) => {
    try {
      await salesService.updateSale(sale.id, data)
      navigate({ to: '/admin/sales' })
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <>
      <div className="text-3xl font-bold text-gray-900 mb-6">
        Édition de la vente #{sale.id.slice(0, 8)}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {errors.root && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sale Info */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">Informations de la vente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Poste de travail:</span> {sale.workstation.name}
              </div>
              <div>
                <span className="font-medium">Nombre d'articles:</span> {sale.articles.length}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Articles vendus</h3>
            <div className="space-y-2">
              {sale.articles.map((article) => (
                <div
                  key={article.id}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium">{article.discipline || 'N/A'}</div>
                    <div className="text-sm text-gray-600">
                      {article.categorie} - {article.brand} - {article.size}
                    </div>
                  </div>
                  <div className="font-semibold">{formatCurrency(Number(article.price))}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Amounts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Montants de paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cashAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant en espèces
                </label>
                <input
                  type="number"
                  id="cashAmount"
                  step="0.01"
                  min="0"
                  {...register('cashAmount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cardAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant par carte
                </label>
                <input
                  type="number"
                  id="cardAmount"
                  step="0.01"
                  min="0"
                  {...register('cardAmount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="checkAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Montant par chèque
                </label>
                <input
                  type="number"
                  id="checkAmount"
                  step="0.01"
                  min="0"
                  {...register('checkAmount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Total Amount (calculated) */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Montant total:</span>
              <span className="text-blue-600">{formatCurrency(totalAmount ?? 0)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/admin/sales' })}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

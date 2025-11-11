import { useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'

import AdminLayout from '@/components/AdminLayout'
import { useRealtimeDeposits } from '@/hooks/useRealtimeDeposits'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/admin/depots')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/admin/login',
      })
    }
  },
  component: () => (
    <AdminLayout>
      <DepotsPage />
    </AdminLayout>
  ),
})

function DepotsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { deposits, loading, error, isConnected } = useRealtimeDeposits(
    page,
    pageSize,
  )

  console.log('🔍 DepotsPage state:', { deposits, loading, error, isConnected })

  const toggleRow = (depositId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(depositId)) {
        newSet.delete(depositId)
      } else {
        newSet.add(depositId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRE_DEPOT':
        return 'Pré-dépôt'
      case 'VALIDE':
        return 'Validé'
      case 'EN_ATTENTE':
        return 'En attente'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRE_DEPOT':
        return 'bg-yellow-100 text-yellow-800'
      case 'VALIDE':
        return 'bg-green-100 text-green-800'
      case 'EN_ATTENTE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getContributionLabel = (status: string) => {
    switch (status) {
      case 'PAYER':
        return 'Payé'
      case 'A_PAYER':
        return 'À payer'
      case 'GRATUIT':
        return 'Gratuit'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Erreur: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dépôts</h1>
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1 rounded text-sm ${
              isConnected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isConnected ? '● Temps réel' : '○ Déconnecté'}
          </div>
        </div>
      </div>

      {!deposits || deposits.data.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-500">
          Aucun dépôt trouvé
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poste de travail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Déposant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nb articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contribution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.data.map((deposit) => (
                  <>
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleRow(deposit.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedRows.has(deposit.id) ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {deposit.workstation?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {deposit.user?.firstName} {deposit.user?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {deposit.articles.length}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(deposit.status)}`}
                        >
                          {getStatusLabel(deposit.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getContributionLabel(deposit.contributionStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(deposit.createdAt.toString())}
                        </div>
                      </td>
                    </tr>

                    {/* Ligne expandable avec les détails des articles */}
                    {expandedRows.has(deposit.id) && (
                      <tr key={`${deposit.id}-details`} className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="text-sm">
                            <h4 className="font-semibold mb-2">
                              Articles déposés :
                            </h4>
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Article
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Description
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Prix unitaire
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {deposit.articles.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                      {item.discipline}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {item.categorie} - {item.brand} -{' '}
                                      {item.size}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      {formatCurrency(Number(item.price))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {deposits.page} sur {deposits.totalPages} ({deposits.total}{' '}
              dépôts au total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(deposits.totalPages, p + 1))
                }
                disabled={page === deposits.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

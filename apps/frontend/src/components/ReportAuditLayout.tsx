import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import type { BilanAuditGroup } from '@/pdf/load-bilan-pdf-data.ts'

type ReportAuditLayoutProps = {
  title: string
  audit: Array<BilanAuditGroup>
  children: ReactNode
}

/**
 * Split view used by admin reports: an on-screen "Audit des calculs" panel on
 * the left (each field, its value, its source and the formula with real
 * numbers) and the PDF preview on the right.
 */
export function ReportAuditLayout({
  title,
  audit,
  children,
}: ReportAuditLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <Link
          to="/reports"
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux rapports
        </Link>
        <h1 className="text-sm font-semibold text-gray-700">{title}</h1>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[440px] shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4">
          <h2 className="mb-1 text-base font-bold text-gray-800">
            Audit des calculs
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Chaque champ du rapport, sa valeur et la formule appliquée (avec les
            valeurs réelles). Permet de vérifier l'origine de chaque chiffre.
          </p>
          <div className="flex flex-col gap-4">
            {audit.map((group) => (
              <section key={group.title}>
                <h3 className="mb-1.5 border-b border-gray-300 pb-1 text-sm font-semibold text-gray-700">
                  {group.title}
                </h3>
                <table className="w-full text-xs">
                  <tbody>
                    {group.entries.map((entry) => (
                      <tr
                        key={entry.label}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="py-1.5 pr-2">
                          <div className="font-medium text-gray-800">
                            {entry.label}
                          </div>
                          <div className="text-[10px] leading-tight text-gray-400">
                            {entry.source}
                          </div>
                          <div className="font-mono text-[10px] leading-tight text-gray-500">
                            = {entry.formula}
                          </div>
                        </td>
                        <td className="whitespace-nowrap py-1.5 text-right font-mono font-semibold text-gray-900">
                          {entry.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

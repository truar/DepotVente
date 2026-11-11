// Page object for the « Récapitulatif des ventes » (/reports/summary-sales,
// admin only): the audit panel beside the PDF, and the files it hands over.
import { openScreen, screen } from '@/test/screen.tsx'

export async function summarySalesPage() {
  const { user } = await openScreen('/reports/summary-sales')
  await screen.findByRole('heading', { name: 'Audit des calculs' })

  return {
    user,
    // The buyers' cheques, for the bank (read it back with
    // lastDownloadedText).
    async exportBuyerChecks() {
      await user.click(
        screen.getByRole('button', {
          name: 'Exporter les chèques clients (CSV)',
        }),
      )
    },
  }
}

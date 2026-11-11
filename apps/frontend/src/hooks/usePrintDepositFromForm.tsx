import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import { getYear } from '@/utils'
import { DepositPdf } from '@/pdf/deposit-pdf.tsx'
import { toDepositPdfData } from '@/pdf/deposit-pdf-data.ts'
import { printPdf } from '@/pdf/print.tsx'
import { previewPdf } from '@/stores/pdfPreviewStore'

export function usePrintDepositFromForm(
  depositType: 'PARTICULIER' | 'PRO' = 'PARTICULIER',
) {
  const { getValues, trigger, setValue, clearErrors } =
    useFormContext<DepositFormType>()
  const buildPdf = useCallback(async () => {
    const valid = await trigger('deposit')
    if (!valid) return
    const formData = getValues('deposit')
    if (formData.contributionStatus == null) {
      // unreachable: trigger() returned valid, so the schema's refine passed
      throw new Error('contributionStatus must be set before printing')
    }
    const data = toDepositPdfData({
      deposit: {
        depositIndex: formData.depotIndex,
        year: getYear(),
        contributionStatus: formData.contributionStatus,
        contributionAmount: formData.contributionAmount,
        type: depositType,
      },
      contact: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
      },
      articles: formData.articles.map((a) => ({
        depositIndex: formData.depotIndex,
        identificationLetter: a.identificationLetter,
        category: a.type,
        brand: a.brand,
        model: a.model,
        discipline: a.discipline,
        size: a.size,
        price: a.price,
        color: a.color,
        isDeleted: a.isDeleted ?? false,
        isAbsent: a.status === 'ABSENT',
      })),
    })
    return {
      title: `Fiche de dépôt ${formData.depotIndex}`,
      document: <DepositPdf data={data} copy={2} />,
    }
  }, [getValues, trigger, depositType])
  const markPrinted = useCallback(() => {
    setValue('isSummaryPrinted', true)
    // « Merci d'imprimer… » ne s'efface sinon qu'au prochain « Valider ».
    clearErrors('root.summary')
  }, [setValue, clearErrors])
  const print = useCallback(async () => {
    const pdf = await buildPdf()
    if (!pdf) return
    await printPdf(pdf.document)
    markPrinted()
  }, [buildPdf, markPrinted])
  // Printing from the « Aperçu » window marks the summary as printed too.
  const preview = useCallback(async () => {
    const pdf = await buildPdf()
    if (!pdf) return
    previewPdf({ ...pdf, onPrint: markPrinted })
  }, [buildPdf, markPrinted])
  return { print, preview }
}

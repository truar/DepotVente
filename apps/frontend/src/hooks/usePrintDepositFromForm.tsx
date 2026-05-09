import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import type { DepositFormType } from '@/types/CreateDepositForm.ts'
import { getYear } from '@/utils'
import { DepositPdf } from '@/pdf/deposit-pdf.tsx'
import { toDepositPdfData } from '@/pdf/deposit-pdf-data.ts'
import { printPdf } from '@/pdf/print.tsx'

export function usePrintDepositFromForm() {
  const { getValues, trigger, setValue } = useFormContext<DepositFormType>()
  return useCallback(async () => {
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
      })),
    })
    await printPdf(<DepositPdf data={data} copy={2} />)
    setValue('isSummaryPrinted', true)
  }, [getValues, trigger, setValue])
}

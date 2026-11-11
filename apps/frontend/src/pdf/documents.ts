import type { DocumentProps } from '@react-pdf/renderer'
import type { FunctionComponent, ReactElement } from 'react'
import { BilanPdf } from '@/pdf/bilan-pdf.tsx'
import { CashTotalsPdf } from '@/pdf/cash-totals-pdf.tsx'
import { CheckListingPdf } from '@/pdf/check-listing-pdf.tsx'
import { DepositCashRegisterControlPdf } from '@/pdf/deposit-cash-register-control-pdf.tsx'
import { DepositPdf, DepositsPdf } from '@/pdf/deposit-pdf.tsx'
import { DepositsMissingContributionPdf } from '@/pdf/deposits-missing-contributions-pdf.tsx'
import { InvoicePdf, InvoicesPdf } from '@/pdf/invoice-pdf.tsx'
import { MaterialPdf } from '@/pdf/material-pdf.tsx'
import { MaterialProPdf } from '@/pdf/material-pro-pdf.tsx'
import { PredepositPdf, PredepositsPdf } from '@/pdf/predeposit-pdf.tsx'
import { RecapDepotsPdf } from '@/pdf/recap-depots-pdf.tsx'
import { RecapVentesPdf } from '@/pdf/recap-ventes-pdf.tsx'
import { ReturnDepositPdf, ReturnDepositsPdf } from '@/pdf/return-deposit-pdf.tsx'
import { SaleCashRegisterControlPdf } from '@/pdf/sale-cash-register-control-pdf.tsx'
import { SellerCheckPdf } from '@/pdf/seller-check.tsx'

// Every document the app prints, by a name the page and the PDF worker
// share. A React element cannot cross to a worker (its type is a function),
// its props can: the page sends the name and the props, the worker builds
// the element again from this list (see print.tsx and render-document.ts).
// A document missing here still prints, rendered in the page.
export const documents: Partial<Record<string, FunctionComponent<any>>> = {
  BilanPdf,
  CashTotalsPdf,
  CheckListingPdf,
  DepositCashRegisterControlPdf,
  DepositPdf,
  DepositsPdf,
  DepositsMissingContributionPdf,
  InvoicePdf,
  InvoicesPdf,
  MaterialPdf,
  MaterialProPdf,
  PredepositPdf,
  PredepositsPdf,
  RecapDepotsPdf,
  RecapVentesPdf,
  ReturnDepositPdf,
  ReturnDepositsPdf,
  SaleCashRegisterControlPdf,
  SellerCheckPdf,
}

const names = new Map<unknown, string>(
  Object.entries(documents).map(([name, component]) => [component, name]),
)

// The name under which the worker knows this document, if it does.
export function documentName(
  element: ReactElement<DocumentProps>,
): string | undefined {
  return names.get(element.type)
}

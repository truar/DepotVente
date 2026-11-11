import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { documents } from '@/pdf/documents.ts'

// What the PDF worker does with a request from the page: build the document
// again from its name and props, and render it (see documents.ts).
export function renderDocument(name: string, props: unknown): Promise<Blob> {
  const component = documents[name]
  if (!component) throw new Error(`Unknown document: ${name}`)
  return pdf(createElement(component, props as object)).toBlob()
}

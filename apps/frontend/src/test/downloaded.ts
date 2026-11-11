// What the browser saved. The app builds a file and hands it over through a
// download link; setup.ts keeps the file and its name, and this reads an
// Excel one back so a story can check what is in it.
import readXlsxFile from 'read-excel-file/node'
import { expect } from 'vitest'
import { downloads } from '@/test/setup.ts'
import { waitFor } from '@/test/screen.tsx'

// The last Excel file saved: its name, and the cells of its single sheet,
// row by row (an empty cell reads null, a date cell a Date).
export async function lastDownloadedSheet() {
  await waitFor(() => expect(downloads.length).toBeGreaterThan(0))
  const { fileName, blob } = downloads.at(-1)!
  const sheets = await readXlsxFile(Buffer.from(await readBlob(blob)))
  expect(sheets).toHaveLength(1)
  return { fileName, sheet: sheets[0].sheet, rows: sheets[0].data }
}

// The last text file saved (a CSV): its name, its first bytes as saved, and
// its text once decoded as UTF-8.
export async function lastDownloadedText() {
  await waitFor(() => expect(downloads.length).toBeGreaterThan(0))
  const { fileName, blob } = downloads.at(-1)!
  const bytes = new Uint8Array(await readBlob(blob))
  return { fileName, bytes, text: new TextDecoder('utf-8').decode(bytes) }
}

// Read through jsdom's FileReader, as printed.ts does for the PDFs.
function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { PDFViewer } from '@react-pdf/renderer'
import { useEffect, useState } from 'react'
import { requireAdmin } from '@/lib/route-guards'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import { Button } from '@/components/ui/button.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import {
  type CheckPrintOffsets,
  DEFAULT_CHECK_PRINT_OFFSETS,
  SellerCheckPdf,
  type SellerCheckPdfProps,
} from '@/pdf/seller-check.tsx'
import { useCheckPrintOffsets } from '@/hooks/useCheckPrintOffsets.ts'
import { printPdf } from '@/pdf/print.tsx'

export const Route = createFileRoute('/settings/check-print')({
  beforeLoad: requireAdmin,
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

const SAMPLE: SellerCheckPdfProps['data'] = {
  seller: 'Toto Titi',
  date: new Date(2025, 3, 23),
  textualAmount: 'cent cinquante deux euro et trois centimes',
  city: 'Rumilly',
  amount: 152.03,
}

type OffsetField = {
  key: keyof CheckPrintOffsets
  label: string
  unit: 'mm' | 'pt'
}

type FieldGroup = {
  title: string
  fields: OffsetField[]
}

const GROUPS: FieldGroup[] = [
  {
    title: 'Décalage global',
    fields: [
      { key: 'outerTranslateX', label: 'Translation horizontale', unit: 'mm' },
      { key: 'outerTranslateY', label: 'Translation verticale', unit: 'mm' },
      { key: 'outerGap', label: 'Écart entre les colonnes', unit: 'mm' },
    ],
  },
  {
    title: 'Colonne gauche (montant en lettres, nom)',
    fields: [
      { key: 'leftMarginLeft', label: 'Marge gauche', unit: 'mm' },
      { key: 'leftMarginTop', label: 'Marge haute', unit: 'mm' },
      { key: 'leftRowGap', label: 'Espace entre les lignes', unit: 'mm' },
      { key: 'textualAmountWidth', label: 'Largeur du montant en lettres', unit: 'mm' },
      { key: 'sellerMarginLeft', label: 'Marge gauche du nom', unit: 'mm' },
      { key: 'sellerWidth', label: 'Largeur du nom', unit: 'mm' },
    ],
  },
  {
    title: 'Colonne droite (montant, ville, date)',
    fields: [
      { key: 'rightMarginTop', label: 'Marge haute', unit: 'mm' },
      { key: 'rightRowGap', label: 'Espace entre les lignes', unit: 'mm' },
      { key: 'amountWidth', label: 'Largeur du montant', unit: 'mm' },
      { key: 'amountFontSize', label: 'Taille de police du montant', unit: 'pt' },
      { key: 'dateCityMarginLeft', label: 'Marge gauche ville/date', unit: 'mm' },
      { key: 'dateCityGap', label: 'Espace entre ville et date', unit: 'mm' },
      { key: 'dateCityWidth', label: 'Largeur ville/date', unit: 'mm' },
    ],
  },
]

const GUIDE_COLOR_PRESETS = [
  '#cccccc',
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
]

function RouteComponent() {
  const [persisted, setPersisted] = useCheckPrintOffsets()
  const [local, setLocal] = useState<CheckPrintOffsets>(persisted)
  const [dirty, setDirty] = useState(false)
  const [guideColor, setGuideColor] = useState<string>(GUIDE_COLOR_PRESETS[0])
  const [showCheckOutline, setShowCheckOutline] = useState<boolean>(true)
  const [showFieldGuides, setShowFieldGuides] = useState<boolean>(true)

  // While the form is "clean" (user hasn't edited yet), keep local state in
  // sync with whatever IndexedDB hydrates into `persisted`. As soon as the
  // user edits a field — or after a successful save — we stop overwriting.
  useEffect(() => {
    if (dirty) return
    setLocal(persisted)
  }, [persisted, dirty])

  const updateField = (key: keyof CheckPrintOffsets, raw: string) => {
    const next = Number(raw)
    if (Number.isNaN(next)) return
    setDirty(true)
    setLocal((prev) => ({ ...prev, [key]: next }))
  }

  const resetDefaults = () => {
    setDirty(true)
    setLocal(DEFAULT_CHECK_PRINT_OFFSETS)
  }

  const effectiveGuideColor = showFieldGuides ? guideColor : undefined

  const printTest = async () => {
    await printPdf(
      <SellerCheckPdf
        data={SAMPLE}
        offsets={local}
        guideColor={effectiveGuideColor}
        showCheckOutline={showCheckOutline}
      />,
    )
  }

  const save = async () => {
    setPersisted(local)
    setDirty(false)
  }

  return (
    <Page
      title="Impression des chèques"
      navigation={<Link to="/settings">Retour aux paramètres</Link>}
    >
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-col gap-5 lg:w-1/2">
          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow"
            >
              <h2 className="text-xl font-semibold">{group.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label
                      htmlFor={`offset-${field.key}`}
                      className="text-sm text-gray-700"
                    >
                      {field.label} ({field.unit})
                    </label>
                    <InputGroup>
                      <InputGroupInput
                        id={`offset-${field.key}`}
                        type="number"
                        step={field.unit === 'mm' ? 0.1 : 1}
                        value={local[field.key]}
                        onChange={(e) => updateField(field.key, e.target.value)}
                      />
                    </InputGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">
                Couleur des repères (impressions empilables sur plusieurs
                feuilles)
              </span>
              <div className="flex flex-row flex-wrap items-center gap-2">
                {GUIDE_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Choisir ${color}`}
                    onClick={() => setGuideColor(color)}
                    className={`h-8 w-8 rounded-full border-2 ${
                      guideColor === color
                        ? 'border-black'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={guideColor}
                  onChange={(e) => setGuideColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border"
                  aria-label="Couleur personnalisée"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showCheckOutline}
                onChange={(e) => setShowCheckOutline(e.target.checked)}
              />
              Afficher le fond gris du chèque (désactiver pour économiser l'encre
              à l'impression)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showFieldGuides}
                onChange={(e) => setShowFieldGuides(e.target.checked)}
              />
              Afficher les repères colorés sur les champs (désactiver pour
              imprimer un vrai chèque)
            </label>
            <div className="flex flex-row flex-wrap gap-3">
              <Button variant="outline" onClick={resetDefaults}>
                Réinitialiser aux valeurs par défaut
              </Button>
              <CustomButton type="button" onClick={printTest}>
                Imprimer un test
              </CustomButton>
              <CustomButton type="button" onClick={save}>
                Valider
              </CustomButton>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:w-1/2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold">Aperçu</h2>
          <p className="text-sm text-gray-600">
            Les rectangles colorés matérialisent l'emplacement des champs. Ils
            apparaissent uniquement sur l'impression de test ; le vrai chèque
            est imprimé sans repères.
          </p>
          <PDFViewer width="100%" height={900}>
            <SellerCheckPdf
              data={SAMPLE}
              offsets={local}
              guideColor={effectiveGuideColor}
              showCheckOutline={showCheckOutline}
            />
          </PDFViewer>
        </div>
      </div>
    </Page>
  )
}

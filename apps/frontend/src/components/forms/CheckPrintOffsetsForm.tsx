import { PDFViewer } from '@react-pdf/renderer'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type {
  CheckPrintOffsets,
  SellerCheckPdfProps,
} from '@/pdf/seller-check.tsx'
import { Button } from '@/components/ui/button.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import {
  DEFAULT_CHECK_PRINT_OFFSETS,
  SellerCheckPdf,
} from '@/pdf/seller-check.tsx'
import { saveCheckPrintOffsets } from '@/hooks/useCheckPrintOffsets.ts'
import { printPdf } from '@/pdf/print.tsx'

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
  fields: Array<OffsetField>
}

const GROUPS: Array<FieldGroup> = [
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
      {
        key: 'textualAmountWidth',
        label: 'Largeur du montant en lettres',
        unit: 'mm',
      },
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
      {
        key: 'amountFontSize',
        label: 'Taille de police du montant',
        unit: 'pt',
      },
      {
        key: 'dateCityMarginLeft',
        label: 'Marge gauche ville/date',
        unit: 'mm',
      },
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

// Un champ vide ou en cours de saisie (« - ») vaut NaN : l'aperçu et
// l'impression de test l'ignorent, le PDF retombe alors sur la valeur par
// défaut de ce champ.
function typedOffsets(
  values: Partial<CheckPrintOffsets>,
): Partial<CheckPrintOffsets> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => Number.isFinite(value)),
  )
}

type Props = {
  // Les décalages enregistrés, lus une seule fois au montage : le formulaire
  // est ensuite seul maître de ses valeurs pendant l'édition.
  stored: CheckPrintOffsets
}

export function CheckPrintOffsetsForm({ stored }: Props) {
  const {
    register,
    control,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CheckPrintOffsets>({ defaultValues: stored })
  const values = useWatch({ control })
  const [guideColor, setGuideColor] = useState(GUIDE_COLOR_PRESETS[0])
  const [showCheckOutline, setShowCheckOutline] = useState(true)
  const [showFieldGuides, setShowFieldGuides] = useState(true)

  const effectiveGuideColor = showFieldGuides ? guideColor : undefined

  // Remet les valeurs par défaut dans les champs ; rien n'est enregistré
  // avant « Valider ».
  const resetDefaults = () =>
    reset(DEFAULT_CHECK_PRINT_OFFSETS, { keepDefaultValues: true })

  const printTest = async () => {
    await printPdf(
      <SellerCheckPdf
        data={SAMPLE}
        offsets={typedOffsets(getValues())}
        guideColor={effectiveGuideColor}
        showCheckOutline={showCheckOutline}
      />,
    )
  }

  // Les champs gardent ce qui vient d'être saisi : rien à recopier depuis la
  // base après l'enregistrement.
  const save = handleSubmit(saveCheckPrintOffsets)

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <form className="flex flex-col gap-5 lg:w-1/2" noValidate onSubmit={save}>
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-xl font-semibold">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map((field) => {
                const error = errors[field.key]?.message
                return (
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
                        aria-invalid={error ? true : undefined}
                        {...register(field.key, {
                          valueAsNumber: true,
                          validate: (value) =>
                            Number.isFinite(value) || 'Nombre attendu',
                        })}
                      />
                    </InputGroup>
                    {error && (
                      <span className="text-sm text-red-600">{error}</span>
                    )}
                  </div>
                )
              })}
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
                    guideColor === color ? 'border-black' : 'border-transparent'
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
            <Button type="button" variant="outline" onClick={resetDefaults}>
              Réinitialiser aux valeurs par défaut
            </Button>
            <CustomButton type="button" onClick={printTest}>
              Imprimer un test
            </CustomButton>
            <CustomButton type="button" onClick={() => save()}>
              Valider
            </CustomButton>
          </div>
        </div>
      </form>
      <div className="flex flex-col gap-2 lg:w-1/2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Aperçu</h2>
        <p className="text-sm text-gray-600">
          Les rectangles colorés matérialisent l'emplacement des champs. Ils
          apparaissent uniquement sur l'impression de test ; le vrai chèque est
          imprimé sans repères.
        </p>
        <PDFViewer width="100%" height={900}>
          <SellerCheckPdf
            data={SAMPLE}
            offsets={typedOffsets(values)}
            guideColor={effectiveGuideColor}
            showCheckOutline={showCheckOutline}
          />
        </PDFViewer>
      </div>
    </div>
  )
}

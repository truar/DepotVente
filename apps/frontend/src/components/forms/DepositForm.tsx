import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import {
  DepositFormSchema,
  DepositFormSchemaPro,
  type DepositFormType,
} from '@/types/CreateDepositForm.ts'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { type KeyboardEvent, memo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  computeContributionAmount,
  generateArticleCode,
  generateIdentificationLetter,
  getYear,
} from '@/utils'
import { cities } from '@/types/cities.ts'
import { disciplineItems } from '@/types/disciplines.ts'
import { brandsItems } from '@/types/brands.ts'
import { categoriesItems } from '@/types/categories.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import { TextField } from '@/components/custom/input/TextField.tsx'
import { DataListField } from '@/components/custom/input/DataListField.tsx'
import {
  CheckCircle2,
  Plus,
  Printer,
  RotateCcwIcon,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Field } from '@/components/ui/field.tsx'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { colors } from '@/types/colors.ts'
import { MonetaryField } from '@/components/custom/input/MonetaryField.tsx'
import { useDymo } from '@/hooks/useDymo.ts'
import { useDebouncedCallback } from 'use-debounce'
import { DepositPdf, type DepositPdfProps } from '@/pdf/deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'

type DepositFormProps = {
  depositIndex: number
  depositType?: 'PARTICULIER' | 'PRO'
  formData?: DepositFormType['deposit']
  mutation: { mutate: (param: DepositFormType['deposit']) => Promise<void> }
  onReset?: () => void
  onSuccess?: () => void
}
export function DepositForm(props: DepositFormProps) {
  const {
    depositIndex,
    depositType = 'PARTICULIER',
    formData,
    mutation,
    onReset,
    onSuccess,
  } = props
  const methods = useForm<DepositFormType>({
    resolver: typedZodResolver(
      depositType === 'PRO' ? DepositFormSchemaPro : DepositFormSchema,
    ),
    mode: 'onSubmit',
    defaultValues: {
      isSummaryPrinted: !!formData && !!formData.id,
      deposit: {
        id: formData?.id,
        depotIndex: depositIndex,
        lastName: formData?.lastName ?? '',
        firstName: formData?.firstName ?? '',
        phoneNumber: formData?.phoneNumber ?? '',
        city: formData?.city ?? '',
        predepositId: formData?.predepositId,
        sellerId: formData?.sellerId,
        contributionStatus: formData?.contributionStatus ?? (null as any),
        contributionAmount: formData?.contributionAmount ?? 0,
        articles: formData?.articles ?? [],
      },
    },
  })
  const { handleSubmit, setValue, reset, setError } = methods

  useEffect(() => {
    setValue('deposit.depotIndex', depositIndex)
  }, [depositIndex, setValue])

  // Sync form data from predeposit loading (create mode only)
  useEffect(() => {
    if (formData && !formData.id) {
      setValue('deposit', formData)
      setValue('deposit.articles', formData.articles)
    }
  }, [formData, setValue])

  const onSubmit: SubmitHandler<DepositFormType> = async (data) => {
    if (!data.isSummaryPrinted) {
      setError('root.summary', {
        message: "Merci d'imprimer la fiche dépôt avant de valider",
      })
      return
    }
    await mutation.mutate(data.deposit)
    if (!formData?.id) {
      // Create mode: clear form for next deposit
      resetForm()
    }
    toast.success(`Dépôt ${depositIndex} enregistré`)
    onSuccess?.()
  }

  const resetForm = useCallback(() => {
    reset()
    onReset?.()
  }, [reset, onReset])

  const checkKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault()
  }, [])

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={checkKeyDown}
        className="flex flex-col gap-4"
      >
        <ErrorMessages />

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-3 py-6 shadow-lg border border-gray-100">
          <SellerInformationForm />
          <ArticleForm depositIndex={depositIndex} />

          <div className="flex justify-end gap-4">
            <SummaryPrintButton />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <CustomButton type="button" variant="destructive">
                  Annuler
                </CustomButton>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Etes vous sur de vouloir annuler ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action va réinitialiser le formulaire. Les données non
                    enregistrées seront perdues.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Non</AlertDialogCancel>
                  <AlertDialogAction onClick={resetForm}>Oui</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <SubmitButton />
          </div>
        </div>
      </form>
    </FormProvider>
  )
}

function SubmitButton() {
  const { formState } = useFormContext<DepositFormType>()
  const { isSubmitting } = formState

  return (
    <CustomButton type="submit" loading={isSubmitting}>
      Valider et enregistrer le dépôt
    </CustomButton>
  )
}

function SellerInformationForm() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Vendeur</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="deposit.lastName"
            render={({ field, fieldState }) => (
              <TextField invalid={fieldState.invalid} {...field} label="Nom" />
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="deposit.firstName"
            render={({ field, fieldState }) => (
              <TextField
                invalid={fieldState.invalid}
                {...field}
                label="Prénom"
              />
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="deposit.phoneNumber"
            render={({ field, fieldState }) => (
              <TextField
                invalid={fieldState.invalid}
                errorMessage={fieldState.error?.message}
                {...field}
                label="Téléphone"
              />
            )}
          />
        </div>
        <div className="grid gap-2">
          <Controller
            name="deposit.city"
            render={({ field, fieldState }) => (
              <DataListField
                invalid={fieldState.invalid}
                {...field}
                items={cities}
                label="Ville"
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

type ArticleFormProps = {
  depositIndex: number
}

function ArticleForm(props: ArticleFormProps) {
  const { depositIndex } = props
  const { fields, append, remove } = useFieldArray<DepositFormType>({
    name: 'deposit.articles',
  })
  const { trigger, getValues } = useFormContext<DepositFormType>()

  const addArticle = useCallback(async () => {
    const articles = getValues('deposit.articles')
    if (articles.length > 0) {
      const valid = await trigger(`deposit.articles.${articles.length - 1}`)
      if (!valid) {
        return
      }
    }
    const year = getYear()
    const identificationLetter = generateIdentificationLetter(articles.length)
    const articleCode = generateArticleCode(
      year,
      depositIndex,
      identificationLetter,
    )
    append({
      price: 0,
      discipline: '',
      brand: '',
      type: '',
      size: '',
      color: '',
      model: '',
      articleCode,
      year,
      depotIndex: depositIndex,
      identificationLetter,
      articleIndex: 1,
      shortArticleCode: `${depositIndex} ${identificationLetter}`,
    })
  }, [depositIndex, trigger, append, getValues])

  const removeArticle = useCallback(
    (index: number) => remove(index),
    [remove],
  )

  const lastIndex = fields.length - 1

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold ">Articles</h3>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Code
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Discipline
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[150px]">
                Catégorie
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Marque
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Descriptif
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600">
                Couleur
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[80px]">
                Taille
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[80px]">
                Prix
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <ArticleLineForm
                key={field.id}
                index={index}
                isLast={index === lastIndex}
                onRemove={removeArticle}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ArticleFormFooter onAddArticle={addArticle} />
    </div>
  )
}

type ArticleFormFooterProps = {
  onAddArticle: () => void
}

const ArticleFormFooter = memo(function ArticleFormFooter(
  props: ArticleFormFooterProps,
) {
  const { onAddArticle } = props
  const { control, setValue, getValues } = useFormContext<DepositFormType>()

  const contributionAmount = useWatch({
    control,
    name: 'deposit.contributionAmount',
  })
  const articles = useWatch({ control, name: 'deposit.articles' })
  const countArticles = articles.filter((article) => !article.isDeleted).length

  useEffect(() => {
    const status = getValues('deposit.contributionStatus')
    if (status === 'GRATUIT' || status === 'PRO') return
    setValue(
      'deposit.contributionAmount',
      computeContributionAmount(countArticles),
    )
  }, [countArticles, getValues, setValue])

  return (
    <div className="flex flex-row justify-between">
      <div>
        <Button type="button" variant="ghost" onClick={onAddArticle}>
          <Plus className="w-5 h-5" />
          Ajouter un nouvel article
        </Button>
      </div>
      <div className="flex flex-row gap-5 items-baseline font-bold">
        <div>Nombre d'articles : {countArticles}</div>
        <div>Montant droit de dépôt : {contributionAmount}€</div>
        <div>
          <Controller
            name="deposit.contributionStatus"
            render={({ field: controllerField, fieldState }) => (
              <Field
                orientation="responsive"
                data-invalid={fieldState.invalid}
              >
                <Select
                  name={controllerField.name}
                  value={controllerField.value ?? ''}
                  onValueChange={(value) => {
                    controllerField.onChange(value)
                    setValue(
                      'deposit.contributionAmount',
                      value === 'GRATUIT' || value === 'PRO'
                        ? 0
                        : computeContributionAmount(countArticles),
                    )
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="A_PAYER">A payer</SelectItem>
                      <SelectItem value="PAYEE">Payée</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="GRATUIT">Gratuit</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  )
})

type ArticleLineFormProps = {
  index: number
  isLast: boolean
  onRemove: (index: number) => void
}

type ArticleLineLockState = 'editable' | 'deleted' | 'sold' | 'returned'

const articleLineBgClass: Record<ArticleLineLockState, string> = {
  editable: '',
  deleted: 'bg-gray-100 opacity-60',
  sold: 'bg-green-50',
  returned: 'bg-blue-50',
}

const ArticleLineForm = memo(function ArticleLineForm(
  props: ArticleLineFormProps,
) {
  const { index, isLast, onRemove } = props
  const { setValue, watch } = useFormContext<DepositFormType>()
  const softDeletionEnabled = watch(
    `deposit.articles.${index}.softDeletionEnabled`,
  )
  const labelPrinted = watch(`deposit.articles.${index}.labelPrinted`)
  const isDeleted = watch(`deposit.articles.${index}.isDeleted`)
  const status = watch(`deposit.articles.${index}.status`)
  const canHardDelete = isLast && !labelPrinted && !softDeletionEnabled
  const lockState: ArticleLineLockState =
    status === 'SOLD'
      ? 'sold'
      : status === 'RETURNED'
        ? 'returned'
        : isDeleted
          ? 'deleted'
          : 'editable'
  const isLocked = lockState !== 'editable'
  const cellClass = `py-1 px-1 ${articleLineBgClass[lockState]}`
  return (
    <tr className="border-b border-gray-100">
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.shortArticleCode`}
          render={({ field, fieldState }) => (
            <TextField
              invalid={fieldState.invalid}
              {...field}
              readOnly={true}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.discipline`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={disciplineItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.type`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={categoriesItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.brand`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={brandsItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.model`}
          render={({ field, fieldState }) => (
            <TextField
              invalid={fieldState.invalid}
              {...field}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.color`}
          render={({ field, fieldState }) => (
            <DataListField
              invalid={fieldState.invalid}
              {...field}
              items={colors}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <Controller
          name={`deposit.articles.${index}.size`}
          render={({ field, fieldState }) => (
            <TextField
              invalid={fieldState.invalid}
              {...field}
              readOnly={isLocked}
            />
          )}
        />
      </td>
      <td className={cellClass}>
        <div className="flex items-center gap-1">
          <Controller
            name={`deposit.articles.${index}.price`}
            render={({ field, fieldState }) => (
              <MonetaryField
                invalid={fieldState.invalid}
                {...field}
                readOnly={isLocked}
              />
            )}
          />
        </div>
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center">
          {lockState === 'sold' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              Vendu
            </span>
          ) : lockState === 'returned' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md">
              <Undo2 className="w-3 h-3" />
              Rendu
            </span>
          ) : (
            <>
              <PrintArticleButton index={index} disabled={isLocked} />
              {lockState === 'deleted' ? (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    setValue(`deposit.articles.${index}.isDeleted`, false)
                  }
                  className="p-2 text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <RotateCcwIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    canHardDelete
                      ? onRemove(index)
                      : setValue(`deposit.articles.${index}.isDeleted`, true)
                  }
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
})

type PrintArticleButtonProps = {
  index: number
  disabled?: boolean
}

function PrintArticleButton(props: PrintArticleButtonProps) {
  const { index } = props
  const dymo = useDymo()
  const { trigger, getValues, setValue } = useFormContext<DepositFormType>()

  const printDymo = useCallback(async () => {
    const valid = await trigger(`deposit.articles.${index}`)
    if (!valid) return
    const field = getValues(`deposit.articles.${index}`)
    const printed = dymo.print({
      color: field.color,
      brand: field.brand,
      size: field.size ?? '',
      category: field.type,
      code: field.articleCode,
      price: `${field.price}`,
      shortCode: field.shortArticleCode,
      model: field.model ?? '',
    })
    if (printed) {
      setValue(`deposit.articles.${index}.labelPrinted`, true)
    }
  }, [dymo, getValues, setValue, index])

  const debouncedPrintDymo = useDebouncedCallback(printDymo, 1000)

  return (
    <CustomButton
      type="button"
      variant="ghost"
      onClick={debouncedPrintDymo}
      disabled={props.disabled}
    >
      <Printer className="w-4 h-4" />
    </CustomButton>
  )
}

function SummaryPrintButton() {
  const { getValues, trigger, setValue } = useFormContext<DepositFormType>()
  const print = async () => {
    const valid = await trigger('deposit')
    if (!valid) {
      return
    }
    const formData = getValues('deposit')
    if (formData.contributionStatus == null) {
      // unreachable: trigger() returned valid, so the schema's refine passed
      throw new Error('contributionStatus must be set before printing')
    }
    const year = getYear()
    const data: DepositPdfProps['data'] = {
      deposit: {
        depositIndex: formData.depotIndex,
        year,
        contributionStatus: formData.contributionStatus,
        contributionAmount: formData.contributionAmount,
      },
      contact: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
      },
      articles: formData.articles.map((article) => ({
        shortCode: `${formData.depotIndex} ${article.identificationLetter}`,
        category: article.type,
        brand: article.brand,
        model: article.model ?? '',
        discipline: article.discipline,
        size: article.size ?? '',
        price: article.price,
        color: article.color,
        isDeleted: article.isDeleted,
      })),
    }
    await printPdf(<DepositPdf data={data} copy={2} />)
    setValue('isSummaryPrinted', true)
  }

  return (
    <CustomButton type="button" onClick={print} variant="secondary">
      Imprimer
    </CustomButton>
  )
}

function ErrorMessages() {
  const {
    formState: { errors },
  } = useFormContext<DepositFormType>()

  const printError = errors.root?.summary?.message
  const hasFieldErrors = Object.keys(errors).some((key) => key !== 'root')

  if (!printError && !hasFieldErrors) return null

  return (
    <ul className="pl-3 text-red-600">
      {printError && <li>{printError}</li>}
      {hasFieldErrors && <li>Merci de compléter les champs obligatoires</li>}
    </ul>
  )
}

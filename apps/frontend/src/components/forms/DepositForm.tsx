import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import {
  DepositFormSchema,
  type DepositFormType,
} from '@/types/CreateDepositForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
import { type KeyboardEvent, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  computeContributionAmount,
  generateArticleCode,
  generateIdentificationLetter,
  getYear,
} from '@/utils'
import { fakerFR as faker } from '@faker-js/faker'
import { cities } from '@/types/cities.ts'
import { disciplineItems, disciplines } from '@/types/disciplines.ts'
import { brands, brandsItems } from '@/types/brands.ts'
import { categories, categoriesItems } from '@/types/categories.ts'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import { TextField } from '@/components/custom/input/TextField.tsx'
import { DataListField } from '@/components/custom/input/DataListField.tsx'
import { Plus, Printer, RotateCcwIcon, Trash2 } from 'lucide-react'
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
  formData?: DepositFormType['deposit']
  mutation: { mutate: (param: DepositFormType['deposit']) => Promise<void> }
}
export function DepositForm(props: DepositFormProps) {
  const { depositIndex, formData, mutation } = props
  const [countArticle, setCountArticle] = useState(
    formData?.articles?.length ?? 0,
  )
  const methods = useForm<DepositFormType>({
    resolver: zodResolver(DepositFormSchema),
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
        contributionStatus: formData?.contributionStatus ?? 'A_PAYER',
        contributionAmount: formData?.contributionAmount ?? 2,
        articles: formData?.articles ?? [],
      },
    },
  })
  const { handleSubmit, setValue, reset } = methods

  useEffect(() => {
    setValue('deposit.depotIndex', depositIndex)
  }, [depositIndex, setValue])

  // TODO Checkme, setValue does not seem to update fieldArray
  useEffect(() => {
    if (formData) {
      setValue('deposit', formData)
      setValue('deposit.articles', formData.articles)
    }
  }, [formData, setValue])

  const onSubmit: SubmitHandler<DepositFormType> = async (data) => {
    await mutation.mutate(data.deposit)
    reset()
    setCountArticle(0)
    toast.success(`Dépôt ${depositIndex} enregistré`)
  }

  const generateFakeDeposit = useCallback(() => {
    if (!depositIndex) return
    setValue('isSummaryPrinted', true)
    setValue('deposit.lastName', faker.person.lastName())
    setValue('deposit.firstName', faker.person.firstName())
    setValue('deposit.phoneNumber', faker.phone.number({ style: 'national' }))
    setValue('deposit.city', faker.helpers.arrayElement(cities))
    setValue('deposit.contributionStatus', 'PAYEE')
    const nbArticles = 11
    setValue(
      'deposit.articles',
      Array.from({ length: nbArticles }).map((_, index) => {
        const year = getYear()
        const identificationLetter = generateIdentificationLetter(index)
        const articleCode = generateArticleCode(
          year,
          depositIndex,
          identificationLetter,
        )
        return {
          price: parseFloat(faker.commerce.price({ min: 10, max: 150 })),
          discipline: faker.helpers.arrayElement(disciplines),
          brand: faker.helpers.arrayElement(brands),
          type: faker.helpers.arrayElement(categories),
          size: faker.number.int({ min: 1, max: 180 }) + '',
          color: faker.color.human(),
          model: faker.commerce.productName(),
          articleCode,
          year,
          depotIndex: depositIndex,
          identificationLetter,
          softDeletionEnabled: false,
          articleIndex: index,
          shortArticleCode: `${depositIndex} ${identificationLetter}`,
        }
      }) as DepositFormType['deposit']['articles'],
    )
    setCountArticle(nbArticles)
  }, [depositIndex, setValue])

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
          <ArticleForm
            onArticleAdd={() => setCountArticle(countArticle + 1)}
            articleCount={countArticle}
            depositIndex={depositIndex}
          />

          <div className="flex justify-end gap-4">
            <CustomButton
              type="button"
              onClick={() => generateFakeDeposit()}
              variant="secondary"
            >
              Générer une fausse vente
            </CustomButton>
            <SummaryPrintButton />
            <CustomButton
              type="button"
              onClick={() => reset()}
              variant="destructive"
            >
              Annuler
            </CustomButton>
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
  onArticleAdd: () => void
  articleCount: number
  depositIndex: number
}

function ArticleForm(props: ArticleFormProps) {
  const { onArticleAdd, articleCount, depositIndex } = props
  const { fields, append, remove } = useFieldArray<DepositFormType>({
    name: 'deposit.articles',
  })
  const { trigger, setValue, watch } = useFormContext<DepositFormType>()

  const addArticle = useCallback(async () => {
    const valid = await trigger(`deposit.articles.${fields.length - 1}`)
    if (!valid) {
      return
    }
    const year = getYear()
    const identificationLetter = generateIdentificationLetter(articleCount)
    const articleCode = generateArticleCode(
      year,
      depositIndex,
      identificationLetter,
    )
    append({
      price: 0,
      discipline: null,
      brand: null,
      type: null,
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
    onArticleAdd()
  }, [fields, depositIndex, articleCount])

  const contributionAmount = watch('deposit.contributionAmount')
  const articles = watch('deposit.articles')
  const countArticles = articles.filter((article) => !article.isDeleted).length

  useEffect(() => {
    setValue(
      'deposit.contributionAmount',
      computeContributionAmount(countArticles),
    )
  }, [countArticles])

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
                onRemove={() => remove(index)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-row justify-between">
        <div>
          <Button type="button" variant="ghost" onClick={addArticle}>
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
                    value={controllerField.value}
                    onValueChange={controllerField.onChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Status" />
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
    </div>
  )
}

type ArticleLineFormProps = {
  index: number
  onRemove: () => void
}

function ArticleLineForm(props: ArticleLineFormProps) {
  const { index, onRemove } = props
  const { setValue, watch } = useFormContext<DepositFormType>()
  const softDeletionEnabled = watch(
    `deposit.articles.${index}.softDeletionEnabled`,
  )
  const isLineDisabled = watch(`deposit.articles.${index}.isDeleted`)
  return (
    <tr className="border-b border-gray-100">
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
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
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.discipline`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={disciplineItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.type`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={categoriesItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.brand`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={brandsItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.model`}
          render={({ field, fieldState }) => (
            <TextField
              invalid={fieldState.invalid}
              {...field}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.color`}
          render={({ field, fieldState }) => (
            <DataListField
              invalid={fieldState.invalid}
              {...field}
              items={colors}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.size`}
          render={({ field, fieldState }) => (
            <TextField
              invalid={fieldState.invalid}
              {...field}
              readOnly={isLineDisabled}
            />
          )}
        />
      </td>
      <td
        className={`py-1 px-1 ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <div className="flex items-center gap-1">
          <Controller
            name={`deposit.articles.${index}.price`}
            render={({ field, fieldState }) => (
              <MonetaryField
                invalid={fieldState.invalid}
                {...field}
                readOnly={isLineDisabled}
              />
            )}
          />
        </div>
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center">
          <PrintArticleButton index={index} disabled={isLineDisabled} />
          {isLineDisabled ? (
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
                softDeletionEnabled
                  ? setValue(`deposit.articles.${index}.isDeleted`, true)
                  : onRemove()
              }
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

type PrintArticleButtonProps = {
  index: number
  disabled?: boolean
}

function PrintArticleButton(props: PrintArticleButtonProps) {
  const { index } = props
  const dymo = useDymo()
  const { trigger, getValues } = useFormContext<DepositFormType>()

  const printDymo = useCallback(async () => {
    const valid = await trigger(`deposit.articles.${index}`)
    if (!valid) return
    const field = getValues(`deposit.articles.${index}`)
    dymo.print({
      color: field.color,
      brand: field.brand,
      size: field.size,
      category: field.type,
      code: field.articleCode,
      price: `${field.price}`,
      shortCode: field.shortArticleCode,
      model: field.model,
    })
  }, [dymo, getValues, index])

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
      articles: formData.articles
        .filter((article) => !article.isDeleted)
        .map((article) => ({
          shortCode: `${formData.depotIndex} ${article.identificationLetter}`,
          category: article.type,
          brand: article.brand,
          model: article.model,
          discipline: article.discipline,
          size: article.size,
          price: article.price,
          color: article.color,
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
  // console.log(errors)
  const errorsDisplayed = Object.keys(errors).map((key, index) => {
    if (typeof errors[key]?.message === 'string') {
      return <li key={index}>{errors[key]?.message}</li>
    }
    return null
  })
  if (errorsDisplayed.length === 0) return null
  return (
    <ul className="pl-3 text-red-600">
      Merci de compléter les champs obligatoires
    </ul>
  )
}

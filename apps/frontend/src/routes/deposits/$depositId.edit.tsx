import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import {
  Controller,
  FormProvider,
  type SubmitHandler,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type KeyboardEvent, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { citiesItems } from '@/types/cities.ts'
import { getYear, shortArticleCode } from '@/utils'
import { disciplineItems } from '@/types/disciplines.ts'
import { brandsItems } from '@/types/brands.ts'
import { categoriesItems } from '@/types/categories.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { Button } from '@/components/ui/button.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { CheckLineIcon, Euro, Printer, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'
import { colors } from '@/types/colors.ts'
import { useDymo } from '@/hooks/useDymo.ts'
import { useDebouncedCallback } from 'use-debounce'
import { DepositPdf, type DepositPdfProps } from '@/pdf/deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Article, type Contact, db, type Deposit } from '@/db.ts'
import { Page } from '@/components/Page.tsx'
import {
  EditDepositFormSchema,
  type EditDepositFormType,
} from '@/types/EditDepositForm.ts'

export const Route = createFileRoute('/deposits/$depositId/edit')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => (
    <PublicLayout>
      <RouteComponent />
    </PublicLayout>
  ),
})

function RouteComponent() {
  const { depositId } = Route.useParams()

  const deposit = useLiveQuery(() => db.deposits.get(depositId))
  const contact = useLiveQuery(
    () => db.contacts.get(deposit?.sellerId ?? ''),
    [deposit],
  )
  const articles = useLiveQuery(
    () => db.articles.where({ depositId }).sortBy('code'),
    [depositId],
  )
  if (!deposit || !contact || !articles) return
  return (
    <Page
      navigation={
        <Link to={'/deposits/listing'}>Retour à la liste des dépôts</Link>
      }
      title={`Modifier le dépôt ${deposit.depositIndex}`}
    >
      <DepositForm deposit={deposit} seller={contact} articles={articles} />
    </Page>
  )
}
type DepositFormProps = {
  deposit: Deposit
  articles: Article[]
  seller: Contact
}
function DepositForm(props: DepositFormProps) {
  const { deposit, articles, seller } = props
  const methods = useForm<EditDepositFormType>({
    resolver: zodResolver(EditDepositFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      isSummaryPrinted: true,
      deposit: {
        id: deposit.id,
        depotIndex: deposit.depositIndex,
        sellerId: seller.id,
        lastName: seller.lastName,
        firstName: seller.firstName,
        phoneNumber: seller.phoneNumber,
        city: seller.city,
        contributionStatus: deposit.contributionStatus,
        contributionAmount: deposit.contributionAmount,
        articles: articles.map((article) => ({
          id: article.id,
          articleCode: article.code,
          price: article.price,
          color: article.color,
          status: article.status,
          depotIndex: article.depositIndex,
          articleIndex: article.articleIndex,
          discipline: article.discipline,
          size: article.size,
          year: article.year,
          type: article.category,
          model: article.model,
          brand: article.brand,
          shortArticleCode: shortArticleCode(
            article.depositIndex,
            article.articleIndex,
          ),
        })),
      },
    },
  })
  const { handleSubmit, reset } = methods

  const onSubmit: SubmitHandler<EditDepositFormType> = async (data) => {
    console.log(data)
    toast.success(`Dépôt ${deposit.depositIndex} enregistré`)
  }

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

        <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
          <SellerInformationForm />
          <ArticleForm />

          <div className="flex justify-end gap-4">
            <SummaryPrintButton />
            <CustomButton
              type="button"
              onClick={() => reset()}
              variant="destructive"
            >
              Annuler les modifications
            </CustomButton>
            <SubmitButton />
          </div>
        </div>
      </form>
    </FormProvider>
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
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="lastName">Nom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="lastName"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="deposit.firstName"
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="firstName">Prénom</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="firstName"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Controller
            name="deposit.phoneNumber"
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="phoneNumber">Téléphone</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      id="phoneNumber"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Controller
            name="deposit.city"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="city">Ville</Label>
                  <Combobox
                    invalid={fieldState.invalid}
                    items={citiesItems}
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function SubmitButton() {
  const { formState } = useFormContext<EditDepositFormType>()
  const { isSubmitting } = formState

  return (
    <CustomButton type="submit" loading={isSubmitting}>
      Valider et enregistrer le dépôt
    </CustomButton>
  )
}

function ArticleForm() {
  const { fields } = useFieldArray<EditDepositFormType>({
    name: 'deposit.articles',
  })
  const { watch } = useFormContext<EditDepositFormType>()

  const contributionAmount = watch('deposit.contributionAmount')

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold ">Articles</h3>

      <div className="overflow-x-auto overflow-y-scroll">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[100px]">
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
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Taille
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Prix
              </th>
              <th className="text-left py-1 px-1 text-sm font-medium text-gray-600 w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <ArticleLineForm key={field.id} index={index} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-row justify-end">
        <div className="flex flex-row gap-5 items-baseline">
          <div>Nombre d'articles : {fields.length}</div>
          <div>Montant droit de dépôt : {contributionAmount}€</div>
          <div>
            <Controller
              name="deposit.contributionStatus"
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
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
}

function ArticleLineForm(props: ArticleLineFormProps) {
  const { index } = props
  const { setValue, watch } = useFormContext<EditDepositFormType>()
  const markAsRefused = useCallback(
    (index: number) => {
      setValue(`deposit.articles.${index}.status`, 'REFUSED')
    },
    [setValue],
  )
  const markAsReceived = useCallback(
    (index: number) => {
      setValue(`deposit.articles.${index}.status`, 'RECEPTION_OK')
    },
    [setValue],
  )
  const colorOptions = useMemo(() => {
    return colors.map((color) => <option key={color} value={color}></option>)
  }, [colors])

  const articleStatus = watch(`deposit.articles.${index}.status`)
  const isLineDisabled = articleStatus === 'REFUSED'
  return (
    <tr className="border-b border-gray-100">
      <td
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.shortArticleCode`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                    readOnly
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
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
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
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
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
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
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.model`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                    readOnly={isLineDisabled}
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.color`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    list={`articles-${index}-color-list`}
                    id={`articles-${index}-color`}
                    aria-invalid={fieldState.invalid}
                    type="text"
                    readOnly={isLineDisabled}
                  />
                  <datalist id={`articles-${index}-color-list`}>
                    {colorOptions}
                  </datalist>
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td
        className={`py-1 p"x-1 w-[75px]" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <Controller
          name={`deposit.articles.${index}.size`}
          render={({ field: controllerField, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    {...controllerField}
                    aria-invalid={fieldState.invalid}
                    type="text"
                    readOnly={isLineDisabled}
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          )}
        />
      </td>
      <td
        className={`"py-1 px-1" + ${isLineDisabled ? 'bg-gray-100 opacity-60' : ''}`}
      >
        <div className="flex items-center gap-1">
          <Controller
            name={`deposit.articles.${index}.price`}
            render={({ field: controllerField, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      {...controllerField}
                      aria-invalid={fieldState.invalid}
                      type="text"
                      readOnly={isLineDisabled}
                    />
                    <Euro className="w-5 pr-1" />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </td>
      <td className="py-1 px-1">
        <div className="flex items-center gap-2">
          <PrintArticleButton index={index} disabled={isLineDisabled} />
          {isLineDisabled ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => markAsReceived(index)}
              className="p-2 text-green-800 hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckLineIcon className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              type="button"
              onClick={() => markAsRefused(index)}
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
  const { index, disabled } = props
  const dymo = useDymo()
  const { trigger, getValues } = useFormContext<EditDepositFormType>()

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
      disabled={disabled}
    >
      <Printer className="w-4 h-4" />
    </CustomButton>
  )
}

function SummaryPrintButton() {
  const { getValues, trigger, setValue } = useFormContext<EditDepositFormType>()
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
      articles: formData.articles.map((article) => ({
        shortCode: `${formData.depotIndex} ${article.articleIndex}`,
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
  } = useFormContext<EditDepositFormType>()

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

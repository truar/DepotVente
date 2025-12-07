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
import { cities } from '@/types/cities.ts'
import { getYear } from '@/utils'
import { disciplineItems } from '@/types/disciplines.ts'
import { brandsItems } from '@/types/brands.ts'
import { categoriesItems } from '@/types/categories.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { Label } from '@/components/ui/label.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Euro } from 'lucide-react'
import { colors } from '@/types/colors.ts'
import { DepositPdf, type DepositPdfProps } from '@/pdf/deposit-pdf.tsx'
import { printPdf } from '@/pdf/print.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Article, type Contact, db, type Sale } from '@/db.ts'
import { Page } from '@/components/Page.tsx'
import { type EditDepositFormType } from '@/types/EditDepositForm.ts'
import { type EditSaleFormType, EditSaleSchema } from '@/types/EditSaleForm.ts'

export const Route = createFileRoute('/sales/$saleId/edit')({
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
  const { saleId } = Route.useParams()

  const sale = useLiveQuery(() => db.sales.get(saleId))
  const contact = useLiveQuery(
    () => db.contacts.get(sale?.buyerId ?? ''),
    [sale],
  )
  const articles = useLiveQuery(
    () => db.articles.where({ saleId }).sortBy('code'),
    [saleId],
  )
  if (!sale || !contact || !articles) return
  return (
    <Page
      navigation={
        <Link to={'/sales/listing'}>Retour à la liste des ventes</Link>
      }
      title={`Modifier la vente ${sale.saleIndex}`}
    >
      <SaleForm sale={sale} buyer={contact} articles={articles} />
    </Page>
  )
}
type SaleFormProps = {
  sale: Sale
  articles: Article[]
  buyer: Contact
}
function SaleForm(props: SaleFormProps) {
  const { sale, articles, buyer } = props
  const methods = useForm<EditSaleFormType>({
    resolver: zodResolver(EditSaleSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: sale.id,
      saleIndex: sale.saleIndex,
      checkAmount: sale.checkAmount,
      cashAmount: sale.cashAmount,
      cardAmount: sale.cardAmount,
      city: buyer.city,
      lastName: buyer.lastName,
      contactId: buyer.id,
      firstName: buyer.firstName,
      phoneNumber: buyer.phoneNumber,
      articles: articles.map((article) => ({
        id: article.id,
        articleCode: article.code,
        price: article.price,
        color: article.color,
        model: article.model,
        brand: article.brand,
        category: article.category,
        size: article.size,
        discipline: article.discipline,
      })),
    },
  })
  const { handleSubmit, reset } = methods
  const onSubmit: SubmitHandler<EditSaleFormType> = async (data) => {
    console.log(data)
    toast.success(`Vente ${data.saleIndex} enregistré`)
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
          <BuyerInformationForm />
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

function BuyerInformationForm() {
  const cityOptions = useMemo(() => {
    return cities.map((city) => <option key={city} value={city}></option>)
  }, [cities])
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl font-bold">Acheteur</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="grid gap-2">
          <Controller
            name="lastName"
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
            name="firstName"
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
            name="phoneNumber"
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
            name="city"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="city">Ville</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      list="city-list"
                      id="city"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    <datalist id="city-list">{cityOptions}</datalist>
                  </InputGroup>
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
  const { formState } = useFormContext<EditSaleFormType>()
  const { isSubmitting } = formState

  return (
    <CustomButton type="submit" loading={isSubmitting}>
      Valider et enregistrer le dépôt
    </CustomButton>
  )
}

function ArticleForm() {
  const { fields } = useFieldArray<EditSaleFormType>({
    name: 'articles',
  })

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
  const colorOptions = useMemo(() => {
    return colors.map((color) => <option key={color} value={color}></option>)
  }, [colors])

  return (
    <tr className="border-b border-gray-100">
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.articleCode`}
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
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.discipline`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={disciplineItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.category`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={categoriesItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.brand`}
          render={({ field, fieldState }) => (
            <Combobox
              invalid={fieldState.invalid}
              items={brandsItems}
              onSelect={field.onChange}
              value={field.value}
              readOnly
            />
          )}
        />
      </td>
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.model`}
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
      <td className="py-1 px-1">
        <Controller
          name={`articles.${index}.color`}
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
                    readOnly
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
      <td className="py-1 px-1 w-[75px]">
        <Controller
          name={`articles.${index}.size`}
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
      <td className="py-1 px-1">
        <div className="flex items-center gap-1">
          <Controller
            name={`articles.${index}.price`}
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
                    <Euro className="w-5 pr-1" />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </td>
    </tr>
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

import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
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
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Input } from '@/components/ui/input.tsx'
import { CustomButton } from '@/components/custom/Button.tsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { type Article, db } from '@/db.ts'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Euro, FolderXIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { EditArticleFormType } from '@/types/EditArticleForm.ts'
import { EditArticleSchema } from '@/types/EditArticleForm.ts'
import { typedZodResolver } from '@/lib/typed-zod-resolver.ts'
import { shortArticleCode } from '@/utils'
import { Field, FieldContent } from '@/components/ui/field.tsx'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group.tsx'
import { Label } from '@/components/ui/label.tsx'
import { categoriesItems } from '@/types/categories.ts'
import { Combobox } from '@/components/Combobox.tsx'
import { disciplineItems } from '@/types/disciplines.ts'
import { brandsItems } from '@/types/brands.ts'
import { colors } from '@/types/colors.ts'
import { useEditArticle } from '@/hooks/useEditArticle.ts'
import { useDymo } from '@/hooks/useDymo.ts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx'

export const Route = createFileRoute('/deposits/articles')({
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
  return (
    <Page
      title="Modifier un article"
      navigation={<Link to={'..'}>Retour au menu</Link>}
    >
      <ArticleEditPage />
    </Page>
  )
}

function ArticleEditPage() {
  const [code, setCode] = useState<string>('')
  return (
    <div className="flex flex-col gap-5">
      <ArticleSearchInput onClick={setCode} />
      <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
        <ArticleEditComponent articleCode={code} onSubmit={() => setCode('')} />
      </div>
    </div>
  )
}

type ArticleSearchInputProps = {
  onClick: (code: string) => void
}

function ArticleSearchInput(props: ArticleSearchInputProps) {
  const { onClick } = props
  const [code, setCode] = useState<string>('')
  const checkKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        submit()
      }
    },
    [code],
  )
  const submit = useCallback(() => {
    onClick(code)
    setCode('')
  }, [code])
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-3">
        <div>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: 2026 1001A"
            onKeyDown={checkKeyDown}
            autoFocus
          />
        </div>
        <div>
          <CustomButton onClick={submit}>Modifier</CustomButton>
        </div>
      </div>
    </div>
  )
}
type ArticleEditComponentProps = {
  articleCode: string
  onSubmit?: () => void
}
function ArticleEditComponent(props: ArticleEditComponentProps) {
  const { articleCode, onSubmit } = props
  const article = useLiveQuery(
    () => db.articles.where({ code: articleCode }).first(),
    [articleCode],
  )
  if (!article) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderXIcon />
          </EmptyMedia>
          <EmptyTitle>Aucun article</EmptyTitle>
          {articleCode && (
            <EmptyDescription>
              La référence {articleCode} n'existe pas
            </EmptyDescription>
          )}
        </EmptyHeader>
      </Empty>
    )
  }
  return <ArticleEditForm article={article} onSubmit={onSubmit} />
}

type ArticleEditFormProps = {
  article: Article
  onSubmit?: () => void
}

function ArticleEditForm(props: ArticleEditFormProps) {
  const { article } = props
  const navigate = useNavigate()
  const dymo = useDymo()
  const articleEditMutation = useEditArticle()
  const methods = useForm<EditArticleFormType>({
    resolver: typedZodResolver(EditArticleSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: article.id,
      price: article.price,
      brand: article.brand,
      type: article.category,
      size: article.size,
      color: article.color,
      model: article.model,
      status: article.status,
      discipline: article.discipline,
      articleCode: article.code,
      shortArticleCode: shortArticleCode(
        article.depositIndex,
        article.identificationLetter,
      ),
    },
  })
  const { handleSubmit, control, reset, trigger, getValues } = methods
  const status = useWatch({ control, name: 'status' })
  useEffect(() => {
    reset({
      id: article.id,
      status: article.status,
      price: article.price,
      brand: article.brand,
      type: article.category,
      size: article.size,
      color: article.color,
      model: article.model,
      discipline: article.discipline,
      articleCode: article.code,
      shortArticleCode: shortArticleCode(
        article.depositIndex,
        article.identificationLetter,
      ),
    })
  }, [article])
  const colorOptions = useMemo(() => {
    return colors.map((color) => <option key={color} value={color}></option>)
  }, [colors])

  const onSubmit = useCallback(
    async (data: EditArticleFormType) => {
      await articleEditMutation.mutate(data)
      if (props.onSubmit) props.onSubmit()
      toast.success(`Article ${data.articleCode} mis à jour`)
      navigate({ to: '..' })
    },
    [articleEditMutation, navigate],
  )
  const printDymo = useCallback(async () => {
    const valid = await trigger()
    if (!valid) return
    const field = getValues()
    dymo.print({
      color: field.color,
      brand: field.brand,
      size: field.size,
      category: field.type,
      code: field.articleCode,
      price: `${field.price}`,
      shortCode: field.shortArticleCode,
      model: field.model ?? '',
    })
  }, [dymo, getValues])
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <Controller
            control={control}
            name="shortArticleCode"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label>Code</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      type="text"
                      readOnly
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="min-w-[200px]">
          <Controller
            control={control}
            name="discipline"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="discipline">Discipline</Label>
                  <Combobox
                    invalid={fieldState.invalid}
                    items={disciplineItems}
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="min-w-[200px]">
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label>Catégorie</Label>
                  <Combobox
                    invalid={fieldState.invalid}
                    items={categoriesItems}
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="min-w-[200px]">
          <Controller
            control={control}
            name="brand"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label>Marque</Label>
                  <Combobox
                    invalid={fieldState.invalid}
                    items={brandsItems}
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="model"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="model">Descriptif</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      type="text"
                      id="model"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="color"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="color">Couleur</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      list="color-list"
                      id="color"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    <datalist id="color-list">{colorOptions}</datalist>
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="size"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="size">Taille</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="size"
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div>
          <Controller
            control={control}
            name="price"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="price">Prix</Label>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      type="text"
                    />
                    <Euro className="w-5 pr-1" />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />
        </div>
        <div className="min-w-[200px]">
          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="status"
                      aria-invalid={fieldState.invalid}
                      className="min-w-[120px]"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectItem value="RECEPTION_PENDING">
                        Réception en attente
                      </SelectItem>
                      <SelectItem value="RECEPTION_OK">Réception OK</SelectItem>
                      <SelectItem value="SOLD">Vendu</SelectItem>
                      <SelectItem value="DELETED">Supprimé</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            )}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4">
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
                Cette action va annuler les modifications. Les données non
                enregistrées seront perdues.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate({ to: '..' })}>
                Oui
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CustomButton
          type="button"
          onClick={() => printDymo()}
          variant="secondary"
          disabled={status === 'DELETED'}
        >
          Imprimer l'étiquette
        </CustomButton>
        <CustomButton type="submit">Valider</CustomButton>
      </div>
    </form>
  )
}

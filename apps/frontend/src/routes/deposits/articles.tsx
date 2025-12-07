import { createFileRoute, Link, redirect } from '@tanstack/react-router'
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
import { Controller, useForm } from 'react-hook-form'
import type { EditArticleFormType } from '@/types/EditArticleForm.ts'
import { EditArticleSchema } from '@/types/EditArticleForm.ts'
import { zodResolver } from '@hookform/resolvers/zod'
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
    <div className="flex gap-3">
      <div>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Rechercher un article"
          onKeyDown={checkKeyDown}
        />
      </div>
      <div>
        <CustomButton onClick={submit}>Modifier</CustomButton>
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
  const articleEditMutation = useEditArticle()
  const methods = useForm<EditArticleFormType>({
    resolver: zodResolver(EditArticleSchema),
    mode: 'onSubmit',
    defaultValues: {
      id: article.id,
      price: article.price,
      brand: article.brand,
      type: article.category,
      size: article.size,
      color: article.color,
      model: article.model,
      discipline: article.discipline,
      shortArticleCode: shortArticleCode(
        article.depositIndex,
        article.identificationLetter,
      ),
    },
  })
  const { handleSubmit, control, reset } = methods
  useEffect(() => {
    reset({
      id: article.id,
      price: article.price,
      brand: article.brand,
      type: article.category,
      size: article.size,
      color: article.color,
      model: article.model,
      discipline: article.discipline,
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
    },
    [articleEditMutation],
  )
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
                  <Label htmlFor="model">Modèle</Label>
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
      </div>
      <div className="flex justify-end gap-4">
        <CustomButton
          type="button"
          onClick={() => reset()}
          variant="destructive"
        >
          Réinitialiser
        </CustomButton>
        <CustomButton type="submit">Sauvegarder</CustomButton>
      </div>
    </form>
  )
}

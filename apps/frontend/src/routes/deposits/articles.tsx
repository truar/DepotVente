import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore.ts'
import PublicLayout from '@/components/PublicLayout.tsx'
import { Page } from '@/components/Page.tsx'

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
  return (
    <div className="flex flex-col gap-5">
      <ArticleSearchInput />
      <ArticleEditForm />
    </div>
  )
}

function ArticleSearchInput() {
  return <input />
}

function ArticleEditForm() {
  return (
    <div className="flex flex-2 gap-6 flex-col bg-white rounded-2xl px-6 py-6 shadow-lg border border-gray-100">
      hello
    </div>
  )
}

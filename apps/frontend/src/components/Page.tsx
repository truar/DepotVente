import { Button } from '@/components/ui/button.tsx'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type PageProps = {
  navigation?: ReactNode
  title: string
  children?: ReactNode
}

export function Page(props: PageProps) {
  const { navigation, title, children } = props
  return (
    <main className="flex flex-1 p-6 gap-3 flex-col">
      {navigation && (
        <div>
          <Button variant="link" className="cursor-pointer">
            <ChevronLeft />
            {navigation}
          </Button>
        </div>
      )}
      <h2 className="text-3xl font-bold">{title}</h2>
      <section>{children}</section>
    </main>
  )
}

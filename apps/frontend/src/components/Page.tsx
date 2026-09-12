import { Button } from '@/components/ui/button.tsx'
import { Slottable } from '@radix-ui/react-slot'
import { ChevronLeft } from 'lucide-react'
import { type ReactNode } from 'react'
import { LogoutButton } from '@/components/LogoutButton.tsx'

type PageProps = {
  navigation?: ReactNode
  title: string
  children?: ReactNode
}

export function Page(props: PageProps) {
  const { navigation, title, children } = props

  return (
    <>
      <div className="flex flex-row justify-between px-3 py-3">
        {navigation && (
          <div>
            {/* Le lien EST le bouton : le chevron et le padding font partie de
                sa zone cliquable, sinon seul le texte réagit au clic. */}
            <Button asChild variant="link" className="cursor-pointer">
              <ChevronLeft />
              <Slottable>{navigation}</Slottable>
            </Button>
          </div>
        )}
        <div>
          <LogoutButton />
        </div>
      </div>
      <main className="flex flex-1 px-3 gap-3 flex-col">
        <h2 className="text-3xl font-bold">{title}</h2>
        <section>{children}</section>
      </main>
    </>
  )
}

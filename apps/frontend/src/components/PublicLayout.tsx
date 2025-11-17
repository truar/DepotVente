import Header from '@/components/Header'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#F3F7FB]">
      <Header />
      {children}
    </div>
  )
}

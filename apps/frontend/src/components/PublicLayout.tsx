import Header from '@/components/Header'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      {children}
    </div>
  )
}

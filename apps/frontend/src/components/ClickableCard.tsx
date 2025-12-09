import type { ReactNode } from 'react'

type ClickableCardProps = {
  onClick: () => void
  icon: ReactNode
  title: string
  description?: string
}
export function ClickableCard(props: ClickableCardProps) {
  const { onClick, icon, title, description } = props
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center group hover:scale-105 duration-200 cursor-pointer"
    >
      <div className="flex justify-center mb-3">
        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description ?? <p className="text-foreground">{description}</p>}
    </button>
  )
}

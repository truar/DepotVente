import type { ReactNode } from 'react'

type ClickableCardProps = {
  onClick: () => void
  icon: ReactNode
  title: string
  description?: string
  variant?: 'green' | 'blue'
  disabled?: boolean
}
export function ClickableCard(props: ClickableCardProps) {
  const {
    onClick,
    icon,
    title,
    description,
    variant = 'green',
    disabled = false,
  } = props
  const bgClass =
    variant === 'blue'
      ? 'bg-blue-100 group-hover:bg-blue-200'
      : 'bg-green-100 group-hover:bg-green-200'
  const interactionClass = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'hover:shadow-xl hover:scale-105 cursor-pointer group'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-white rounded-2xl p-6 shadow-lg transition-all border border-gray-100 text-center duration-200 ${interactionClass}`}
    >
      <div className="flex justify-center mb-3">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors ${bgClass}`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description ?? <p className="text-foreground">{description}</p>}
    </button>
  )
}

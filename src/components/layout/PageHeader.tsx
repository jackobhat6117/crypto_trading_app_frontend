import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="text-gray-500">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div className="flex-1">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

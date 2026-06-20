import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  right?: ReactNode
}

export default function PageHeader({ title, showBack = true, right }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 bg-glass border-glass">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-600 active:bg-dark-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  )
}

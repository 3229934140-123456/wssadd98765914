import type { TaskStatus } from '@/types'
import { STATUS_LABEL_MAP } from '@/types'
import { CheckCircle, Truck, ClipboardCheck, Clock } from 'lucide-react'

interface StepIndicatorProps {
  currentStatus: TaskStatus
}

const steps = [
  { key: 'pending' as TaskStatus, label: '待发车', icon: Clock },
  { key: 'departing' as TaskStatus, label: '发车', icon: Truck },
  { key: 'in_transit' as TaskStatus, label: '运输', icon: Truck },
  { key: 'handover' as TaskStatus, label: '交接', icon: ClipboardCheck },
  { key: 'completed' as TaskStatus, label: '完成', icon: CheckCircle },
]

export default function StepIndicator({ currentStatus }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStatus)

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const Icon = step.icon

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-safe text-white'
                    : isCurrent
                    ? 'bg-ice/20 border-2 border-ice text-ice animate-pulse-slow'
                    : 'bg-dark-600 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  isCompleted
                    ? 'text-safe'
                    : isCurrent
                    ? 'text-ice font-medium'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded transition-all duration-500 ${
                  index < currentIndex ? 'bg-safe' : 'bg-dark-600'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const colorMap: Record<TaskStatus, string> = {
    pending: 'bg-ice/20 text-ice',
    departing: 'bg-warn/20 text-warn',
    in_transit: 'bg-safe/20 text-safe',
    handover: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-gray-500/20 text-gray-400',
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {STATUS_LABEL_MAP[status]}
    </span>
  )
}

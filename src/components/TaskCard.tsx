import type { TransportTask } from '@/types'
import { StatusBadge } from './StepIndicator'
import { MapPin, Package, Thermometer, ChevronRight } from 'lucide-react'

interface TaskCardProps {
  task: TransportTask
  onClick: () => void
  highlight?: string
}

function highlightText(text: string, keyword?: string) {
  if (!keyword) return text
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + keyword.length)
  const after = text.slice(idx + keyword.length)
  return (
    <>
      {before}
      <span className="bg-yellow-500/30 text-yellow-300 rounded px-0.5 font-medium">{match}</span>
      {after}
    </>
  )
}

export default function TaskCard({ task, onClick, highlight }: TaskCardProps) {
  const isCompleted = task.status === 'completed'
  const tempColor =
    task.currentTemp > task.warningTemp
      ? 'text-danger'
      : task.currentTemp > task.warningTemp - 1
      ? 'text-warn'
      : 'text-safe'

  const completedDateStr = task.completedTime
    ? new Date(task.completedTime).toLocaleDateString('zh-CN')
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-glass overflow-hidden transition-all duration-200 active:scale-[0.98] ${
        isCompleted ? 'bg-dark-700/50' : 'bg-dark-700'
      } ${highlight ? 'ring-2 ring-yellow-500/50' : ''}`}
    >
      <div className="flex">
        <div
          className={`w-1.5 self-stretch ${
            task.status === 'in_transit'
              ? 'bg-safe'
              : task.status === 'completed'
              ? 'bg-gray-600'
              : task.status === 'handover'
              ? 'bg-purple-500'
              : 'bg-ice'
          }`}
        />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-num text-base font-semibold text-white">
              {highlightText(task.tripNumber, highlight)}
            </span>
            <div className="flex items-center gap-2">
              {isCompleted && completedDateStr && (
                <span className="text-[10px] text-gray-500 font-mono-num">
                  {completedDateStr}
                </span>
              )}
              <StatusBadge status={task.status} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-ice" />
              <span className="text-xs text-gray-400 truncate">
                {highlightText(task.vaccineBatch, highlight)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Thermometer className={`w-3.5 h-3.5 ${tempColor}`} />
              <span className={`text-xs font-mono-num ${tempColor}`}>{task.currentTemp}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">{task.boxCount}箱</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-warn flex-shrink-0" />
              <span className="text-sm text-gray-300 truncate max-w-[200px]">
                {highlightText(task.destination, highlight)}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>
    </button>
  )
}

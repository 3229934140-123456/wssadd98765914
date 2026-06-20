import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { EXCEPTION_REASON_MAP } from '@/types'
import type { ExceptionReason } from '@/types'
import PageHeader from '@/components/PageHeader'
import {
  AlertTriangle,
  Car,
  ParkingCircle,
  Wrench,
  HelpCircle,
  Camera,
  Check,
  Volume2,
} from 'lucide-react'

const REASON_CONFIG: { key: ExceptionReason; label: string; icon: typeof Car; color: string }[] = [
  { key: 'traffic_jam', label: '堵车', icon: Car, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'temp_stop', label: '临时停车', icon: ParkingCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'equipment_failure', label: '设备故障', icon: Wrench, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { key: 'other', label: '其他', icon: HelpCircle, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

export default function Alert() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { getTaskById, addExceptionRecord } = useAppStore()
  const task = getTaskById(taskId ?? '')

  const [selectedReason, setSelectedReason] = useState<ExceptionReason | null>(null)
  const [description, setDescription] = useState('')
  const [photoTaken, setPhotoTaken] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [voiceAlertActive, setVoiceAlertActive] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVoiceAlertActive(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!task) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-500">任务不存在</p>
      </div>
    )
  }

  const handleSubmit = () => {
    if (!selectedReason) return

    const record = {
      id: `exc-${Date.now()}`,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      reason: selectedReason,
      description: description || undefined,
      photos: photoTaken ? ['异常现场照片_1.jpg'] : [],
      tempAtTime: task.currentTemp,
    }
    addExceptionRecord(record)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-full bg-safe/20 flex items-center justify-center mb-6 animate-scale-in">
          <Check className="w-10 h-10 text-safe" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">异常已上报</h2>
        <p className="text-gray-400 text-sm text-center mb-8">
          处置记录已生成，到站交接时可供疾控仓库核对
        </p>
        <button
          onClick={() => navigate(`/transit/${task.id}`)}
          className="w-full max-w-xs py-3.5 rounded-2xl font-medium text-sm bg-safe text-white btn-3d"
        >
          返回运输监控
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <PageHeader title="异常上报" />

      {voiceAlertActive && (
        <div className="bg-danger/10 border-b border-danger/20 px-5 py-3 flex items-center gap-3 animate-slide-down">
          <div className="relative">
            <Volume2 className="w-6 h-6 text-danger" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-pulse-fast" />
          </div>
          <div>
            <p className="text-danger text-sm font-medium">温度异常语音告警</p>
            <p className="text-danger/70 text-xs">当前温度 {task.currentTemp}°C 已接近警戒线</p>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="bg-dark-700 rounded-2xl p-4 border-glass mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <span className="text-sm text-gray-300">当前温度</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono-num text-3xl font-bold text-warn">{task.currentTemp.toFixed(1)}</span>
            <span className="text-warn text-lg">°C</span>
            <span className="text-xs text-gray-500 ml-2">警戒线 {task.warningTemp}°C</span>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3">选择异常原因</h3>
          <div className="grid grid-cols-2 gap-3">
            {REASON_CONFIG.map(({ key, label, icon: Icon, color }) => {
              const isSelected = selectedReason === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedReason(key)}
                  className={`flex flex-col items-center gap-2 py-5 rounded-2xl border transition-all duration-200 ${
                    isSelected ? color : 'bg-dark-700 border-transparent text-gray-400'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${isSelected ? '' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {selectedReason && (
          <div className="animate-slide-up space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">补充说明（选填）</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述异常情况..."
                rows={3}
                className="w-full bg-dark-600 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ice/50 resize-none"
              />
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">现场拍照</p>
              <button
                onClick={() => setPhotoTaken(true)}
                className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                  photoTaken
                    ? 'bg-safe/10 border-safe/30 text-safe'
                    : 'bg-dark-600 border-dark-500 text-gray-400'
                }`}
              >
                {photoTaken ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">照片已上传</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-sm font-medium">拍摄现场照片</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-warn to-amber-500 text-dark-900 btn-3d flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              提交异常报告
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

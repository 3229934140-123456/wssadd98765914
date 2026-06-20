import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppStore } from '@/store'
import { EXCEPTION_REASON_MAP, DISPOSAL_RESULT_MAP } from '@/types'
import type { ExceptionReason, DisposalResult } from '@/types'
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
  Image,
  Phone,
  Snowflake,
  Eye,
  CheckCircle,
  Clock,
  Plus,
  History,
  X,
} from 'lucide-react'

function speakAlert() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('温度告警，请立即处理！')
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.volume = 1.0
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore
  }
}

const REASON_CONFIG: { key: ExceptionReason; label: string; icon: typeof Car; color: string }[] = [
  { key: 'traffic_jam', label: '堵车', icon: Car, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'temp_stop', label: '临时停车', icon: ParkingCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { key: 'equipment_failure', label: '设备故障', icon: Wrench, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { key: 'other', label: '其他', icon: HelpCircle, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

export default function Alert() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromWarning = searchParams.get('fromWarning') === '1'
  const { getTaskById, addExceptionRecord, updateExceptionRecord, addTemperatureLog, addDisposalStep } = useAppStore()
  const task = getTaskById(taskId ?? '')

  const [selectedReason, setSelectedReason] = useState<ExceptionReason | null>(null)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<{ name: string; time: string }[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null)
  const [selectedDisposal, setSelectedDisposal] = useState<DisposalResult | null>(null)
  const [disposalNotes, setDisposalNotes] = useState('')
  const [disposalCompleted, setDisposalCompleted] = useState(false)
  const [showAddStep, setShowAddStep] = useState(false)
  const [voiceAlertActive, setVoiceAlertActive] = useState(fromWarning)

  useEffect(() => {
    if (fromWarning) {
      speakAlert()
      const timer = setTimeout(() => setVoiceAlertActive(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [fromWarning])

  if (!task) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-500">任务不存在</p>
      </div>
    )
  }

  const needsPhoto = selectedReason !== null && selectedReason !== 'other'
  const photoCount = photos.length
  const canSubmit = selectedReason !== null && (!needsPhoto || photoCount > 0)

  const handleTakePhoto = () => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })
    const photoName = `${EXCEPTION_REASON_MAP[selectedReason!]}_现场${photoCount + 1}_${Date.now()}.jpg`
    setPhotos([...photos, { name: photoName, time: timeStr }])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!canSubmit) return

    const record = {
      id: `exc-${Date.now()}`,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      reason: selectedReason!,
      description: description || undefined,
      photos: photos.map((p) => p.name),
      photoTimes: photos.map((p) => p.time),
      tempAtTime: task.currentTemp,
      disposalResult: 'pending' as DisposalResult,
      disposalSteps: [],
    }
    addExceptionRecord(record)
    setSubmittedRecordId(record.id)
    setSubmitted(true)

    addTemperatureLog({
      id: `log-${Date.now()}`,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      temp: task.currentTemp,
      distance: Math.round((task.totalDistance ?? 120) - (task.remainingDistance ?? 0)),
      eventType: 'exception',
      eventId: record.id,
    })
  }

  const handleSaveDisposal = () => {
    if (!submittedRecordId || !selectedDisposal) return

    addDisposalStep(submittedRecordId, {
      id: `step-${Date.now()}`,
      timestamp: new Date().toISOString(),
      result: selectedDisposal,
      notes: disposalNotes || undefined,
    })
    setDisposalCompleted(true)
    setSelectedDisposal(null)
    setDisposalNotes('')
    setShowAddStep(false)
  }

  const { exceptionRecords } = useAppStore()
  const currentException = submittedRecordId
    ? exceptionRecords.find((e) => e.id === submittedRecordId)
    : null
  const disposalSteps = currentException?.disposalSteps ?? []

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-900 pb-8">
        <PageHeader title="异常处置跟进" />
        <div className="px-5 py-4 space-y-4">
          <div className="bg-safe/10 border border-safe/20 rounded-2xl p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-safe/20 flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-safe" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">异常已上报</h2>
            <p className="text-gray-400 text-sm">处置记录已生成 · 可继续跟进处置结果</p>
            {photoCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-safe/10 text-safe text-xs px-3 py-1 rounded-full mt-2">
                <Image className="w-3.5 h-3.5" />
                已附带 {photoCount} 张现场照片
              </div>
            )}
          </div>

          {!disposalCompleted ? (
            <div className="bg-dark-700 rounded-2xl p-4 border-glass animate-slide-up">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-ice" />
                处置结果跟进
              </h3>
              <p className="text-xs text-gray-500 mb-4">请选择当前异常的处置情况，便于交接时追溯</p>

              <div className="space-y-2 mb-4">
                {[
                  { key: 'contacted_dispatch' as DisposalResult, label: '已联系调度', icon: Phone },
                  { key: 'replaced_ice_packs' as DisposalResult, label: '已更换冰排', icon: Snowflake },
                  { key: 'continue_monitoring' as DisposalResult, label: '继续观察', icon: Eye },
                  { key: 'resolved' as DisposalResult, label: '问题已解决', icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => {
                  const isSelected = selectedDisposal === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDisposal(key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-ice/10 border-ice/30 text-ice'
                          : 'bg-dark-600 border-transparent text-gray-300 hover:bg-dark-600/80'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-ice/20' : 'bg-dark-700'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-medium">{DISPOSAL_RESULT_MAP[key]}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 ml-auto text-ice" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">处置备注（选填）</p>
                <textarea
                  value={disposalNotes}
                  onChange={(e) => setDisposalNotes(e.target.value)}
                  placeholder="记录具体处置情况..."
                  rows={2}
                  className="w-full bg-dark-600 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ice/50 resize-none"
                />
              </div>

              <button
                onClick={handleSaveDisposal}
                disabled={!selectedDisposal}
                className={`w-full py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  selectedDisposal
                    ? 'bg-gradient-to-r from-ice to-cyan-500 text-dark-900 btn-3d'
                    : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                确认处置结果
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {disposalSteps.length > 0 && (
                <div className="bg-dark-700 rounded-2xl p-4 border-glass">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    处置过程时间线
                  </h3>
                  <div className="space-y-3">
                    {disposalSteps.map((step, idx) => (
                      <div key={step.id} className="relative pl-6">
                        {idx < disposalSteps.length - 1 && (
                          <div className="absolute left-1.5 top-6 w-px h-full bg-purple-500/20" />
                        )}
                        <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                          idx === disposalSteps.length - 1
                            ? 'bg-safe border-safe'
                            : 'bg-purple-500/30 border-purple-500/50'
                        }`}>
                          {idx === disposalSteps.length - 1 && <Check className="w-2 h-2 text-white" />}
                        </div>
                        <div className={`rounded-xl p-3 ${
                          idx === disposalSteps.length - 1 ? 'bg-safe/10 border border-safe/20' : 'bg-dark-600/60'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-500 font-mono-num">
                              {new Date(step.timestamp).toLocaleString('zh-CN')}
                            </span>
                            <div className="flex items-center gap-1">
                              {step.result === 'contacted_dispatch' && <Phone className="w-3 h-3 text-gray-400" />}
                              {step.result === 'replaced_ice_packs' && <Snowflake className="w-3 h-3 text-gray-400" />}
                              {step.result === 'continue_monitoring' && <Eye className="w-3 h-3 text-gray-400" />}
                              {(step.result === 'resolved' || step.result === 'pending') && <CheckCircle className="w-3 h-3 text-gray-400" />}
                              <span className={`text-xs font-medium ${
                                idx === disposalSteps.length - 1 ? 'text-safe' : 'text-gray-300'
                              }`}>
                                {DISPOSAL_RESULT_MAP[step.result]}
                              </span>
                            </div>
                          </div>
                          {step.notes && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{step.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showAddStep ? (
                <div className="space-y-3">
                  <div className="bg-dark-700 rounded-2xl p-4 border-glass">
                    <p className="text-sm text-white font-medium mb-1">当前状态</p>
                    <div className="flex items-center gap-2 mb-2">
                      {currentException?.disposalResult && (
                        <span className="text-sm text-safe bg-safe/10 px-3 py-1 rounded-full">
                          {DISPOSAL_RESULT_MAP[currentException.disposalResult]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">如有后续处置动作，可继续补充记录</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddStep(true)
                      setSelectedDisposal(null)
                      setDisposalNotes('')
                      setDisposalCompleted(false)
                    }}
                    className="w-full py-3.5 rounded-2xl font-medium text-sm bg-gradient-to-r from-purple-500/20 to-ice/20 text-ice border border-ice/30 btn-3d flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    补充二次处置跟进
                  </button>
                </div>
              ) : (
                <div className="bg-dark-700 rounded-2xl p-4 border-glass animate-slide-up">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      补充处置跟进
                    </h3>
                    <button
                      onClick={() => setShowAddStep(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-600"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">继续记录本次异常的后续处置动作</p>

                  <div className="space-y-2 mb-4">
                    {[
                      { key: 'contacted_dispatch' as DisposalResult, label: '已联系调度', icon: Phone },
                      { key: 'replaced_ice_packs' as DisposalResult, label: '已更换冰排', icon: Snowflake },
                      { key: 'continue_monitoring' as DisposalResult, label: '继续观察', icon: Eye },
                      { key: 'resolved' as DisposalResult, label: '问题已解决', icon: CheckCircle },
                    ].map(({ key, label, icon: Icon }) => {
                      const isSelected = selectedDisposal === key
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedDisposal(key)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-ice/10 border-ice/30 text-ice'
                              : 'bg-dark-600 border-transparent text-gray-300 hover:bg-dark-600/80'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-ice/20' : 'bg-dark-700'
                          }`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <span className="text-sm font-medium">{DISPOSAL_RESULT_MAP[key]}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 ml-auto text-ice" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">处置备注（选填）</p>
                    <textarea
                      value={disposalNotes}
                      onChange={(e) => setDisposalNotes(e.target.value)}
                      placeholder="记录具体处置情况..."
                      rows={2}
                      className="w-full bg-dark-600 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ice/50 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveDisposal}
                    disabled={!selectedDisposal}
                    className={`w-full py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                      selectedDisposal
                        ? 'bg-gradient-to-r from-ice to-cyan-500 text-dark-900 btn-3d'
                        : 'bg-dark-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    记录本次跟进
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate(`/transit/${task.id}`)}
            className="w-full py-3.5 rounded-2xl font-medium text-sm bg-dark-600 text-gray-300 border border-dark-500 active:bg-dark-500 transition-colors"
          >
            返回运输监控
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <PageHeader title="异常上报" />

      {voiceAlertActive && fromWarning && (
        <div className="bg-danger/15 border-b border-danger/30 px-5 py-3 flex items-center gap-3 animate-slide-down">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-danger" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full animate-ripple" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full animate-pulse-fast" />
          </div>
          <div className="flex-1">
            <p className="text-danger text-sm font-semibold">温度告警触发</p>
            <p className="text-danger/80 text-xs">当前温度 {task.currentTemp}°C 已超过警戒线 {task.warningTemp}°C，请尽快拍照上报</p>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="bg-dark-700 rounded-2xl p-4 border-glass mb-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-warn" />
            <span className="text-sm text-gray-300">当前温度</span>
            {fromWarning && (
              <span className="text-[10px] bg-danger/20 text-danger px-1.5 py-0.5 rounded ml-auto">告警触发</span>
            )}
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">现场拍照</p>
                {needsPhoto && photoCount === 0 && (
                  <span className="text-xs text-danger">必填</span>
                )}
                {photoCount > 0 && (
                  <span className="text-xs text-safe">已拍 {photoCount} 张</span>
                )}
              </div>

              {photoCount > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg bg-dark-600 border border-dark-500 flex flex-col items-center justify-center p-1.5"
                    >
                      <Image className="w-6 h-6 text-ice/60 mb-1" />
                      <span className="text-[9px] text-gray-500 text-center leading-tight truncate w-full">
                        第{idx + 1}张
                      </span>
                      <span className="text-[8px] text-gray-600">{photo.time}</span>
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center text-[10px] shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleTakePhoto}
                className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                  photoCount > 0
                    ? 'bg-dark-600/50 border-ice/30 text-ice/80 hover:bg-dark-600'
                    : needsPhoto
                    ? 'bg-danger/5 border-danger/20 text-danger/70 hover:bg-danger/10'
                    : 'bg-dark-600 border-dark-500 text-gray-400'
                }`}
              >
                <Camera className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {photoCount > 0
                    ? '继续拍摄现场照片'
                    : needsPhoto
                    ? '请先拍摄现场照片'
                    : '拍摄现场照片（可选）'}
                </span>
              </button>
              {photoCount === 0 && needsPhoto && (
                <p className="text-xs text-danger/70 mt-1.5">
                  {EXCEPTION_REASON_MAP[selectedReason]}必须上传现场照片，处置记录才可追溯
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                canSubmit
                  ? 'bg-gradient-to-r from-warn to-amber-500 text-dark-900 btn-3d'
                  : 'bg-dark-600 text-gray-500 cursor-not-allowed'
              }`}
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

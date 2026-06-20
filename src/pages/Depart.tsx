import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import { ScanLine, Link2, Lock, Camera, Check, ChevronRight } from 'lucide-react'

const STEPS = [
  { key: 'scan', label: '扫描保温箱', icon: ScanLine, desc: '扫描保温箱标签码' },
  { key: 'probe', label: '确认探头', icon: Link2, desc: '确认温度探头已连接' },
  { key: 'seal', label: '录入铅封', icon: Lock, desc: '填写铅封号' },
  { key: 'photo', label: '装车拍照', icon: Camera, desc: '拍摄装车现场照片' },
] as const

export default function Depart() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { getTaskById, updateTask } = useAppStore()
  const task = getTaskById(taskId ?? '')

  const [currentStep, setCurrentStep] = useState(0)
  const [sealNumber, setSealNumber] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [probeComplete, setProbeComplete] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)

  if (!task) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-500">任务不存在</p>
      </div>
    )
  }

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setScanComplete(true)
      updateTask(task.id, { boxScanned: true })
    }, 1500)
  }

  const handleProbeCheck = () => {
    setProbeComplete(true)
    updateTask(task.id, { probeConnected: true })
  }

  const handleTakePhoto = () => {
    setPhotoTaken(true)
  }

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStartTransport = () => {
    updateTask(task.id, {
      status: 'in_transit',
      sealNumber,
      departureTime: new Date().toISOString(),
      remainingDistance: 120,
      photos: [...task.photos, '装车照片_1.jpg'],
    })
    navigate(`/transit/${task.id}`)
  }

  const allStepsComplete = scanComplete && probeComplete && sealNumber.length > 0 && photoTaken

  return (
    <div className="min-h-screen bg-dark-900">
      <PageHeader title="发车准备" />

      <div className="px-5 py-4">
        <div className="bg-dark-700 rounded-2xl p-4 border-glass mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono-num text-lg font-semibold text-white">{task.tripNumber}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>批号: <span className="text-gray-300">{task.vaccineBatch}</span></div>
            <div>箱数: <span className="text-gray-300">{task.boxCount}箱</span></div>
            <div className="col-span-2">目的地: <span className="text-gray-300">{task.destination}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isDone =
              (step.key === 'scan' && scanComplete) ||
              (step.key === 'probe' && probeComplete) ||
              (step.key === 'seal' && sealNumber.length > 0) ||
              (step.key === 'photo' && photoTaken)

            return (
              <div
                key={step.key}
                className={`rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-dark-700 border-ice/30 shadow-lg shadow-ice/5'
                    : isDone
                    ? 'bg-dark-700/50 border-safe/20'
                    : 'bg-dark-700/30 border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-safe/20'
                        : isActive
                        ? 'bg-ice/20'
                        : 'bg-dark-600'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 text-safe" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'text-ice' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-medium ${
                        isDone ? 'text-safe' : isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                  {isActive && !isDone && (
                    <ChevronRight className="w-4 h-4 text-ice animate-pulse-slow" />
                  )}
                </div>

                {isActive && !isDone && (
                  <div className="px-4 pb-4 animate-fade-in">
                    {step.key === 'scan' && (
                      <div>
                        <button
                          onClick={handleScan}
                          disabled={scanning}
                          className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                            scanning
                              ? 'bg-ice/20 text-ice'
                              : 'bg-ice text-dark-900 btn-3d'
                          }`}
                        >
                          {scanning ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-ice/30 border-t-ice rounded-full animate-spin" />
                              扫描中...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <ScanLine className="w-4 h-4" />
                              扫描保温箱标签
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {step.key === 'probe' && (
                      <button
                        onClick={() => {
                          handleProbeCheck()
                        }}
                        className="w-full py-3 rounded-xl font-medium text-sm bg-ice text-dark-900 btn-3d flex items-center justify-center gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        确认探头已连接
                      </button>
                    )}

                    {step.key === 'seal' && (
                      <div>
                        <input
                          type="text"
                          value={sealNumber}
                          onChange={(e) => setSealNumber(e.target.value)}
                          placeholder="请输入铅封号"
                          className="w-full bg-dark-600 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ice/50 transition-colors font-mono-num"
                        />
                        {sealNumber.length > 0 && (
                          <button
                            onClick={handleNextStep}
                            className="w-full mt-3 py-3 rounded-xl font-medium text-sm bg-ice text-dark-900 btn-3d"
                          >
                            确认铅封号
                          </button>
                        )}
                      </div>
                    )}

                    {step.key === 'photo' && (
                      <button
                        onClick={handleTakePhoto}
                        className="w-full py-3 rounded-xl font-medium text-sm bg-ice text-dark-900 btn-3d flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        拍摄装车照片
                      </button>
                    )}
                  </div>
                )}

                {isActive && isDone && index < STEPS.length - 1 && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 rounded-xl font-medium text-sm bg-dark-600 text-gray-300 active:bg-dark-500 transition-colors"
                    >
                      下一步
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {allStepsComplete && (
          <div className="mt-8 animate-slide-up">
            <button
              onClick={handleStartTransport}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-safe to-emerald-500 text-white btn-3d flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              确认发车
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

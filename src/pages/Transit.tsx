import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import {
  Thermometer,
  MapPin,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  ChevronDown,
  X,
} from 'lucide-react'

export default function Transit() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { getTaskById, addInspectionRecord, startTempSimulation, stopTempSimulation } = useAppStore()
  const task = getTaskById(taskId ?? '')

  const [showInspection, setShowInspection] = useState(false)
  const [doorOpened, setDoorOpened] = useState(false)
  const [icePackDisplaced, setIcePackDisplaced] = useState(false)
  const [tempNormal, setTempNormal] = useState(true)
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [nextInspection, setNextInspection] = useState(1800)
  const [showAlertBanner, setShowAlertBanner] = useState(false)

  useEffect(() => {
    if (task?.id) {
      startTempSimulation(task.id)
    }
    return () => {
      stopTempSimulation()
    }
  }, [task?.id])

  useEffect(() => {
    if (!task) return
    if (task.currentTemp >= task.warningTemp && !showAlertBanner) {
      setShowAlertBanner(true)
    } else if (task.currentTemp < task.warningTemp - 1) {
      setShowAlertBanner(false)
    }
  }, [task?.currentTemp, task?.warningTemp])

  useEffect(() => {
    const timer = setInterval(() => {
      setNextInspection((prev) => {
        if (prev <= 0) return 1800
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  if (!task) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-500">任务不存在</p>
      </div>
    )
  }

  const tempPercent = Math.min(
    100,
    Math.max(0, ((task.currentTemp - task.targetTempRange[0]) / (task.targetTempRange[1] - task.targetTempRange[0])) * 100)
  )
  const tempColor =
    task.currentTemp > task.warningTemp
      ? 'text-danger'
      : task.currentTemp > task.warningTemp - 1
      ? 'text-warn'
      : 'text-safe'
  const tempBg =
    task.currentTemp > task.warningTemp
      ? 'from-danger/20 to-danger/5'
      : task.currentTemp > task.warningTemp - 1
      ? 'from-warn/20 to-warn/5'
      : 'from-safe/20 to-safe/5'

  const handleSubmitInspection = () => {
    const record = {
      id: `insp-${Date.now()}`,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      doorOpened,
      icePackDisplaced,
      tempNormal,
      notes: inspectionNotes || undefined,
    }
    addInspectionRecord(record)
    setShowInspection(false)
    setDoorOpened(false)
    setIcePackDisplaced(false)
    setTempNormal(true)
    setInspectionNotes('')
    setNextInspection(1800)
  }

  const remainingKm = Math.round(task.remainingDistance ?? 0)

  return (
    <div className="min-h-screen bg-dark-900">
      <PageHeader
        title="运输监控"
        right={
          <span className="font-mono-num text-xs text-gray-400">{task.tripNumber}</span>
        }
      />

      {showAlertBanner && (
        <div className="bg-danger/20 border-b border-danger/30 px-5 py-2.5 flex items-center gap-2 animate-slide-down">
          <AlertTriangle className="w-4 h-4 text-danger animate-pulse-fast" />
          <span className="text-danger text-sm font-medium">温度接近警戒线！请及时检查</span>
          <button
            onClick={() => navigate(`/alert/${task.id}`)}
            className="ml-auto bg-danger/30 text-danger text-xs px-3 py-1 rounded-full font-medium"
          >
            上报异常
          </button>
        </div>
      )}

      <div className="px-5 py-4">
        <div
          className={`rounded-3xl bg-gradient-to-b ${tempBg} p-6 mb-5 border-glass transition-all duration-500`}
        >
          <div className="flex items-center justify-center mb-2">
            <Thermometer className={`w-6 h-6 ${tempColor} mr-2`} />
            <span className="text-gray-400 text-sm">当前车厢温度</span>
          </div>
          <div className="text-center">
            <span className={`font-mono-num text-8xl font-bold ${tempColor} text-shadow-glow transition-colors duration-500`}>
              {task.currentTemp.toFixed(1)}
            </span>
            <span className={`text-3xl font-light ${tempColor} ml-1`}>°C</span>
          </div>
          <div className="mt-4 mx-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{task.targetTempRange[0]}°C</span>
              <span>安全范围</span>
              <span>{task.targetTempRange[1]}°C</span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  task.currentTemp > task.warningTemp
                    ? 'bg-danger'
                    : task.currentTemp > task.warningTemp - 1
                    ? 'bg-warn'
                    : 'bg-safe'
                }`}
                style={{ width: `${tempPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-dark-700 rounded-2xl p-4 border-glass text-center">
            <MapPin className="w-5 h-5 text-ice mx-auto mb-1" />
            <p className="font-mono-num text-xl font-semibold text-white">{remainingKm}</p>
            <p className="text-xs text-gray-500">剩余公里</p>
          </div>
          <div className="bg-dark-700 rounded-2xl p-4 border-glass text-center">
            <Clock className="w-5 h-5 text-warn mx-auto mb-1" />
            <p
              className={`font-mono-num text-xl font-semibold ${
                nextInspection < 300 ? 'text-danger animate-pulse-fast' : 'text-white'
              }`}
            >
              {formatCountdown(nextInspection)}
            </p>
            <p className="text-xs text-gray-500">下次巡检</p>
          </div>
          <div className="bg-dark-700 rounded-2xl p-4 border-glass text-center">
            <Thermometer className="w-5 h-5 text-safe mx-auto mb-1" />
            <p className="font-mono-num text-xl font-semibold text-white">
              {task.targetTempRange[0]}-{task.targetTempRange[1]}
            </p>
            <p className="text-xs text-gray-500">目标°C</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowInspection(true)}
            className="w-full py-3.5 rounded-2xl font-medium text-sm bg-dark-600 text-white border-glass active:bg-dark-500 transition-colors flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4 text-safe" />
            巡检录入
          </button>

          <button
            onClick={() => navigate(`/alert/${task.id}`)}
            className="w-full py-3.5 rounded-2xl font-medium text-sm bg-danger/10 text-danger border border-danger/20 active:bg-danger/20 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            上报异常
          </button>

          <button
            onClick={() => {
              stopTempSimulation()
              navigate(`/handover/${task.id}`)
            }}
            className="w-full py-3.5 rounded-2xl font-medium text-sm bg-safe/10 text-safe border border-safe/20 active:bg-safe/20 transition-colors flex items-center justify-center gap-2"
          >
            到达目的地，开始交接
          </button>
        </div>
      </div>

      {showInspection && (
        <div className="fixed inset-0 z-50 bg-black/60 animate-fade-in" onClick={() => setShowInspection(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-dark-800 rounded-t-3xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">巡检录入</h3>
              <button onClick={() => setShowInspection(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-dark-600">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">车门是否开启</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDoorOpened(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      doorOpened ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    是
                  </button>
                  <button
                    onClick={() => setDoorOpened(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      !doorOpened ? 'bg-safe/20 text-safe border border-safe/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    否
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">冰排是否移位</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIcePackDisplaced(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      icePackDisplaced ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    是
                  </button>
                  <button
                    onClick={() => setIcePackDisplaced(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      !icePackDisplaced ? 'bg-safe/20 text-safe border border-safe/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    否
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">温度是否正常</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTempNormal(true)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      tempNormal ? 'bg-safe/20 text-safe border border-safe/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    正常
                  </button>
                  <button
                    onClick={() => setTempNormal(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      !tempNormal ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-dark-600 text-gray-400'
                    }`}
                  >
                    异常
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">备注（选填）</p>
                <input
                  type="text"
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="输入备注信息"
                  className="w-full bg-dark-600 border border-dark-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-ice/50"
                />
              </div>

              <button
                onClick={handleSubmitInspection}
                className="w-full py-3.5 rounded-2xl font-medium text-sm bg-safe text-white btn-3d"
              >
                提交巡检记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

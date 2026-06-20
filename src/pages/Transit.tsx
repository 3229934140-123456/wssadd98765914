import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { EXCEPTION_REASON_MAP } from '@/types'
import PageHeader from '@/components/PageHeader'
import {
  Thermometer,
  MapPin,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  X,
  Truck,
  BellRing,
  FileText,
  Gauge,
  ListVideo,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function speakAlert() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance('温度告警，温度接近警戒线，请及时检查！')
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.volume = 1.0
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore
  }
}

function speakArrivalReminder() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const utterance = new SpeechSynthesisUtterance('即将到达目的地，请做好交接准备。')
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.volume = 1.0
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore
  }
}

export default function Transit() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const {
    getTaskById,
    addInspectionRecord,
    startTempSimulation,
    stopTempSimulation,
    updateTask,
    getTemperatureLogsByTaskId,
    addTemperatureLog,
    inspectionRecords,
    exceptionRecords,
  } = useAppStore()
  const task = getTaskById(taskId ?? '')

  const [activeTab, setActiveTab] = useState<'monitor' | 'timeline'>('monitor')
  const [showInspection, setShowInspection] = useState(false)
  const [doorOpened, setDoorOpened] = useState(false)
  const [icePackDisplaced, setIcePackDisplaced] = useState(false)
  const [tempNormal, setTempNormal] = useState(true)
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [nextInspection, setNextInspection] = useState(1800)
  const [showAlertBanner, setShowAlertBanner] = useState(false)
  const [showArrivalReminder, setShowArrivalReminder] = useState(false)
  const alertSpokenRef = useRef(false)
  const arrivalSpokenRef = useRef(false)

  const temperatureLogs = taskId ? getTemperatureLogsByTaskId(taskId) : []
  const taskInspections = taskId ? inspectionRecords.filter((i) => i.taskId === taskId) : []
  const taskExceptions = taskId ? exceptionRecords.filter((e) => e.taskId === taskId) : []

  const remainingKm = Math.round(task?.remainingDistance ?? 0)
  const totalKm = task?.totalDistance ?? 120
  const estimatedArrival = task?.estimatedArrival
  const avgSpeedKmh = 60
  const hoursLeft = (task?.remainingDistance ?? 0) / avgSpeedKmh
  const minutesLeft = Math.round(hoursLeft * 60)

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
    if (task.currentTemp >= task.warningTemp) {
      if (!showAlertBanner) setShowAlertBanner(true)
      if (!alertSpokenRef.current) {
        alertSpokenRef.current = true
        speakAlert()
      }
    } else if (task.currentTemp < task.warningTemp - 1) {
      setShowAlertBanner(false)
      alertSpokenRef.current = false
    }
  }, [task?.currentTemp, task?.warningTemp, task])

  useEffect(() => {
    if (!task) return
    const remaining = task.remainingDistance ?? 0
    if (remaining <= 10 && remaining > 0) {
      if (!showArrivalReminder) setShowArrivalReminder(true)
      if (!arrivalSpokenRef.current) {
        arrivalSpokenRef.current = true
        speakArrivalReminder()
      }
    }
  }, [task?.remainingDistance, task])

  useEffect(() => {
    const timer = setInterval(() => {
      setNextInspection((prev) => {
        if (prev <= 0) return 1800
        if (minutesLeft > 0 && prev > minutesLeft * 60) {
          return minutesLeft * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [minutesLeft])

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
    if (!task) return
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
    addTemperatureLog({
      id: `log-${Date.now()}`,
      taskId: task.id,
      timestamp: new Date().toISOString(),
      temp: task.currentTemp,
      distance: Math.round((task.totalDistance ?? 120) - (task.remainingDistance ?? 0)),
      eventType: 'inspection',
      eventId: record.id,
    })
    setShowInspection(false)
    setDoorOpened(false)
    setIcePackDisplaced(false)
    setTempNormal(true)
    setInspectionNotes('')
    setNextInspection(1800)
  }

  const handleArriveDestination = () => {
    if (!task) return
    stopTempSimulation()
    updateTask(task.id, { status: 'handover' })
    navigate(`/handover/${task.id}`)
  }

  const progressPercent = Math.max(0, Math.min(100, ((totalKm - remainingKm) / totalKm) * 100))

  const isNearDestination = remainingKm <= 15 && remainingKm > 0
  const inspectionLabel = isNearDestination
    ? nextInspection > 0
      ? `交接前巡检（${formatCountdown(nextInspection)}）`
      : '交接前巡检'
    : nextInspection <= 0
    ? '立即巡检'
    : `下次巡检（${formatCountdown(nextInspection)}）`

  const inspectionHint = isNearDestination
    ? '请完成最后一次巡检，准备交接核对'
    : '请按时完成巡检确保冷链正常'

  const timelineEvents = useMemo(() => {
    type TimelineEvent = {
      timestamp: number
      time: string
      type: string
      temp: number
      distance: number
      icon: React.ReactNode
      color: string
      title: string
      desc: string
      progressPct: number
      critical: boolean
    }
    const events: TimelineEvent[] = []
    const total = totalKm || 1

    temperatureLogs.forEach((log) => {
      const ts = new Date(log.timestamp).getTime()
      if (log.eventType === 'warning') {
        events.push({
          timestamp: ts,
          time: new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
          type: 'warning',
          temp: log.temp,
          distance: log.distance,
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          color: 'text-danger bg-danger/20 border-danger/30',
          title: `温度告警 ${log.temp.toFixed(1)}°C`,
          desc: `已行驶 ${log.distance} km（${Math.round((log.distance / total) * 100)}%）`,
          progressPct: Math.min(100, (log.distance / total) * 100),
          critical: true,
        })
      } else if (log.eventType === 'normal') {
        events.push({
          timestamp: ts,
          time: new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
          type: 'normal',
          temp: log.temp,
          distance: log.distance,
          icon: <Thermometer className="w-3.5 h-3.5" />,
          color: 'text-ice bg-ice/20 border-ice/30',
          title: `温度 ${log.temp.toFixed(1)}°C`,
          desc: `已行驶 ${log.distance} km（${Math.round((log.distance / total) * 100)}%）`,
          progressPct: Math.min(100, (log.distance / total) * 100),
          critical: false,
        })
      }
    })

    taskInspections.forEach((insp) => {
      const ts = new Date(insp.timestamp).getTime()
      const nearestLog = temperatureLogs
        .slice()
        .sort((a, b) => Math.abs(new Date(a.timestamp).getTime() - ts) - Math.abs(new Date(b.timestamp).getTime() - ts))[0]
      const dist = nearestLog?.distance ?? 0
      events.push({
        timestamp: ts,
        time: new Date(insp.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
        type: 'inspection',
        temp: nearestLog?.temp ?? task.currentTemp,
        distance: dist,
        icon: <ClipboardCheck className="w-3.5 h-3.5" />,
        color: 'text-safe bg-safe/20 border-safe/30',
        title: '巡检完成',
        desc: `车门${insp.doorOpened ? '开启' : '正常'} · 冰排${insp.icePackDisplaced ? '移位' : '正常'} · 温度${insp.tempNormal ? '正常' : '异常'} · 行驶 ${dist} km`,
        progressPct: Math.min(100, (dist / total) * 100),
        critical: true,
      })
    })

    taskExceptions.forEach((exc) => {
      const ts = new Date(exc.timestamp).getTime()
      const nearestLog = temperatureLogs
        .slice()
        .sort((a, b) => Math.abs(new Date(a.timestamp).getTime() - ts) - Math.abs(new Date(b.timestamp).getTime() - ts))[0]
      const dist = nearestLog?.distance ?? 0
      events.push({
        timestamp: ts,
        time: new Date(exc.timestamp).toLocaleTimeString('zh-CN', { hour12: false }),
        type: 'exception',
        temp: exc.tempAtTime,
        distance: dist,
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        color: 'text-warn bg-warn/20 border-warn/30',
        title: `${EXCEPTION_REASON_MAP[exc.reason]} · ${exc.photos.length} 张照片`,
        desc: `${exc.description || '已上报处置'} · 行驶 ${dist} km`,
        progressPct: Math.min(100, (dist / total) * 100),
        critical: true,
      })
    })

    events.sort((a, b) => b.timestamp - a.timestamp)

    if (events.length > 120) {
      const critical = events.filter((e) => e.critical)
      const nonCritical = events.filter((e) => !e.critical)
      const sampleRate = Math.ceil(nonCritical.length / (120 - critical.length))
      const sampledNon = nonCritical.filter((_, i) => i % sampleRate === 0)
      const merged = [...critical, ...sampledNon]
      merged.sort((a, b) => b.timestamp - a.timestamp)
      return merged
    }
    return events
  }, [temperatureLogs, taskInspections, taskExceptions, task?.currentTemp, totalKm])

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
          <div className="relative">
            <AlertTriangle className="w-4 h-4 text-danger animate-pulse-fast" />
            <span className="absolute inset-0 w-4 h-4 bg-danger/40 rounded-full animate-ripple" />
          </div>
          <span className="text-danger text-sm font-medium flex-1">温度接近警戒线！请及时检查</span>
          <button
            onClick={() => navigate(`/alert/${task.id}?fromWarning=1`)}
            className="bg-danger/30 text-danger text-xs px-3 py-1 rounded-full font-medium active:bg-danger/40"
          >
            上报异常
          </button>
        </div>
      )}

      {showArrivalReminder && (
        <div className="bg-ice/15 border-b border-ice/30 px-5 py-2.5 flex items-center gap-2 animate-slide-down">
          <div className="relative">
            <BellRing className="w-4 h-4 text-ice animate-pulse-slow" />
          </div>
          <span className="text-ice text-sm font-medium flex-1">即将到达目的地，请做好交接准备</span>
          <button
            onClick={() => setShowArrivalReminder(false)}
            className="text-ice/70 text-xs px-2 py-0.5 rounded-full border border-ice/30"
          >
            知道了
          </button>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="flex gap-2 bg-dark-800/80 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'monitor'
                ? 'bg-ice text-dark-900 shadow-lg shadow-ice/20'
                : 'text-gray-400'
            }`}
          >
            <Gauge className="w-4 h-4" />
            实时监控
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-ice text-dark-900 shadow-lg shadow-ice/20'
                : 'text-gray-400'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            今日轨迹
          </button>
        </div>

        {activeTab === 'monitor' && (
          <>
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

            <div className="bg-dark-700 rounded-2xl p-4 border-glass mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-ice" />
                  <span className="text-sm text-gray-300">运输进度</span>
                </div>
                <span className="text-xs text-gray-500 font-mono-num">
                  {Math.round(totalKm - remainingKm)} / {totalKm} km
                </span>
              </div>
              <div className="relative h-3 bg-dark-600 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-ice/70 to-ice rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-ice flex items-center justify-center transition-all duration-1000"
                  style={{ left: `calc(${progressPercent}% - 10px)` }}
                >
                  <Truck className="w-3 h-3 text-ice" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>发车点</span>
                <span className="text-gray-400">{task.destination}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-dark-700 rounded-2xl p-3.5 border-glass text-center">
                <MapPin className="w-5 h-5 text-ice mx-auto mb-1" />
                <p className="font-mono-num text-xl font-semibold text-white">{remainingKm}</p>
                <p className="text-[10px] text-gray-500">剩余公里</p>
              </div>
              <div className="bg-dark-700 rounded-2xl p-3.5 border-glass text-center">
                <Clock className="w-5 h-5 text-safe mx-auto mb-1" />
                <p className="font-mono-num text-lg font-semibold text-white">
                  {task.estimatedArrival || '--:--'}
                </p>
                <p className="text-[10px] text-gray-500">预计到达</p>
              </div>
              <div className="bg-dark-700 rounded-2xl p-3.5 border-glass text-center">
                <ClipboardCheck className="w-5 h-5 text-warn mx-auto mb-1" />
                <p
                  className={`font-mono-num text-lg font-semibold ${
                    nextInspection < 300 ? 'text-danger animate-pulse-fast' : 'text-white'
                  }`}
                >
                  {formatCountdown(nextInspection)}
                </p>
                <p className="text-[10px] text-gray-500">{isNearDestination ? '交接前巡检' : '下次巡检'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowInspection(true)}
                className="w-full py-3.5 rounded-2xl font-medium text-sm bg-dark-600 text-white border-glass active:bg-dark-500 transition-colors flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-4 h-4 text-safe" />
                {inspectionLabel}
              </button>
              {isNearDestination && (
                <p className="text-xs text-ice text-center">{inspectionHint}</p>
              )}

              <button
                onClick={() => navigate(`/alert/${task.id}`)}
                className="w-full py-3.5 rounded-2xl font-medium text-sm bg-danger/10 text-danger border border-danger/20 active:bg-danger/20 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                上报异常
              </button>

              <button
                onClick={handleArriveDestination}
                className="w-full py-3.5 rounded-2xl font-medium text-sm bg-safe/10 text-safe border border-safe/20 active:bg-safe/20 transition-colors flex items-center justify-center gap-2"
              >
                到达目的地，开始交接
              </button>
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="animate-fade-in">
            <div className="bg-dark-700 rounded-2xl p-4 border-glass mb-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-ice" />
                今日运输轨迹
              </h3>
              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>总里程：{totalKm} km · 已行驶：{Math.round(totalKm - remainingKm)} km</p>
                <p>温度记录 {temperatureLogs.length} 条 · 巡检 {taskInspections.length} 次 · 异常 {taskExceptions.length} 次</p>
                <p className="text-gray-600">共 {timelineEvents.length} 个轨迹点（事件点全部保留，温度点长途自动采样）</p>
              </div>
              <div className="relative h-6 bg-dark-600 rounded-full overflow-hidden mb-3">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-ice via-cyan-500 to-safe opacity-30"
                  style={{ width: `${Math.min(100, ((totalKm - remainingKm) / totalKm) * 100)}%` }}
                />
                {timelineEvents.slice().sort((a, b) => a.progressPct - b.progressPct).map((e, i) => (
                  <div
                    key={i}
                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                      e.type === 'inspection'
                        ? 'bg-safe z-20'
                        : e.type === 'exception'
                        ? 'bg-warn z-20'
                        : e.type === 'warning'
                        ? 'bg-danger z-20'
                        : 'bg-ice/50'
                    }`}
                    style={{ left: `${e.progressPct}%` }}
                    title={e.title}
                  />
                ))}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg z-30 flex items-center justify-center"
                  style={{ left: `calc(${Math.min(100, ((totalKm - remainingKm) / totalKm) * 100)}% - 8px)` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-ice" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-600 font-mono-num">
                <span>0 km</span>
                <span>{Math.round(totalKm / 4)} km</span>
                <span>{Math.round(totalKm / 2)} km</span>
                <span>{Math.round((totalKm * 3) / 4)} km</span>
                <span>{totalKm} km</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                <span className="flex items-center gap-1 text-[10px] text-safe bg-safe/10 px-2 py-1 rounded-full">
                  <ClipboardCheck className="w-3 h-3" /> 巡检
                </span>
                <span className="flex items-center gap-1 text-[10px] text-warn bg-warn/10 px-2 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> 异常
                </span>
                <span className="flex items-center gap-1 text-[10px] text-danger bg-danger/10 px-2 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3" /> 告警
                </span>
                <span className="flex items-center gap-1 text-[10px] text-ice bg-ice/10 px-2 py-1 rounded-full">
                  <Thermometer className="w-3 h-3" /> 温度
                </span>
              </div>
            </div>

            <div className="bg-dark-700 rounded-2xl p-4 border-glass">
              {timelineEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <ListVideo className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">暂无轨迹记录</p>
                  <p className="text-gray-600 text-xs mt-1">运输中会自动记录温度变化</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto scrollbar-hide pr-1">
                  {timelineEvents.map((event, idx) => (
                    <div key={idx} className="relative pl-7">
                      {idx < timelineEvents.length - 1 && (
                        <div className="absolute left-1.5 top-6 w-px h-full bg-dark-600" />
                      )}
                      <div
                        className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${event.color.split(' ')[2]}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${event.color.split(' ')[0]}`} />
                      </div>
                      <div className={`rounded-xl p-2.5 ${event.color.split(' ')[1]}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500 font-mono-num">{event.time}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono-num ${event.color.split(' ')[0]}`}>
                              {event.temp.toFixed(1)}°C
                            </span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${event.color.split(' ')[1]}`}>
                              {event.icon}
                            </div>
                          </div>
                        </div>
                        <p className={`text-sm font-medium ${event.color.split(' ')[0]}`}>
                          {event.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{event.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

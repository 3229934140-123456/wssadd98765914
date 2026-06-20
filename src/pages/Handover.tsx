import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { EXCEPTION_REASON_MAP, DISPOSAL_RESULT_MAP } from '@/types'
import PageHeader from '@/components/PageHeader'
import {
  Package,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PenTool,
  Eraser,
  Check,
  Image,
  User,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Download,
  FileCheck,
  Thermometer,
  ListVideo,
  Phone,
  Snowflake,
  Eye,
  CheckCircle,
  X,
} from 'lucide-react'

export default function Handover() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const {
    getTaskById,
    exceptionRecords,
    inspectionRecords,
    addHandoverRecord,
    updateTask,
    getHandoverConfirm,
    updateHandoverConfirm,
    getTemperatureLogsByTaskId,
  } = useAppStore()
  const task = getTaskById(taskId ?? '')
  const persistedConfirm = taskId ? getHandoverConfirm(taskId) : null

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signMode, setSignMode] = useState<'driver' | 'receiver' | null>(null)
  const [confirmItems, setConfirmItems] = useState({
    vaccineBatch: persistedConfirm?.vaccineBatchConfirmed ?? false,
    boxCount: persistedConfirm?.boxCountConfirmed ?? false,
    tempRecords: persistedConfirm?.tempRecordsConfirmed ?? false,
    exceptionRecords: persistedConfirm?.exceptionRecordsReviewed ?? false,
  })
  const [driverSigned, setDriverSigned] = useState(persistedConfirm?.driverSigned ?? false)
  const [receiverSigned, setReceiverSigned] = useState(persistedConfirm?.receiverSigned ?? false)
  const [completed, setCompleted] = useState(task?.status === 'completed')
  const [expandedPhotos, setExpandedPhotos] = useState<Record<string, boolean>>({})
  const [showVoucher, setShowVoucher] = useState(false)

  const taskExceptions = taskId ? exceptionRecords.filter((e) => e.taskId === taskId) : []
  const taskInspections = taskId ? inspectionRecords.filter((i) => i.taskId === taskId) : []
  const temperatureLogs = taskId ? getTemperatureLogsByTaskId(taskId) : []

  const syncConfirmToStore = (items: typeof confirmItems, dSigned: boolean, rSigned: boolean) => {
    if (!taskId) return
    updateHandoverConfirm(taskId, {
      vaccineBatchConfirmed: items.vaccineBatch,
      boxCountConfirmed: items.boxCount,
      tempRecordsConfirmed: items.tempRecords,
      exceptionRecordsReviewed: items.exceptionRecords,
      driverSigned: dSigned,
      receiverSigned: rSigned,
    })
  }

  useEffect(() => {
    syncConfirmToStore(confirmItems, driverSigned, receiverSigned)
  }, [confirmItems, driverSigned, receiverSigned])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1A2332'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [signMode])

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1A2332'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleConfirmSign = () => {
    if (signMode === 'driver') {
      setDriverSigned(true)
    } else {
      setReceiverSigned(true)
    }
    setSignMode(null)
  }

  const allConfirmed =
    confirmItems.vaccineBatch && confirmItems.boxCount && confirmItems.tempRecords && confirmItems.exceptionRecords
  const allSigned = driverSigned && receiverSigned

  const tempSummary = (() => {
    if (temperatureLogs.length === 0) return { avg: 0, max: 0, min: 0, warningCount: 0 }
    const temps = temperatureLogs.map((l) => l.temp)
    const warnings = temperatureLogs.filter((l) => l.eventType === 'warning').length
    return {
      avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
      max: Math.max(...temps),
      min: Math.min(...temps),
      warningCount: warnings,
    }
  })()

  const totalKm = task?.totalDistance ?? 120
  const actualKm = temperatureLogs.length > 0
    ? Math.max(...temperatureLogs.map((l) => l.distance))
    : 0

  const handleExportVoucher = () => {
    if (!task) return
    const lines: string[] = []
    lines.push('========================================')
    lines.push('      疫苗冷链运输凭证')
    lines.push('========================================')
    lines.push('')
    lines.push(`车次：${task.tripNumber}`)
    lines.push(`疫苗批号：${task.vaccineBatch}`)
    lines.push(`箱数：${task.boxCount} 箱`)
    lines.push(`目的地：${task.destination}`)
    lines.push(`联系人：${task.destinationContact}`)
    lines.push('')
    lines.push('-------- 运输信息 --------')
    lines.push(`总里程：${totalKm} km`)
    lines.push(`实际行驶：${actualKm} km`)
    lines.push(`铅封号：${task.sealNumber || '未填写'}`)
    lines.push(`装车照片：${task.photos.length} 张`)
    if (task.departureTime) {
      lines.push(`发车时间：${new Date(task.departureTime).toLocaleString('zh-CN')}`)
    }
    if (task.completedTime) {
      lines.push(`完成时间：${new Date(task.completedTime).toLocaleString('zh-CN')}`)
    }
    lines.push('')
    lines.push('-------- 温度摘要 --------')
    lines.push(`平均温度：${tempSummary.avg.toFixed(1)}°C`)
    lines.push(`最高温度：${tempSummary.max.toFixed(1)}°C`)
    lines.push(`最低温度：${tempSummary.min.toFixed(1)}°C`)
    lines.push(`温度目标范围：${task.targetTempRange[0]}-${task.targetTempRange[1]}°C`)
    lines.push(`告警次数：${tempSummary.warningCount} 次`)
    lines.push('')
    lines.push('-------- 巡检记录 --------')
    lines.push(`巡检次数：${taskInspections.length} 次`)
    taskInspections.slice().reverse().forEach((insp, idx) => {
      lines.push(`  [${idx + 1}] ${new Date(insp.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}`)
      lines.push(`      车门:${insp.doorOpened ? '开启' : '正常'} 冰排:${insp.icePackDisplaced ? '移位' : '正常'} 温度:${insp.tempNormal ? '正常' : '异常'}`)
      if (insp.notes) lines.push(`      备注: ${insp.notes}`)
    })
    lines.push('')
    lines.push('-------- 异常处置 --------')
    lines.push(`异常次数：${taskExceptions.length} 次`)
    taskExceptions.forEach((exc, idx) => {
      lines.push(`  [${idx + 1}] ${new Date(exc.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}`)
      lines.push(`      原因: ${EXCEPTION_REASON_MAP[exc.reason]}`)
      lines.push(`      当时温度: ${exc.tempAtTime}°C`)
      lines.push(`      照片: ${exc.photos.length} 张`)
      if (exc.disposalResult) {
        lines.push(`      处置: ${DISPOSAL_RESULT_MAP[exc.disposalResult]}`)
      }
      if (exc.description) lines.push(`      说明: ${exc.description}`)
      exc.photos.forEach((p, pi) => {
        lines.push(`      照片${pi + 1}: ${p}`)
      })
    })
    lines.push('')
    lines.push('-------- 交接确认 --------')
    lines.push(`疫苗批号核对：${confirmItems.vaccineBatch ? '✓' : '✗'}`)
    lines.push(`箱数核对：${confirmItems.boxCount ? '✓' : '✗'}`)
    lines.push(`温度记录核对：${confirmItems.tempRecords ? '✓' : '✗'}`)
    lines.push(`异常记录复核：${confirmItems.exceptionRecords ? '✓' : '✗'}`)
    lines.push(`司机签字：${driverSigned ? '✓ 已签署' : '✗ 未签署'}`)
    lines.push(`接收人签字：${receiverSigned ? '✓ 已签署' : '✗ 未签署'}`)
    lines.push('')
    lines.push('========================================')
    lines.push(`生成时间：${new Date().toLocaleString('zh-CN')}`)
    lines.push('本凭证由系统自动生成，全程冷链可追溯')
    lines.push('========================================')

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${task.tripNumber}_冷链运输凭证_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCompleteHandover = () => {
    if (task) {
      const now = new Date().toISOString()
      updateTask(task.id, { status: 'completed', completedTime: now })
      addHandoverRecord({
        taskId: task.id,
        vaccineBatchConfirmed: confirmItems.vaccineBatch,
        boxCountConfirmed: confirmItems.boxCount,
        tempRecordsConfirmed: confirmItems.tempRecords,
        exceptionRecordsReviewed: confirmItems.exceptionRecords,
        driverSignature: driverSigned ? 'signed' : undefined,
        receiverSignature: receiverSigned ? 'signed' : undefined,
        handoverTime: now,
      })
      setCompleted(true)
    }
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <p className="text-gray-500">任务不存在</p>
      </div>
    )
  }

  const isCompleted = task.status === 'completed'
  const isHandover = task.status === 'handover'

  const toggleConfirm = (key: keyof typeof confirmItems) => {
    if (isCompleted) return
    const newItems = { ...confirmItems, [key]: !confirmItems[key] }
    setConfirmItems(newItems)
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-8">
      <PageHeader title={isCompleted ? '运输归档单' : '交接确认'} />

      {isHandover && (
        <div className="bg-purple-500/15 border-b border-purple-500/30 px-5 py-2.5 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">交接中 · 请与接收人核对</span>
        </div>
      )}

      {isCompleted && (
        <div className="bg-safe/15 border-b border-safe/30 px-5 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-safe" />
          <span className="text-safe text-sm font-medium">运输已完成 · 全程冷链可追溯</span>
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        <div className="bg-dark-700 rounded-2xl p-4 border-glass">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-gray-300">运输信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">车次</p>
              <p className="font-mono-num text-white">{task.tripNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">目的地</p>
              <p className="text-white text-sm truncate">{task.destination}</p>
            </div>
            {task.totalDistance !== undefined && (
              <div>
                <p className="text-xs text-gray-500">总里程</p>
                <p className="font-mono-num text-white">{task.totalDistance} km</p>
              </div>
            )}
            {task.sealNumber && (
              <div>
                <p className="text-xs text-gray-500">铅封号</p>
                <p className="font-mono-num text-white">{task.sealNumber}</p>
              </div>
            )}
            {task.photos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500">装车照片</p>
                <p className="text-ice">{task.photos.length} 张</p>
              </div>
            )}
            {task.departureTime && (
              <div>
                <p className="text-xs text-gray-500">发车时间</p>
                <p className="text-white text-xs">
                  {new Date(task.departureTime).toLocaleString('zh-CN')}
                </p>
              </div>
            )}
            {isCompleted && task.completedTime && task.departureTime && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">运输时长</p>
                <p className="text-white">
                  {Math.round(
                    (new Date(task.completedTime).getTime() - new Date(task.departureTime).getTime()) / 60000
                  )}{' '}
                  分钟
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-dark-700 rounded-2xl p-4 border-glass">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-ice" />
            温度摘要
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-dark-600/60 rounded-xl p-3">
              <p className="text-2xl font-mono-num text-white">{tempSummary.avg.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">平均 °C</p>
            </div>
            <div className="bg-warn/20 rounded-xl p-3">
              <p className="text-2xl font-mono-num text-warn">{tempSummary.max.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">最高 °C</p>
            </div>
            <div className="bg-safe/20 rounded-xl p-3">
              <p className="text-2xl font-mono-num text-safe">{tempSummary.min.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">最低 °C</p>
            </div>
            <div className="bg-dark-600/60 rounded-xl p-3">
              <p className="text-2xl font-mono-num text-white">{tempSummary.warningCount}</p>
              <p className="text-[10px] text-gray-500">告警次数</p>
            </div>
          </div>
        </div>

        {temperatureLogs.length > 0 && (
          <div className="bg-dark-700 rounded-2xl p-4 border-glass">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-ice" />
              运输轨迹摘要
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ice to-safe"
                  style={{ width: `${Math.min(100, (actualKm / totalKm) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-mono-num">
                {actualKm}/{totalKm} km
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-ice mb-1" />
                <span>起点</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-warn mb-1" />
                <span>巡检 {taskInspections.length} 次</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-danger mb-1" />
                <span>异常 {taskExceptions.length} 次</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-safe mb-1" />
                <span>终点</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-dark-600">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">目标温度范围</span>
                <span className="text-ice font-mono-num">{task.targetTempRange[0]}-{task.targetTempRange[1]}°C</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-500">全程记录点</span>
                <span className="text-white font-mono-num">{temperatureLogs.length} 条</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-dark-700 rounded-2xl p-4 border-glass">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-ice" />
            交接信息核对
          </h3>
          <div className="space-y-3">
            {[
              {
                key: 'vaccineBatch' as const,
                label: '疫苗批号',
                value: task.vaccineBatch,
                mono: true,
              },
              {
                key: 'boxCount' as const,
                label: '箱数',
                value: `${task.boxCount} 箱`,
                mono: true,
              },
              {
                key: 'tempRecords' as const,
                label: '温度记录',
                value: `最终 ${task.currentTemp}°C（范围 ${task.targetTempRange[0]}-${task.targetTempRange[1]}°C）`,
                mono: false,
              },
              {
                key: 'exceptionRecords' as const,
                label: '异常处置记录',
                value: taskExceptions.length > 0 ? `${taskExceptions.length} 条记录` : '无异常记录',
                mono: false,
              },
            ].map((item, idx, arr) => (
              <div key={item.key}>
                <div
                  className="flex items-center justify-between py-1"
                  onClick={() => toggleConfirm(item.key)}
                >
                  <div>
                    <p className="text-sm text-gray-400">{item.label}</p>
                    <p className={item.mono ? 'font-mono-num text-white' : 'text-white'}>
                      {item.value}
                    </p>
                  </div>
                  {confirmItems[item.key] ? (
                    <CheckCircle2 className="w-5 h-5 text-safe" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                </div>
                {idx < arr.length - 1 && <div className="h-px bg-dark-600" />}
              </div>
            ))}
          </div>
        </div>

        {taskInspections.length > 0 && (
          <div className="bg-dark-700 rounded-2xl p-4 border-glass">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-safe" />
              巡检记录（{taskInspections.length} 次）
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {taskInspections
                .slice()
                .reverse()
                .map((rec) => (
                  <div key={rec.id} className="bg-dark-600/50 rounded-xl p-3 text-xs">
                    <p className="text-gray-500">{new Date(rec.timestamp).toLocaleString('zh-CN')}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={rec.doorOpened ? 'text-danger' : 'text-safe'}>
                        车门{rec.doorOpened ? '开启' : '未开'}
                      </span>
                      <span className={rec.icePackDisplaced ? 'text-danger' : 'text-safe'}>
                        冰排{rec.icePackDisplaced ? '移位' : '正常'}
                      </span>
                      <span className={rec.tempNormal ? 'text-safe' : 'text-danger'}>
                        温度{rec.tempNormal ? '正常' : '异常'}
                      </span>
                    </div>
                    {rec.notes && <p className="text-gray-400 mt-1">备注：{rec.notes}</p>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {taskExceptions.length > 0 && (
          <div className="bg-dark-700 rounded-2xl p-4 border-glass">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-warn" />
              异常处置记录
            </h3>
            <div className="space-y-3">
              {taskExceptions.map((record, index) => (
                <div key={record.id} className="relative pl-6">
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-warn/20 border-2 border-warn/50" />
                  {index < taskExceptions.length - 1 && (
                    <div className="absolute left-1.5 top-4 w-px h-full bg-warn/20" />
                  )}
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(record.timestamp).toLocaleString('zh-CN')}
                    </p>
                    <p className="text-sm text-warn font-medium mt-0.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {EXCEPTION_REASON_MAP[record.reason]}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      温度 {record.tempAtTime}°C
                      {record.description && ` · ${record.description}`}
                    </p>
                    {record.disposalResult && (
                      <div className="mt-2 flex items-center gap-1.5 bg-safe/10 rounded-lg px-2.5 py-1.5 w-fit">
                        {record.disposalResult === 'contacted_dispatch' && <Phone className="w-3 h-3 text-safe/70" />}
                        {record.disposalResult === 'replaced_ice_packs' && <Snowflake className="w-3 h-3 text-safe/70" />}
                        {record.disposalResult === 'continue_monitoring' && <Eye className="w-3 h-3 text-safe/70" />}
                        {(record.disposalResult === 'resolved' || record.disposalResult === 'pending') && <CheckCircle className="w-3 h-3 text-safe/70" />}
                        <span className="text-xs text-safe/80">
                          处置：{DISPOSAL_RESULT_MAP[record.disposalResult]}
                        </span>
                      </div>
                    )}
                    {record.photos.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedPhotos({ ...expandedPhotos, [record.id]: !expandedPhotos[record.id] })}
                          className="flex items-center gap-1.5 bg-dark-600/80 rounded-lg px-2.5 py-1.5 text-xs text-ice hover:bg-dark-600 transition-colors"
                        >
                          <Image className="w-3 h-3" />
                          <span>现场照片 {record.photos.length} 张</span>
                          {expandedPhotos[record.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        {expandedPhotos[record.id] && (
                          <div className="mt-2 grid grid-cols-2 gap-2 animate-fade-in">
                            {record.photos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="bg-dark-600 rounded-lg p-2 border border-dark-500"
                              >
                                <div className="aspect-video bg-dark-700 rounded-md flex items-center justify-center mb-1.5">
                                  <Image className="w-6 h-6 text-ice/50" />
                                </div>
                                <p className="text-[10px] text-gray-400 truncate font-mono-num">
                                  {photo}
                                </p>
                                <p className="text-[9px] text-gray-600 mt-0.5 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {record.photoTimes?.[idx] || '拍摄时间未知'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {record.photos.length === 0 && (
                      <div className="mt-2 flex items-center gap-1.5 bg-danger/10 rounded-lg px-2.5 py-1.5 w-fit">
                        <XCircle className="w-3 h-3 text-danger/70" />
                        <span className="text-xs text-danger/70">无照片记录</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(allConfirmed || isCompleted) && (
          <div className={`bg-dark-700 rounded-2xl p-4 border-glass ${!isCompleted ? 'animate-slide-up' : ''}`}>
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-ice" />
              电子签字
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-dark-600 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">承运司机签字</span>
                </div>
                {driverSigned ? (
                  <span className="text-safe text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 已签署
                  </span>
                ) : (
                  !isCompleted && (
                    <button
                      onClick={() => setSignMode('driver')}
                      className="text-ice text-xs px-3 py-1 rounded-full bg-ice/10 font-medium"
                    >
                      签字
                    </button>
                  )
                )}
              </div>
              <div className="flex items-center justify-between bg-dark-600 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">接收人签字</span>
                </div>
                {receiverSigned ? (
                  <span className="text-safe text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 已签署
                  </span>
                ) : (
                  !isCompleted && (
                    <button
                      onClick={() => setSignMode('receiver')}
                      className="text-ice text-xs px-3 py-1 rounded-full bg-ice/10 font-medium"
                    >
                      签字
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {allConfirmed && allSigned && !isCompleted && (
          <button
            onClick={handleCompleteHandover}
            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-safe to-emerald-500 text-white btn-3d flex items-center justify-center gap-2 animate-slide-up"
          >
            <CheckCircle2 className="w-5 h-5" />
            确认完成交接
          </button>
        )}

        {isCompleted && (
          <div className="space-y-3 mt-2">
            <div className="bg-safe/10 border border-safe/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-safe" />
                <span className="text-sm font-semibold text-safe">交接完成</span>
              </div>
              {task.completedTime && (
                <p className="text-xs text-gray-400">
                  完成时间：{new Date(task.completedTime).toLocaleString('zh-CN')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                全程冷链运输记录已归档，可作为运输凭证追溯
              </p>
            </div>
            <button
              onClick={() => setShowVoucher(true)}
              className="w-full py-3.5 rounded-2xl font-medium text-sm bg-ice/10 text-ice border border-ice/30 active:bg-ice/20 transition-colors flex items-center justify-center gap-2 mb-2"
            >
              <FileCheck className="w-4 h-4" />
              预览凭证
            </button>
            <button
              onClick={handleExportVoucher}
              className="w-full py-3.5 rounded-2xl font-medium text-sm bg-safe/10 text-safe border border-safe/30 active:bg-safe/20 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <Download className="w-4 h-4" />
              导出凭证（报账用）
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-2xl font-medium text-sm bg-dark-600 text-gray-300 border border-dark-500 active:bg-dark-500 transition-colors"
            >
              返回首页
            </button>
          </div>
        )}
      </div>

      {signMode && (
        <div className="fixed inset-0 z-50 bg-dark-900 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-lg font-semibold text-white">
              {signMode === 'driver' ? '承运司机签字' : '接收人签字'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearCanvas}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-600"
              >
                <Eraser className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => setSignMode(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-600"
              >
                <XCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 px-5 pb-4">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              className="w-full h-full rounded-2xl border-2 border-dashed border-gray-600 touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="px-5 pb-6">
            <button
              onClick={handleConfirmSign}
              className="w-full py-3.5 rounded-2xl font-medium text-sm bg-safe text-white btn-3d flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              确认签字
            </button>
          </div>
        </div>
      )}

      {showVoucher && (
        <div className="fixed inset-0 z-50 bg-dark-900/95 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-ice" />
              运输凭证预览
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportVoucher}
                className="px-4 h-10 flex items-center justify-center rounded-xl bg-safe/20 text-safe text-sm font-medium"
              >
                <Download className="w-4 h-4 mr-1.5" />
                导出
              </button>
              <button
                onClick={() => setShowVoucher(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-700"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {task && (
              <div className="bg-white rounded-2xl p-5 text-gray-900 max-w-md mx-auto">
                <div className="text-center pb-4 border-b-2 border-dashed border-gray-200 mb-4">
                  <div className="w-12 h-12 bg-ice/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileCheck className="w-6 h-6 text-ice" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">疫苗冷链运输凭证</h2>
                  <p className="text-xs text-gray-500 mt-1">全程冷链可追溯</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">基本信息</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[11px] text-gray-500">车次</p>
                        <p className="text-sm font-mono-num">{task.tripNumber}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">疫苗批号</p>
                        <p className="text-sm font-mono-num">{task.vaccineBatch}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">箱数</p>
                        <p className="text-sm">{task.boxCount} 箱</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">目的地</p>
                        <p className="text-sm">{task.destination}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">运输信息</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[11px] text-gray-500">总里程</p>
                        <p className="text-sm font-mono-num">{totalKm} km</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">铅封号</p>
                        <p className="text-sm font-mono-num">{task.sealNumber || '未填写'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">发车时间</p>
                        <p className="text-sm font-mono-num">
                          {task.departureTime ? new Date(task.departureTime).toLocaleString('zh-CN') : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">完成时间</p>
                        <p className="text-sm font-mono-num">
                          {task.completedTime ? new Date(task.completedTime).toLocaleString('zh-CN') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">温度摘要</p>
                    <div className="mt-1.5 grid grid-cols-4 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-500">平均</p>
                        <p className="text-sm font-mono-num">{tempSummary.avg.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">最高</p>
                        <p className="text-sm font-mono-num">{tempSummary.max.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">最低</p>
                        <p className="text-sm font-mono-num">{tempSummary.min.toFixed(1)}°C</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">告警</p>
                        <p className="text-sm font-mono-num">{tempSummary.warningCount} 次</p>
                      </div>
                    </div>
                  </div>

                  {taskExceptions.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">异常照片清单</p>
                      <div className="mt-1.5 space-y-2">
                        {taskExceptions.map((exc, idx) => (
                          <div key={exc.id} className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">
                                异常 {idx + 1}: {EXCEPTION_REASON_MAP[exc.reason]}
                              </span>
                              {exc.disposalResult && (
                                <span className="text-[10px] text-safe/80 bg-safe/10 px-2 py-0.5 rounded">
                                  {DISPOSAL_RESULT_MAP[exc.disposalResult]}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {exc.photos.length} 张照片 · {new Date(exc.timestamp).toLocaleString('zh-CN')}
                            </p>
                            {exc.photos.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {exc.photos.map((p, pi) => (
                                  <span key={pi} className="text-[10px] text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                    照片{pi + 1}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="h-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center mb-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[11px] text-gray-500">承运司机签字</p>
                        <p className="text-xs font-medium">{driverSigned ? '已签署' : '未签署'}</p>
                      </div>
                      <div className="text-center">
                        <div className="h-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center mb-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-[11px] text-gray-500">接收人签字</p>
                        <p className="text-xs font-medium">{receiverSigned ? '已签署' : '未签署'}</p>
                      </div>
                    </div>
                  </div>

                  {task.completedTime && (
                    <div className="pt-3 border-t border-gray-100 text-center">
                      <p className="text-[11px] text-gray-500">完成时间</p>
                      <p className="text-sm font-mono-num">
                        {new Date(task.completedTime).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <p className="text-[10px] text-gray-400">
                      本凭证由系统自动生成，{new Date().toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

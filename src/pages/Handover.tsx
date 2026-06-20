import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import { EXCEPTION_REASON_MAP } from '@/types'
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

  const taskExceptions = taskId ? exceptionRecords.filter((e) => e.taskId === taskId) : []
  const taskInspections = taskId ? inspectionRecords.filter((i) => i.taskId === taskId) : []

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

  const handleCompleteHandover = () => {
    if (task) {
      updateTask(task.id, { status: 'completed' })
      addHandoverRecord({
        taskId: task.id,
        vaccineBatchConfirmed: confirmItems.vaccineBatch,
        boxCountConfirmed: confirmItems.boxCount,
        tempRecordsConfirmed: confirmItems.tempRecords,
        exceptionRecordsReviewed: confirmItems.exceptionRecords,
        driverSignature: driverSigned ? 'signed' : undefined,
        receiverSignature: receiverSigned ? 'signed' : undefined,
        handoverTime: new Date().toISOString(),
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

  if (completed) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-full bg-safe/20 flex items-center justify-center mb-6 animate-scale-in">
          <Check className="w-10 h-10 text-safe" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">交接完成</h2>
        <p className="text-gray-400 text-sm text-center mb-2">
          {task.tripNumber} 已成功交接
        </p>
        <p className="text-gray-500 text-xs text-center mb-8">
          全程冷链轨迹已归档，可追溯
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-3.5 rounded-2xl font-medium text-sm bg-safe text-white btn-3d"
        >
          返回首页
        </button>
      </div>
    )
  }

  const toggleConfirm = (key: keyof typeof confirmItems) => {
    const newItems = { ...confirmItems, [key]: !confirmItems[key] }
    setConfirmItems(newItems)
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-8">
      <PageHeader title="交接确认" />

      {task.status === 'handover' && (
        <div className="bg-purple-500/15 border-b border-purple-500/30 px-5 py-2.5 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">交接中 · 请与接收人核对</span>
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        {task.sealNumber && (
          <div className="bg-dark-700 rounded-2xl p-4 border-glass">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-300">发车信息</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">铅封号</p>
                <p className="font-mono-num text-white">{task.sealNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">装车照片</p>
                <p className="text-ice">
                  {task.photos.length > 0 ? `${task.photos.length} 张` : '未上传'}
                </p>
              </div>
              {task.departureTime && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">发车时间</p>
                  <p className="text-white">
                    {new Date(task.departureTime).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}
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
                    {record.photos.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 bg-dark-600/80 rounded-lg px-2.5 py-1.5 w-fit">
                        <Image className="w-3 h-3 text-ice" />
                        <span className="text-xs text-ice">{record.photos[0]}</span>
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

        {allConfirmed && (
          <div className="bg-dark-700 rounded-2xl p-4 border-glass animate-slide-up">
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
                  <button
                    onClick={() => setSignMode('driver')}
                    className="text-ice text-xs px-3 py-1 rounded-full bg-ice/10 font-medium"
                  >
                    签字
                  </button>
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
                  <button
                    onClick={() => setSignMode('receiver')}
                    className="text-ice text-xs px-3 py-1 rounded-full bg-ice/10 font-medium"
                  >
                    签字
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {allConfirmed && allSigned && task.status !== 'completed' && (
          <button
            onClick={handleCompleteHandover}
            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-safe to-emerald-500 text-white btn-3d flex items-center justify-center gap-2 animate-slide-up"
          >
            <CheckCircle2 className="w-5 h-5" />
            确认完成交接
          </button>
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
    </div>
  )
}

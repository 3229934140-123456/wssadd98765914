export type TaskStatus = 'pending' | 'departing' | 'in_transit' | 'handover' | 'completed'

export type ExceptionReason = 'traffic_jam' | 'temp_stop' | 'equipment_failure' | 'other'

export type DisposalResult = 'contacted_dispatch' | 'replaced_ice_packs' | 'continue_monitoring' | 'resolved' | 'pending'

export const DISPOSAL_RESULT_MAP: Record<DisposalResult, string> = {
  contacted_dispatch: '已联系调度',
  replaced_ice_packs: '已更换冰排',
  continue_monitoring: '继续观察',
  resolved: '问题已解决',
  pending: '待处理',
}

export interface TemperatureLog {
  id: string
  taskId: string
  timestamp: string
  temp: number
  distance: number
  eventType?: 'inspection' | 'exception' | 'warning' | 'normal'
  eventId?: string
}

export interface TransportTask {
  id: string
  tripNumber: string
  vaccineBatch: string
  boxCount: number
  destination: string
  destinationContact: string
  status: TaskStatus
  currentTemp: number
  targetTempRange: [number, number]
  warningTemp: number
  sealNumber?: string
  departureTime?: string
  estimatedArrival?: string
  totalDistance?: number
  remainingDistance?: number
  photos: string[]
  boxScanned: boolean
  probeConnected: boolean
  completedTime?: string
}

export interface InspectionRecord {
  id: string
  taskId: string
  timestamp: string
  doorOpened: boolean
  icePackDisplaced: boolean
  tempNormal: boolean
  notes?: string
}

export interface ExceptionRecord {
  id: string
  taskId: string
  timestamp: string
  reason: ExceptionReason
  description?: string
  photos: string[]
  photoTimes?: string[]
  tempAtTime: number
  disposalResult?: DisposalResult
  disposalNotes?: string
  disposalTime?: string
}

export interface HandoverRecord {
  taskId: string
  vaccineBatchConfirmed: boolean
  boxCountConfirmed: boolean
  tempRecordsConfirmed: boolean
  exceptionRecordsReviewed: boolean
  driverSignature?: string
  receiverSignature?: string
  handoverTime?: string
}

export const EXCEPTION_REASON_MAP: Record<ExceptionReason, string> = {
  traffic_jam: '堵车',
  temp_stop: '临时停车',
  equipment_failure: '设备故障',
  other: '其他',
}

export const STATUS_LABEL_MAP: Record<TaskStatus, string> = {
  pending: '待发车',
  departing: '发车中',
  in_transit: '运输中',
  handover: '交接中',
  completed: '已完成',
}

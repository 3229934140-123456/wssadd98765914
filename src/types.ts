export type TaskStatus = 'pending' | 'departing' | 'in_transit' | 'handover' | 'completed'

export type ExceptionReason = 'traffic_jam' | 'temp_stop' | 'equipment_failure' | 'other'

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

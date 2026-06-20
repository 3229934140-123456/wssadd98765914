import { create } from 'zustand'
import type { TransportTask, InspectionRecord, ExceptionRecord, HandoverRecord } from '@/types'

const mockTasks: TransportTask[] = [
  {
    id: 'task-001',
    tripNumber: 'VC20260621-001',
    vaccineBatch: '202605-BHV-0032',
    boxCount: 24,
    destination: '朝阳区疾控中心仓库',
    destinationContact: '张主任 010-6501xxxx',
    status: 'pending',
    currentTemp: 3.2,
    targetTempRange: [2, 8],
    warningTemp: 7,
    photos: [],
    boxScanned: false,
    probeConnected: false,
  },
  {
    id: 'task-002',
    tripNumber: 'VC20260621-002',
    vaccineBatch: '202605-IPV-0118',
    boxCount: 16,
    destination: '海淀区万寿路接种点',
    destinationContact: '李医生 010-8862xxxx',
    status: 'pending',
    currentTemp: 4.1,
    targetTempRange: [2, 8],
    warningTemp: 7,
    photos: [],
    boxScanned: false,
    probeConnected: false,
  },
  {
    id: 'task-003',
    tripNumber: 'VC20260620-005',
    vaccineBatch: '202604-DPT-0256',
    boxCount: 32,
    destination: '西城区德胜接种点',
    destinationContact: '王护士 010-8205xxxx',
    status: 'completed',
    currentTemp: 3.8,
    targetTempRange: [2, 8],
    warningTemp: 7,
    photos: [],
    boxScanned: true,
    probeConnected: true,
  },
]

interface AppState {
  tasks: TransportTask[]
  inspectionRecords: InspectionRecord[]
  exceptionRecords: ExceptionRecord[]
  handoverRecords: HandoverRecord[]
  tempSimulationInterval: ReturnType<typeof setInterval> | null

  getTaskById: (id: string) => TransportTask | undefined
  updateTask: (id: string, updates: Partial<TransportTask>) => void
  addInspectionRecord: (record: InspectionRecord) => void
  addExceptionRecord: (record: ExceptionRecord) => void
  addHandoverRecord: (record: HandoverRecord) => void
  startTempSimulation: (taskId: string) => void
  stopTempSimulation: () => void
  simulateTempChange: (taskId: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: mockTasks,
  inspectionRecords: [],
  exceptionRecords: [],
  handoverRecords: [],
  tempSimulationInterval: null,

  getTaskById: (id: string) => {
    return get().tasks.find((t) => t.id === id)
  },

  updateTask: (id: string, updates: Partial<TransportTask>) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  addInspectionRecord: (record: InspectionRecord) => {
    set((state) => ({
      inspectionRecords: [...state.inspectionRecords, record],
    }))
  },

  addExceptionRecord: (record: ExceptionRecord) => {
    set((state) => ({
      exceptionRecords: [...state.exceptionRecords, record],
    }))
  },

  addHandoverRecord: (record: HandoverRecord) => {
    set((state) => ({
      handoverRecords: [...state.handoverRecords, record],
    }))
  },

  startTempSimulation: (taskId: string) => {
    const interval = setInterval(() => {
      get().simulateTempChange(taskId)
    }, 3000)
    set({ tempSimulationInterval: interval })
  },

  stopTempSimulation: () => {
    const interval = get().tempSimulationInterval
    if (interval) {
      clearInterval(interval)
      set({ tempSimulationInterval: null })
    }
  },

  simulateTempChange: (taskId: string) => {
    const task = get().getTaskById(taskId)
    if (!task || task.status !== 'in_transit') return

    const randomFactor = (Math.random() - 0.5) * 0.4
    const spikeChance = Math.random()
    let newTemp = task.currentTemp + randomFactor

    if (spikeChance > 0.92) {
      newTemp += 1.5
    }

    newTemp = Math.max(1, Math.min(10, newTemp))
    newTemp = Math.round(newTemp * 10) / 10

    get().updateTask(taskId, {
      currentTemp: newTemp,
      remainingDistance: Math.max(0, (task.remainingDistance ?? 120) - Math.random() * 2),
    })
  },
}))

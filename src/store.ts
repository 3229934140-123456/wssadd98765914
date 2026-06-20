import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  TransportTask,
  InspectionRecord,
  ExceptionRecord,
  HandoverRecord,
  TemperatureLog,
  HandoverChecklist,
  DisposalStep,
} from '@/types'

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
    totalDistance: 120,
    remainingDistance: 120,
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
    totalDistance: 85,
    remainingDistance: 85,
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
    totalDistance: 65,
    remainingDistance: 0,
    photos: [],
    boxScanned: true,
    probeConnected: true,
    completedTime: '2026-06-20T15:30:00.000Z',
  },
  {
    id: 'task-004',
    tripNumber: 'VC20260619-011',
    vaccineBatch: '202605-MMR-0089',
    boxCount: 12,
    destination: '东城区东直门接种点',
    destinationContact: '赵医生 010-6415xxxx',
    status: 'completed',
    currentTemp: 4.5,
    targetTempRange: [2, 8],
    warningTemp: 7,
    totalDistance: 48,
    remainingDistance: 0,
    photos: [],
    boxScanned: true,
    probeConnected: true,
    completedTime: '2026-06-19T11:20:00.000Z',
  },
  {
    id: 'task-005',
    tripNumber: 'VC20260618-007',
    vaccineBatch: '202604-HEPB-0142',
    boxCount: 28,
    destination: '丰台区方庄接种点',
    destinationContact: '孙护士 010-6768xxxx',
    status: 'completed',
    currentTemp: 3.6,
    targetTempRange: [2, 8],
    warningTemp: 7,
    totalDistance: 72,
    remainingDistance: 0,
    photos: [],
    boxScanned: true,
    probeConnected: true,
    completedTime: '2026-06-18T16:45:00.000Z',
  },
]

interface HandoverConfirmState {
  taskId: string
  vaccineBatchConfirmed: boolean
  boxCountConfirmed: boolean
  tempRecordsConfirmed: boolean
  exceptionRecordsReviewed: boolean
  driverSigned: boolean
  receiverSigned: boolean
  checklist: HandoverChecklist
}

interface AppState {
  tasks: TransportTask[]
  inspectionRecords: InspectionRecord[]
  exceptionRecords: ExceptionRecord[]
  handoverRecords: HandoverRecord[]
  handoverConfirms: HandoverConfirmState[]
  temperatureLogs: TemperatureLog[]
  tempSimulationInterval: ReturnType<typeof setInterval> | null

  getTaskById: (id: string) => TransportTask | undefined
  searchCompletedTasks: (keyword: string) => TransportTask[]
  updateTask: (id: string, updates: Partial<TransportTask>) => void
  addInspectionRecord: (record: InspectionRecord) => void
  addExceptionRecord: (record: ExceptionRecord) => void
  updateExceptionRecord: (id: string, updates: Partial<ExceptionRecord>) => void
  addDisposalStep: (exceptionId: string, step: DisposalStep) => void
  addHandoverRecord: (record: HandoverRecord) => void
  getHandoverConfirm: (taskId: string) => HandoverConfirmState
  updateHandoverConfirm: (taskId: string, updates: Partial<HandoverConfirmState>) => void
  getTemperatureLogsByTaskId: (taskId: string) => TemperatureLog[]
  addTemperatureLog: (log: TemperatureLog) => void
  startTempSimulation: (taskId: string) => void
  stopTempSimulation: () => void
  simulateTempChange: (taskId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: mockTasks,
      inspectionRecords: [],
      exceptionRecords: [],
      handoverRecords: [],
      handoverConfirms: [],
      temperatureLogs: [],
      tempSimulationInterval: null,

      getTaskById: (id: string) => {
        return get().tasks.find((t) => t.id === id)
      },

      searchCompletedTasks: (keyword: string) => {
        const kw = keyword.trim().toLowerCase()
        const all = get().tasks.filter((t) => t.status === 'completed')
        if (!kw) return all
        return all.filter(
          (t) =>
            t.tripNumber.toLowerCase().includes(kw) ||
            t.vaccineBatch.toLowerCase().includes(kw) ||
            t.destination.toLowerCase().includes(kw) ||
            (t.completedTime && new Date(t.completedTime).toLocaleDateString('zh-CN').includes(kw)) ||
            (t.completedTime && new Date(t.completedTime).toISOString().split('T')[0].includes(kw))
        )
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
          exceptionRecords: [...state.exceptionRecords, { ...record, disposalSteps: record.disposalSteps || [] }],
        }))
      },

      updateExceptionRecord: (id: string, updates: Partial<ExceptionRecord>) => {
        set((state) => ({
          exceptionRecords: state.exceptionRecords.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }))
      },

      addDisposalStep: (exceptionId: string, step: DisposalStep) => {
        set((state) => ({
          exceptionRecords: state.exceptionRecords.map((e) =>
            e.id === exceptionId
              ? {
                  ...e,
                  disposalResult: step.result,
                  disposalTime: step.timestamp,
                  disposalNotes: step.notes,
                  disposalSteps: [...(e.disposalSteps || []), step],
                }
              : e
          ),
        }))
      },

      addHandoverRecord: (record: HandoverRecord) => {
        set((state) => ({
          handoverRecords: [...state.handoverRecords, record],
        }))
      },

      getHandoverConfirm: (taskId: string) => {
        const existing = get().handoverConfirms.find((h) => h.taskId === taskId)
        if (existing) return existing
        return {
          taskId,
          vaccineBatchConfirmed: false,
          boxCountConfirmed: false,
          tempRecordsConfirmed: false,
          exceptionRecordsReviewed: false,
          driverSigned: false,
          receiverSigned: false,
          checklist: {
            vaccineBatchChecked: false,
            boxCountChecked: false,
            sealChecked: false,
            probeChecked: false,
            exceptionHandled: false,
          },
        }
      },

      updateHandoverConfirm: (taskId: string, updates: Partial<HandoverConfirmState>) => {
        set((state) => {
          const exists = state.handoverConfirms.find((h) => h.taskId === taskId)
          if (exists) {
            return {
              handoverConfirms: state.handoverConfirms.map((h) =>
                h.taskId === taskId
                  ? {
                      ...h,
                      ...updates,
                      checklist: updates.checklist
                        ? { ...h.checklist, ...updates.checklist }
                        : h.checklist,
                    }
                  : h
              ),
            }
          }
          return {
            handoverConfirms: [
              ...state.handoverConfirms,
              {
                taskId,
                vaccineBatchConfirmed: false,
                boxCountConfirmed: false,
                tempRecordsConfirmed: false,
                exceptionRecordsReviewed: false,
                driverSigned: false,
                receiverSigned: false,
                checklist: {
                  vaccineBatchChecked: false,
                  boxCountChecked: false,
                  sealChecked: false,
                  probeChecked: false,
                  exceptionHandled: false,
                },
                ...updates,
              },
            ],
          }
        })
      },

      getTemperatureLogsByTaskId: (taskId: string) => {
        return get().temperatureLogs.filter((l) => l.taskId === taskId)
      },

      addTemperatureLog: (log: TemperatureLog) => {
        set((state) => ({
          temperatureLogs: [...state.temperatureLogs, log],
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

        const totalDist = task.totalDistance ?? 120
        const distReduction = 0.5 + Math.random() * 1.0
        const newRemaining = Math.max(0, (task.remainingDistance ?? totalDist) - distReduction)
        const avgSpeedKmh = 60
        const hoursLeft = newRemaining / avgSpeedKmh
        const etaDate = new Date(Date.now() + hoursLeft * 60 * 60 * 1000)
        const estimatedArrival = etaDate.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })

        get().updateTask(taskId, {
          currentTemp: newTemp,
          remainingDistance: newRemaining,
          estimatedArrival,
        })

        const isWarning = newTemp >= task.warningTemp
        const distanceTravelled = totalDist - newRemaining
        get().addTemperatureLog({
          id: `log-${Date.now()}`,
          taskId,
          timestamp: new Date().toISOString(),
          temp: newTemp,
          distance: Math.round(distanceTravelled),
          eventType: isWarning ? 'warning' : 'normal',
        })
      },
    }),
    {
      name: 'vaccine-transport',
      partialize: (state) => ({
        tasks: state.tasks,
        inspectionRecords: state.inspectionRecords,
        exceptionRecords: state.exceptionRecords,
        handoverRecords: state.handoverRecords,
        handoverConfirms: state.handoverConfirms,
        temperatureLogs: state.temperatureLogs,
      }),
    }
  )
)

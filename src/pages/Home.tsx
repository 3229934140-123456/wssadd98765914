import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import TaskCard from '@/components/TaskCard'
import StepIndicator from '@/components/StepIndicator'
import { Truck, Snowflake, Bell } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { tasks } = useAppStore()

  const todayTasks = tasks.filter((t) => t.status !== 'completed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const activeTask = tasks.find((t) => t.status === 'in_transit' || t.status === 'handover')

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="bg-gradient-to-b from-dark-800 to-dark-900 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-white">疫苗冷链运输</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-dark-600">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full border-2 border-dark-800" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 bg-dark-700/60 rounded-2xl p-4 border-glass">
          <div className="w-12 h-12 rounded-xl bg-ice/10 flex items-center justify-center">
            <Snowflake className="w-6 h-6 text-ice" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              今日待运 <span className="text-white font-semibold">{todayTasks.length}</span> 车次
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              已完成 <span className="text-safe">{completedTasks.length}</span> 车次
            </p>
          </div>
          {activeTask && (
            <div className="flex items-center gap-1.5 bg-safe/10 text-safe px-3 py-1.5 rounded-full">
              <Truck className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">运输中</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-8">
        {activeTask && (
          <div className="mb-6 animate-slide-up">
            <StepIndicator currentStatus={activeTask.status} />
          </div>
        )}

        {todayTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-400 mb-3 tracking-wide">
              今日任务
            </h2>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => {
                    if (task.status === 'pending') {
                      navigate(`/depart/${task.id}`)
                    } else if (task.status === 'in_transit') {
                      navigate(`/transit/${task.id}`)
                    } else if (task.status === 'handover') {
                      navigate(`/handover/${task.id}`)
                    } else if (task.status === 'departing') {
                      navigate(`/depart/${task.id}`)
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {todayTasks.length === 0 && !activeTask && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">暂无待运任务</p>
            <p className="text-gray-600 text-xs mt-1">请等待调度分配</p>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3 tracking-wide">
              近期完成
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate(`/handover/${task.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

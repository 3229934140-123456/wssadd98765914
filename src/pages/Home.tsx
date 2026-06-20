import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import TaskCard from '@/components/TaskCard'
import StepIndicator from '@/components/StepIndicator'
import { Truck, Snowflake, Bell, Search, X, Calendar, Hash } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { tasks, searchCompletedTasks } = useAppStore()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchActive, setSearchActive] = useState(false)

  const todayTasks = tasks.filter((t) => t.status !== 'completed')
  const activeTask = tasks.find((t) => t.status === 'in_transit' || t.status === 'handover')
  const filteredCompletedTasks = useMemo(() => {
    return searchCompletedTasks(searchKeyword)
  }, [searchKeyword, tasks, searchCompletedTasks])

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

        <div className="mt-4 flex items-center gap-3 bg-dark-700/60 rounded-2xl p-4 border-glass">
          <div className="w-12 h-12 rounded-xl bg-ice/10 flex items-center justify-center">
            <Snowflake className="w-6 h-6 text-ice" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              今日待运 <span className="text-white font-semibold">{todayTasks.length}</span> 车次
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              已完成 <span className="text-safe">{filteredCompletedTasks.length}</span> 车次
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

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 tracking-wide">
              近期完成
            </h2>
            {!searchActive ? (
              <button
                onClick={() => setSearchActive(true)}
                className="flex items-center gap-1.5 text-xs text-ice bg-ice/10 px-2.5 py-1.5 rounded-xl"
              >
                <Search className="w-3.5 h-3.5" />
                搜索归档
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchActive(false)
                  setSearchKeyword('')
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 bg-dark-700 px-2.5 py-1.5 rounded-xl"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
            )}
          </div>

          {searchActive && (
            <div className="mb-4 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  autoFocus
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索车次、批号、目的地或日期..."
                  className="w-full bg-dark-700 border border-dark-600 rounded-2xl pl-10 pr-10 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-ice/50 transition-colors"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-dark-600"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-dark-700 px-2 py-1 rounded-full">
                  <Hash className="w-2.5 h-2.5" />
                  车次号
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-dark-700 px-2 py-1 rounded-full">
                  <Hash className="w-2.5 h-2.5" />
                  疫苗批号
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-dark-700 px-2 py-1 rounded-full">
                  <Calendar className="w-2.5 h-2.5" />
                  2026-06-20
                </div>
              </div>
              {searchKeyword && (
                <p className="text-[11px] text-gray-500 mt-2">
                  找到 <span className="text-ice">{filteredCompletedTasks.length}</span> 条匹配的归档单
                </p>
              )}
            </div>
          )}

          {filteredCompletedTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredCompletedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate(`/handover/${task.id}`)}
                  highlight={searchKeyword || undefined}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 bg-dark-700/30 rounded-2xl border border-dark-700">
              <Search className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">无匹配的归档单</p>
              <p className="text-gray-600 text-xs mt-0.5">试试更换关键词搜索</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

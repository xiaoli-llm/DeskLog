import { create } from 'zustand'
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority } from '@shared/types'

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null

  // Actions
  fetchTasks: (filters?: {
    project_id?: number
    status?: TaskStatus
    priority?: TaskPriority
    due_date?: string
    start_date?: string
    end_date?: string
  }) => Promise<void>
  createTask: (task: CreateTaskDto) => Promise<Task>
  updateTask: (id: number, task: UpdateTaskDto) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  toggleTaskStatus: (id: number) => Promise<void>
  batchUpdateTasks: (updates: { id: number; data: UpdateTaskDto }[]) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async (filters) => {
    set({ loading: true, error: null })
    try {
      const tasks = await window.electronAPI.getTasks(filters)
      set({ tasks: tasks || [], loading: false })
    } catch (error) {
      set({ error: safeError(error), loading: false })
    }
  },

  createTask: async (task) => {
    try {
      const newTask = await window.electronAPI.createTask(task)
      if (!newTask) throw new Error('创建任务失败：服务端未返回有效数据')
      set((state) => ({ tasks: [newTask, ...state.tasks] }))
      return newTask
    } catch (error) {
      set({ error: safeError(error) })
      throw error
    }
  },

  updateTask: async (id, task) => {
    try {
      const updatedTask = await window.electronAPI.updateTask(id, task)
      if (!updatedTask) throw new Error('更新任务失败：服务端未返回有效数据')
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t))
      }))
      return updatedTask
    } catch (error) {
      set({ error: safeError(error) })
      throw error
    }
  },

  deleteTask: async (id) => {
    try {
      await window.electronAPI.deleteTask(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }))
    } catch (error) {
      set({ error: safeError(error) })
    }
  },

  toggleTaskStatus: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    // done/cancelled → todo，其他 → done
    const newStatus: TaskStatus =
      task.status === 'done' || task.status === 'cancelled' ? 'todo' : 'done'
    try {
      await get().updateTask(id, { status: newStatus })
    } catch (error) {
      set({ error: safeError(error) })
    }
  },

  batchUpdateTasks: async (updates) => {
    try {
      await window.electronAPI.batchUpdateTasks(updates)
      await get().fetchTasks()
    } catch (error) {
      set({ error: safeError(error) })
    }
  }
}))

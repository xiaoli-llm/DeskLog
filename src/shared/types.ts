// ==================== 项目相关类型 ====================

export interface Project {
  id: number
  name: string
  description: string | null
  color: string
  status: 'active' | 'archived' | 'completed'
  created_at: string
  updated_at: string
}

export interface CreateProjectDto {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  color?: string
  status?: 'active' | 'archived' | 'completed'
}

// ==================== 任务相关类型 ====================

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export interface Task {
  id: number
  project_id: number | null
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  is_permanent: number  // 0 或 1，是否为常驻任务
  due_date: string | null
  completed_at: string | null
  estimated_hours: number | null
  actual_hours: number | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateTaskDto {
  project_id?: number
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  is_permanent?: number
  due_date?: string
  estimated_hours?: number
  sort_order?: number
}

export interface UpdateTaskDto {
  project_id?: number | null
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  is_permanent?: number
  due_date?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  sort_order?: number
}

// ==================== 日志相关类型 ====================

export type MoodType = 'good' | 'normal' | 'bad'

export interface DailyLog {
  id: number
  date: string
  summary: string | null
  mood: MoodType | null
  created_at: string
  updated_at: string
  tasks?: LogTask[]
}

export interface LogTask {
  id: number
  log_id: number
  task_id: number
  time_spent: number
  notes: string | null
  // 关联的任务信息
  title?: string
  priority?: TaskPriority
  status?: TaskStatus
  project_id?: number
}

export interface SaveDailyLogDto {
  date: string
  summary?: string
  mood?: MoodType
  tasks?: {
    task_id: number
    time_spent?: number
    notes?: string
  }[]
}

// ==================== 里程碑相关类型 ====================

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed'

export interface Milestone {
  id: number
  project_id: number
  title: string
  description: string | null
  due_date: string | null
  status: MilestoneStatus
  completed_at: string | null
  created_at: string
}

export interface CreateMilestoneDto {
  project_id: number
  title: string
  description?: string
  due_date?: string
}

export interface UpdateMilestoneDto {
  title?: string
  description?: string
  due_date?: string | null
  status?: MilestoneStatus
}

// ==================== 统计相关类型 ====================

export interface TaskStatistics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  todo_tasks: number
  cancelled_tasks: number
  urgent_tasks: number
  high_tasks: number
  medium_tasks: number
  low_tasks: number
  total_estimated_hours: number
  total_actual_hours: number
}

export interface DailyTrend {
  date: string
  completed_count: number
}

export interface ProjectProgress {
  id: number
  name: string
  color: string
  total_tasks: number
  completed_tasks: number
}

export interface Statistics {
  taskStats: TaskStatistics
  dailyTrend: DailyTrend[]
  projectProgress: ProjectProgress[]
}

export interface DateRange {
  start_date: string
  end_date: string
}

// ==================== UI 相关类型 ====================

export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path: string
}

export interface QuickTask {
  title: string
  project_id?: number
  priority?: TaskPriority
  due_date?: string
}

// ==================== Electron API 类型 ====================

export interface ElectronAPI {
  // 项目
  getProjects: () => Promise<Project[]>
  createProject: (project: CreateProjectDto) => Promise<Project>
  updateProject: (id: number, project: UpdateProjectDto) => Promise<Project>
  deleteProject: (id: number) => Promise<void>

  // 任务
  getTasks: (filters?: {
    project_id?: number
    status?: TaskStatus
    priority?: TaskPriority
    due_date?: string
    start_date?: string
    end_date?: string
  }) => Promise<Task[]>
  getTask: (id: number) => Promise<Task>
  createTask: (task: CreateTaskDto) => Promise<Task>
  updateTask: (id: number, task: UpdateTaskDto) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  batchUpdateTasks: (updates: { id: number; data: UpdateTaskDto }[]) => Promise<void>

  // 日志
  getDailyLog: (date: string) => Promise<DailyLog>
  saveDailyLog: (log: SaveDailyLogDto) => Promise<DailyLog>
  getLogDates: (month: string) => Promise<string[]>

  // 里程碑
  getMilestones: (projectId: number) => Promise<Milestone[]>
  createMilestone: (milestone: CreateMilestoneDto) => Promise<Milestone>
  updateMilestone: (id: number, milestone: UpdateMilestoneDto) => Promise<Milestone>
  deleteMilestone: (id: number) => Promise<void>

  // 统计
  getStatistics: (range: DateRange) => Promise<Statistics>
  getProjectStatistics: (projectId: number) => Promise<any>
  exportData: (format: string) => Promise<string>

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => () => void
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

import { contextBridge, ipcRenderer } from 'electron'

// 定义 API 接口
export interface ElectronAPI {
  // 项目
  getProjects: () => Promise<any[]>
  createProject: (project: any) => Promise<any>
  updateProject: (id: number, project: any) => Promise<any>
  deleteProject: (id: number) => Promise<void>

  // 任务
  getTasks: (filters?: any) => Promise<any[]>
  getTask: (id: number) => Promise<any>
  createTask: (task: any) => Promise<any>
  updateTask: (id: number, task: any) => Promise<any>
  deleteTask: (id: number) => Promise<void>
  batchUpdateTasks: (updates: any[]) => Promise<void>

  // 日志
  getDailyLog: (date: string) => Promise<any>
  saveDailyLog: (log: any) => Promise<any>
  getLogDates: (month: string) => Promise<string[]>

  // 里程碑
  getMilestones: (projectId: number) => Promise<any[]>
  createMilestone: (milestone: any) => Promise<any>
  updateMilestone: (id: number, milestone: any) => Promise<any>
  deleteMilestone: (id: number) => Promise<void>

  // 统计
  getStatistics: (range: any) => Promise<any>
  getProjectStatistics: (projectId: number) => Promise<any>
  exportData: (format: string) => Promise<string>

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => () => void
}

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 项目
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (project) => ipcRenderer.invoke('create-project', project),
  updateProject: (id, project) => ipcRenderer.invoke('update-project', id, project),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  // 任务
  getTasks: (filters) => ipcRenderer.invoke('get-tasks', filters),
  getTask: (id) => ipcRenderer.invoke('get-task', id),
  createTask: (task) => ipcRenderer.invoke('create-task', task),
  updateTask: (id, task) => ipcRenderer.invoke('update-task', id, task),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  batchUpdateTasks: (updates) => ipcRenderer.invoke('batch-update-tasks', updates),

  // 日志
  getDailyLog: (date) => ipcRenderer.invoke('get-daily-log', date),
  saveDailyLog: (log) => ipcRenderer.invoke('save-daily-log', log),
  getLogDates: (month) => ipcRenderer.invoke('get-log-dates', month),

  // 里程碑
  getMilestones: (projectId) => ipcRenderer.invoke('get-milestones', projectId),
  createMilestone: (milestone) => ipcRenderer.invoke('create-milestone', milestone),
  updateMilestone: (id, milestone) => ipcRenderer.invoke('update-milestone', id, milestone),
  deleteMilestone: (id) => ipcRenderer.invoke('delete-milestone', id),

  // 统计
  getStatistics: (range) => ipcRenderer.invoke('get-statistics', range),
  getProjectStatistics: (projectId) => ipcRenderer.invoke('get-project-statistics', projectId),
  exportData: (format) => ipcRenderer.invoke('export-data', format),

  // 事件监听
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = ['show-quick-add']
    if (validChannels.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => callback(...args)
      ipcRenderer.on(channel, subscription)
      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    }
    return () => {}
  }
} as ElectronAPI)

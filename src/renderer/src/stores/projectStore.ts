import { create } from 'zustand'
import { Project, CreateProjectDto, UpdateProjectDto } from '@shared/types'

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

interface ProjectState {
  projects: Project[]
  loading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  createProject: (project: CreateProjectDto) => Promise<Project>
  updateProject: (id: number, project: UpdateProjectDto) => Promise<Project>
  deleteProject: (id: number) => Promise<void>
  getProject: (id: number) => Project | undefined
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await window.electronAPI.getProjects()
      set({ projects: projects || [], loading: false })
    } catch (error) {
      set({ error: safeError(error), loading: false })
    }
  },

  createProject: async (project) => {
    try {
      const newProject = await window.electronAPI.createProject(project)
      if (!newProject) throw new Error('创建项目失败：服务端未返回有效数据')
      set((state) => ({ projects: [newProject, ...state.projects] }))
      return newProject
    } catch (error) {
      set({ error: safeError(error) })
      throw error
    }
  },

  updateProject: async (id, project) => {
    try {
      const updatedProject = await window.electronAPI.updateProject(id, project)
      if (!updatedProject) throw new Error('更新项目失败：服务端未返回有效数据')
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p))
      }))
      return updatedProject
    } catch (error) {
      set({ error: safeError(error) })
      throw error
    }
  },

  deleteProject: async (id) => {
    try {
      await window.electronAPI.deleteProject(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      }))
    } catch (error) {
      set({ error: safeError(error) })
    }
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id)
  }
}))

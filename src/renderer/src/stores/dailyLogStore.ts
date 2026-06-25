import { create } from 'zustand'
import { DailyLog, SaveDailyLogDto, MoodType } from '@shared/types'
import dayjs from 'dayjs'

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// 创建一个空的日志对象，确保 currentLog 永远不为 null
function createEmptyLog(date: string): DailyLog {
  return {
    id: 0,
    date,
    summary: null,
    mood: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tasks: []
  }
}

interface DailyLogState {
  currentLog: DailyLog
  selectedDate: string
  logDates: string[]
  loading: boolean
  error: string | null

  // Actions
  setSelectedDate: (date: string) => void
  fetchDailyLog: (date: string, version?: number) => Promise<void>
  saveDailyLog: (log: SaveDailyLogDto) => Promise<void>
  fetchLogDates: (month: string) => Promise<void>
  updateSummary: (summary: string) => void
  updateMood: (mood: MoodType) => void
}

// 请求版本号，防止快速切换日期时旧请求覆盖新数据
let fetchVersion = 0

export const useDailyLogStore = create<DailyLogState>((set, get) => ({
  currentLog: createEmptyLog(dayjs().format('YYYY-MM-DD')),
  selectedDate: dayjs().format('YYYY-MM-DD'),
  logDates: [],
  loading: false,
  error: null,

  setSelectedDate: (date) => {
    set({ selectedDate: date })
    const version = ++fetchVersion
    get().fetchDailyLog(date, version)
  },

  fetchDailyLog: async (date, version?) => {
    // 如果传入了版本号，检查是否已被更新的请求覆盖
    if (version !== undefined && version !== fetchVersion) return

    set({ loading: true, error: null })
    try {
      const log = await window.electronAPI.getDailyLog(date)

      // 再次检查：如果在等待期间 selectedDate 已经变了，丢弃这次结果
      if (get().selectedDate !== date) return

      set({ currentLog: log || createEmptyLog(date), loading: false })
    } catch (error) {
      set({ error: safeError(error), loading: false })
    }
  },

  saveDailyLog: async (log) => {
    set({ loading: true, error: null })
    try {
      const savedLog = await window.electronAPI.saveDailyLog(log)
      // 保存后立即更新 currentLog，确保 UI 与数据同步
      set({ currentLog: savedLog || createEmptyLog(log.date), loading: false })
    } catch (error) {
      set({ error: safeError(error), loading: false })
      throw error
    }
  },

  fetchLogDates: async (month) => {
    try {
      const dates = await window.electronAPI.getLogDates(month)
      set({ logDates: dates || [] })
    } catch (error) {
      set({ error: safeError(error) })
    }
  },

  updateSummary: (summary) => {
    set((state) => ({
      currentLog: { ...state.currentLog, summary }
    }))
  },

  updateMood: (mood) => {
    set((state) => ({
      currentLog: { ...state.currentLog, mood }
    }))
  }
}))

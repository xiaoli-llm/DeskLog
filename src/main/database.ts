import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { join } from 'path'
import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { Project, Task, DailyLog, Milestone } from '../shared/types'

export class TaskDatabase {
  private db: SqlJsDatabase | null = null
  private dbPath: string
  private initPromise: Promise<void>

  constructor() {
    // 确保数据目录存在
    const userDataPath = app.getPath('userData')
    const dbDir = join(userDataPath, 'data')
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    this.dbPath = join(dbDir, 'desklog.db')
    this.initPromise = this.init()
  }

  private async init(): Promise<void> {
    const SQL = await initSqlJs()

    // 如果数据库文件存在，读取它
    if (existsSync(this.dbPath)) {
      const fileBuffer = readFileSync(this.dbPath)
      this.db = new SQL.Database(fileBuffer)
    } else {
      this.db = new SQL.Database()
    }

    this.db.run('PRAGMA journal_mode = WAL')
    this.db.run('PRAGMA foreign_keys = ON')
    this.initTables()
    this.save()
  }

  private save(): void {
    if (this.db) {
      const data = this.db.export()
      const buffer = Buffer.from(data)
      writeFileSync(this.dbPath, buffer)
    }
  }

  private async ensureReady(): Promise<void> {
    await this.initPromise
  }

  private initTables(): void {
    if (!this.db) return

    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#1890ff',
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done', 'cancelled')),
        due_date DATE,
        completed_at DATETIME,
        estimated_hours REAL,
        actual_hours REAL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        summary TEXT,
        mood TEXT CHECK(mood IN ('good', 'normal', 'bad')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS log_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        time_spent REAL DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        UNIQUE(log_id, task_id)
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 创建索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id)')
  }

  private queryAll(sql: string, params: any[] = []): any[] {
    if (!this.db) return []
    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }

  private queryOne(sql: string, params: any[] = []): any | undefined {
    const results = this.queryAll(sql, params)
    return results.length > 0 ? results[0] : undefined
  }

  private run(sql: string, params: any[] = []): void {
    if (!this.db) return
    this.db.run(sql, params)
    this.save()
  }

  private getLastInsertRowId(): number {
    if (!this.db) return 0
    const result = this.queryOne('SELECT last_insert_rowid() as id')
    return result ? result.id : 0
  }

  // ==================== 项目操作 ====================

  async getProjects(): Promise<Project[]> {
    await this.ensureReady()
    return this.queryAll('SELECT * FROM projects ORDER BY status ASC, updated_at DESC')
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run(
      `INSERT INTO projects (name, description, color, status) VALUES (?, ?, ?, ?)`,
      [project.name, project.description || null, project.color || '#1890ff', project.status || 'active']
    )
    // 必须在 save() 之前获取 last_insert_rowid，否则计数器会重置为 0
    const id = this.getLastInsertRowId()
    const created = await this.getProject(id)
    this.save()
    if (!created) {
      return { id, name: project.name || '', description: project.description || null, color: project.color || '#1890ff', status: project.status || 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    }
    return created
  }

  async getProject(id: number): Promise<Project | undefined> {
    await this.ensureReady()
    return this.queryOne('SELECT * FROM projects WHERE id = ?', [id])
  }

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    const fields: string[] = []
    const values: any[] = []

    if (project.name !== undefined) { fields.push('name = ?'); values.push(project.name) }
    if (project.description !== undefined) { fields.push('description = ?'); values.push(project.description) }
    if (project.color !== undefined) { fields.push('color = ?'); values.push(project.color) }
    if (project.status !== undefined) { fields.push('status = ?'); values.push(project.status) }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db.run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await this.getProject(id)
    this.save()
    if (!updated) {
      return { id, name: project.name || '', description: project.description || null, color: project.color || '#1890ff', status: project.status || 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    }
    return updated
  }

  async deleteProject(id: number): Promise<void> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run('DELETE FROM projects WHERE id = ?', [id])
    this.save()
  }

  // ==================== 任务操作 ====================

  async getTasks(filters?: {
    project_id?: number
    status?: string
    priority?: string
    due_date?: string
    start_date?: string
    end_date?: string
  }): Promise<Task[]> {
    await this.ensureReady()
    let sql = 'SELECT * FROM tasks WHERE 1=1'
    const params: any[] = []

    if (filters?.project_id !== undefined) {
      sql += ' AND project_id = ?'
      params.push(filters.project_id)
    }
    if (filters?.status) {
      sql += ' AND status = ?'
      params.push(filters.status)
    }
    if (filters?.priority) {
      sql += ' AND priority = ?'
      params.push(filters.priority)
    }
    if (filters?.due_date) {
      sql += ' AND due_date = ?'
      params.push(filters.due_date)
    }
    if (filters?.start_date) {
      sql += ' AND due_date >= ?'
      params.push(filters.start_date)
    }
    if (filters?.end_date) {
      sql += ' AND due_date <= ?'
      params.push(filters.end_date)
    }

    sql += ' ORDER BY sort_order ASC, created_at DESC'
    return this.queryAll(sql, params)
  }

  async getTask(id: number): Promise<Task | undefined> {
    await this.ensureReady()
    return this.queryOne('SELECT * FROM tasks WHERE id = ?', [id])
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run(
      `INSERT INTO tasks (project_id, title, description, priority, status, due_date, estimated_hours, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [task.project_id || null, task.title, task.description || null, task.priority || 'medium', task.status || 'todo', task.due_date || null, task.estimated_hours || null, task.sort_order || 0]
    )
    // 必须在 save() 之前获取 last_insert_rowid
    const id = this.getLastInsertRowId()
    const created = await this.getTask(id)
    this.save()
    if (!created) {
      return { id, project_id: task.project_id || null, title: task.title || '', description: task.description || null, priority: task.priority || 'medium', status: task.status || 'todo', due_date: task.due_date || null, completed_at: null, estimated_hours: task.estimated_hours || null, actual_hours: null, sort_order: task.sort_order || 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    }
    return created
  }

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    const fields: string[] = []
    const values: any[] = []

    if (task.project_id !== undefined) { fields.push('project_id = ?'); values.push(task.project_id) }
    if (task.title !== undefined) { fields.push('title = ?'); values.push(task.title) }
    if (task.description !== undefined) { fields.push('description = ?'); values.push(task.description) }
    if (task.priority !== undefined) { fields.push('priority = ?'); values.push(task.priority) }
    if (task.status !== undefined) {
      fields.push('status = ?')
      values.push(task.status)
      if (task.status === 'done') {
        fields.push('completed_at = CURRENT_TIMESTAMP')
      }
    }
    if (task.due_date !== undefined) { fields.push('due_date = ?'); values.push(task.due_date) }
    if (task.estimated_hours !== undefined) { fields.push('estimated_hours = ?'); values.push(task.estimated_hours) }
    if (task.actual_hours !== undefined) { fields.push('actual_hours = ?'); values.push(task.actual_hours) }
    if (task.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(task.sort_order) }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)
    const updated = await this.getTask(id)
    this.save()
    if (!updated) {
      return { id, project_id: task.project_id || null, title: task.title || '', description: task.description || null, priority: task.priority || 'medium', status: task.status || 'todo', due_date: task.due_date || null, completed_at: null, estimated_hours: task.estimated_hours || null, actual_hours: task.actual_hours || null, sort_order: task.sort_order || 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    }
    return updated
  }

  async deleteTask(id: number): Promise<void> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run('DELETE FROM tasks WHERE id = ?', [id])
    this.save()
  }

  async batchUpdateTasks(updates: { id: number; data: Partial<Task> }[]): Promise<void> {
    await this.ensureReady()
    // 批量执行所有更新，只写一次文件
    for (const update of updates) {
      const fields: string[] = []
      const values: any[] = []
      const task = update.data

      if (task.project_id !== undefined) { fields.push('project_id = ?'); values.push(task.project_id) }
      if (task.title !== undefined) { fields.push('title = ?'); values.push(task.title) }
      if (task.description !== undefined) { fields.push('description = ?'); values.push(task.description) }
      if (task.priority !== undefined) { fields.push('priority = ?'); values.push(task.priority) }
      if (task.status !== undefined) {
        fields.push('status = ?')
        values.push(task.status)
        if (task.status === 'done') {
          fields.push('completed_at = CURRENT_TIMESTAMP')
        }
      }
      if (task.due_date !== undefined) { fields.push('due_date = ?'); values.push(task.due_date) }
      if (task.estimated_hours !== undefined) { fields.push('estimated_hours = ?'); values.push(task.estimated_hours) }
      if (task.actual_hours !== undefined) { fields.push('actual_hours = ?'); values.push(task.actual_hours) }
      if (task.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(task.sort_order) }

      if (fields.length > 0) {
        fields.push("updated_at = CURRENT_TIMESTAMP")
        values.push(update.id)
        this.db!.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)
      }
    }
    // 所有更新完成后，只写一次文件
    this.save()
  }

  // ==================== 日志操作 ====================

  async getDailyLog(date: string): Promise<any> {
    await this.ensureReady()
    const log = this.queryOne('SELECT * FROM daily_logs WHERE date = ?', [date])

    if (!log) {
      // 返回完整的日志对象（包含 id 等字段），避免前端收到不完整数据
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

    const tasks = this.queryAll(`
      SELECT lt.*, t.title, t.priority, t.status, t.project_id
      FROM log_tasks lt
      JOIN tasks t ON lt.task_id = t.id
      WHERE lt.log_id = ?
    `, [log.id])

    return { ...log, tasks }
  }

  async saveDailyLog(log: { date: string; summary?: string; mood?: string; tasks?: any[] }): Promise<any> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')

    // 插入或更新日志
    const existingLog = this.queryOne('SELECT id FROM daily_logs WHERE date = ?', [log.date])
    if (existingLog) {
      this.db.run(
        'UPDATE daily_logs SET summary = ?, mood = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
        [log.summary || null, log.mood || null, log.date]
      )
    } else {
      this.db.run(
        'INSERT INTO daily_logs (date, summary, mood) VALUES (?, ?, ?)',
        [log.date, log.summary || null, log.mood || null]
      )
    }

    // 获取日志 ID
    const logRecord = this.queryOne('SELECT id FROM daily_logs WHERE date = ?', [log.date])

    if (!logRecord) {
      this.save()
      return this.getDailyLog(log.date)
    }

    // 清除旧的关联
    this.db.run('DELETE FROM log_tasks WHERE log_id = ?', [logRecord.id])

    // 插入新的关联
    if (log.tasks && log.tasks.length > 0) {
      for (const task of log.tasks) {
        this.db.run(
          'INSERT INTO log_tasks (log_id, task_id, time_spent, notes) VALUES (?, ?, ?, ?)',
          [logRecord.id, task.task_id, task.time_spent || 0, task.notes || null]
        )
      }
    }

    this.save()
    return this.getDailyLog(log.date)
  }

  async getLogDates(month: string): Promise<string[]> {
    await this.ensureReady()
    const results = this.queryAll(
      'SELECT date FROM daily_logs WHERE date LIKE ? ORDER BY date ASC',
      [`${month}%`]
    )
    return results.map(r => r.date)
  }

  // ==================== 里程碑操作 ====================

  async getMilestones(projectId: number): Promise<Milestone[]> {
    await this.ensureReady()
    return this.queryAll(
      'SELECT * FROM milestones WHERE project_id = ? ORDER BY due_date ASC NULLS LAST, created_at DESC',
      [projectId]
    )
  }

  async createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run(
      'INSERT INTO milestones (project_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)',
      [milestone.project_id, milestone.title, milestone.description || null, milestone.due_date || null, milestone.status || 'pending']
    )
    const id = this.getLastInsertRowId()
    const result = this.queryOne('SELECT * FROM milestones WHERE id = ?', [id])
    this.save()
    return result
  }

  async updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    const fields: string[] = []
    const values: any[] = []

    if (milestone.title !== undefined) { fields.push('title = ?'); values.push(milestone.title) }
    if (milestone.description !== undefined) { fields.push('description = ?'); values.push(milestone.description) }
    if (milestone.due_date !== undefined) { fields.push('due_date = ?'); values.push(milestone.due_date) }
    if (milestone.status !== undefined) {
      fields.push('status = ?')
      values.push(milestone.status)
      if (milestone.status === 'completed') {
        fields.push('completed_at = CURRENT_TIMESTAMP')
      }
    }

    values.push(id)
    this.db.run(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`, values)
    const result = this.queryOne('SELECT * FROM milestones WHERE id = ?', [id])
    this.save()
    return result
  }

  async deleteMilestone(id: number): Promise<void> {
    await this.ensureReady()
    if (!this.db) throw new Error('数据库未初始化')
    this.db.run('DELETE FROM milestones WHERE id = ?', [id])
    this.save()
  }

  // ==================== 统计操作 ====================

  async getStatistics(range: { start_date: string; end_date: string }): Promise<any> {
    await this.ensureReady()

    const taskStats = this.queryOne(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tasks,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tasks,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_tasks,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_tasks,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_tasks,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM tasks
      WHERE created_at BETWEEN ? AND ?
    `, [range.start_date, range.end_date])

    const dailyTrend = this.queryAll(`
      SELECT
        DATE(completed_at) as date,
        COUNT(*) as completed_count
      FROM tasks
      WHERE status = 'done'
        AND completed_at BETWEEN ? AND ?
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `, [range.start_date, range.end_date])

    const projectProgress = this.queryAll(`
      SELECT
        p.id,
        p.name,
        p.color,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.status = 'active'
      GROUP BY p.id
    `)

    return { taskStats, dailyTrend, projectProgress }
  }

  async getProjectStatistics(projectId: number): Promise<any> {
    await this.ensureReady()

    const taskStats = this.queryOne(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours
      FROM tasks
      WHERE project_id = ?
    `, [projectId])

    const milestones = this.queryOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM milestones
      WHERE project_id = ?
    `, [projectId])

    return { taskStats, milestones }
  }

  async exportData(format: string): Promise<string> {
    await this.ensureReady()

    const data = {
      projects: await this.getProjects(),
      tasks: await this.getTasks(),
      daily_logs: this.queryAll('SELECT * FROM daily_logs ORDER BY date DESC'),
      milestones: this.queryAll('SELECT * FROM milestones'),
      exported_at: new Date().toISOString()
    }

    return JSON.stringify(data, null, 2)
  }

  async close(): Promise<void> {
    await this.ensureReady()
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
    }
  }
}

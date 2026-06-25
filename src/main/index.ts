import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { TaskDatabase } from './database'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const db = new TaskDatabase()

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'DeskLog - 工作日志',
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 开发环境加载本地服务器，生产环境加载本地文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function createTray(window: BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.ico'))
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        window.show()
        window.focus()
      }
    },
    { type: 'separator' },
    {
      label: '快速添加任务',
      click: () => {
        window.show()
        window.webContents.send('show-quick-add')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('DeskLog - 工作日志')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    window.show()
    window.focus()
  })

  return tray
}

// 注册 IPC 处理器
function registerIpcHandlers(): void {
  // 项目相关
  ipcMain.handle('get-projects', () => db.getProjects())
  ipcMain.handle('create-project', (_, project) => db.createProject(project))
  ipcMain.handle('update-project', (_, id, project) => db.updateProject(id, project))
  ipcMain.handle('delete-project', (_, id) => db.deleteProject(id))

  // 任务相关
  ipcMain.handle('get-tasks', (_, filters) => db.getTasks(filters))
  ipcMain.handle('get-task', (_, id) => db.getTask(id))
  ipcMain.handle('create-task', (_, task) => db.createTask(task))
  ipcMain.handle('update-task', (_, id, task) => db.updateTask(id, task))
  ipcMain.handle('delete-task', (_, id) => db.deleteTask(id))
  ipcMain.handle('batch-update-tasks', (_, updates) => db.batchUpdateTasks(updates))

  // 日志相关
  ipcMain.handle('get-daily-log', (_, date) => db.getDailyLog(date))
  ipcMain.handle('save-daily-log', (_, log) => db.saveDailyLog(log))
  ipcMain.handle('get-log-dates', (_, month) => db.getLogDates(month))

  // 里程碑相关
  ipcMain.handle('get-milestones', (_, projectId) => db.getMilestones(projectId))
  ipcMain.handle('create-milestone', (_, milestone) => db.createMilestone(milestone))
  ipcMain.handle('update-milestone', (_, id, milestone) => db.updateMilestone(id, milestone))
  ipcMain.handle('delete-milestone', (_, id) => db.deleteMilestone(id))

  // 统计相关
  ipcMain.handle('get-statistics', (_, range) => db.getStatistics(range))
  ipcMain.handle('get-project-statistics', (_, projectId) => db.getProjectStatistics(projectId))
  ipcMain.handle('export-data', (_, format) => db.exportData(format))
}

// 应用生命周期
app.whenReady().then(() => {
  // 设置 app user model id for windows
  electronApp.setAppUserModelId('com.desklog.app')

  // 默认打开或关闭 DevTools by F12 in development
  // and ignore CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()
  createTray(mainWindow!)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  db.close()
})

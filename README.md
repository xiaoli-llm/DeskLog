# DeskLog - 桌面工作日志

一个简洁高效的工作任务管理与进度追踪桌面应用。

## 功能特性

### 核心功能
- 📋 **任务管理** - 创建、编辑、删除任务，支持优先级和状态管理
- 📅 **每日日志** - 记录每日工作内容，支持心情记录和工作总结
- 📊 **项目管理** - 多项目管理，项目进度追踪，里程碑管理
- 📈 **统计分析** - 可视化图表，工作趋势分析，数据导出

### 特色功能
- 🎯 任务优先级（低/中/高/紧急）
- ⏱️ 时间追踪和工时统计
- 📆 日历视图，直观查看工作安排
- 💾 本地 SQLite 数据存储，数据安全可靠
- 🎨 现代化 UI 设计，支持亮色主题

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron 28+
- **UI 组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **数据存储**: SQLite (better-sqlite3)
- **图表库**: ECharts
- **构建工具**: Vite + electron-vite

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

### 打包应用

```bash
npm run dist
```

## 项目结构

```
desk-log/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 主进程入口
│   │   ├── database.ts          # SQLite 数据库操作
│   │   └── preload.ts           # 预加载脚本
│   ├── renderer/                # React 前端
│   │   └── src/
│   │       ├── App.tsx          # 主应用组件
│   │       ├── components/      # 通用组件
│   │       ├── pages/           # 页面组件
│   │       ├── stores/          # 状态管理
│   │       └── styles/          # 样式文件
│   └── shared/                  # 共享类型定义
├── resources/                   # 应用资源
└── package.json
```

## 使用说明

### 仪表盘
- 查看今日任务概览
- 快速了解项目进度
- 快速添加任务

### 每日日志
- 选择日期查看和记录工作
- 添加、编辑、删除任务
- 记录每日工作总结和心情

### 项目管理
- 创建和管理多个项目
- 查看项目进度和统计
- 管理项目里程碑

### 统计分析
- 查看任务完成趋势
- 分析工作时间分布
- 导出统计数据

### 设置
- 个性化设置
- 数据备份与恢复
- 快捷键配置

## 快捷键

- `Ctrl+N` - 快速添加任务
- `Ctrl+L` - 跳转到今日日志
- `Ctrl+P` - 打开项目列表
- `Ctrl+S` - 保存当前编辑
- `Ctrl+E` - 导出数据

## 数据存储

应用数据存储在本地 SQLite 数据库中，位置：
- Windows: `%APPDATA%/desk-log/data/desklog.db`
- macOS: `~/Library/Application Support/desk-log/data/desklog.db`
- Linux: `~/.config/desk-log/data/desklog.db`

## 开发说明

### 添加新页面
1. 在 `src/renderer/src/pages/` 创建新页面组件
2. 在 `App.tsx` 中添加路由
3. 在菜单中添加入口

### 添加新功能
1. 在 `src/shared/types.ts` 定义类型
2. 在 `src/main/database.ts` 添加数据库操作
3. 在 `src/main/preload.ts` 暴露 API
4. 在 `src/renderer/src/stores/` 创建状态管理
5. 在页面组件中实现功能

## 许可证

MIT License

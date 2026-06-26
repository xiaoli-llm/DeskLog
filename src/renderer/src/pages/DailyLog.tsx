import React, { useEffect, useState, useMemo } from 'react'
import {
  Card,
  Calendar,
  Checkbox,
  Space,
  Button,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  Pagination,
  message,
  Typography,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Switch,
  Tag
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useDailyLogStore } from '../stores/dailyLogStore'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import { Task, MoodType } from '@shared/types'

const { TextArea } = Input
const { Text } = Typography

const DailyLog: React.FC = () => {
  const {
    currentLog,
    selectedDate,
    setSelectedDate,
    saveDailyLog,
    fetchLogDates,
    updateSummary,
    updateMood
  } = useDailyLogStore()

  const { tasks, fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTasks(), fetchProjects()])
        await fetchLogDates(dayjs().format('YYYY-MM'))
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }
    loadData()
  }, [])

  // 自动保存函数 - 从 store 直接读取最新任务列表，避免闭包陈旧数据
  const autoSave = async (summary?: string, mood?: any) => {
    try {
      // 从 store 直接读取当前最新的任务列表（而非使用闭包中的 todayTasks）
      const currentTasks = useTaskStore.getState().tasks
      const currentSelectedDate = useDailyLogStore.getState().selectedDate
      const currentLogData = useDailyLogStore.getState().currentLog
      const tasksForDate = currentTasks.filter((t) => t.due_date === currentSelectedDate)

      await saveDailyLog({
        date: currentSelectedDate,
        summary: summary !== undefined ? summary : currentLogData?.summary,
        mood: mood !== undefined ? mood : currentLogData?.mood || undefined,
        tasks: tasksForDate.map((t) => ({
          task_id: t.id,
          time_spent: 0,
          notes: ''
        }))
      })
      setAutoSaved(true)
      setTimeout(() => setAutoSaved(false), 2000)
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }

  // 监听总结变化，自动保存（防抖500ms）
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastSummaryRef = React.useRef<string | null | undefined>(null)
  const isInitialMountRef = React.useRef(true)

  useEffect(() => {
    // 跳过首次渲染（初始化加载时不触发保存）
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      lastSummaryRef.current = currentLog?.summary
      return
    }
    if (currentLog?.summary !== lastSummaryRef.current) {
      lastSummaryRef.current = currentLog?.summary
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      autoSaveTimerRef.current = setTimeout(() => {
        autoSave(currentLog?.summary, undefined)
      }, 500)
    }
  }, [currentLog?.summary])

  // 监听心情变化，立即保存
  const isInitialMoodMountRef = React.useRef(true)
  useEffect(() => {
    if (isInitialMoodMountRef.current) {
      isInitialMoodMountRef.current = false
      return
    }
    if (currentLog?.mood) {
      autoSave(undefined, currentLog.mood)
    }
  }, [currentLog?.mood])

  // 切换月份/年份时更新 logDates
  const handlePanelChange = (date: Dayjs) => {
    fetchLogDates(date.format('YYYY-MM'))
  }

  // 选择日期 (setSelectedDate 内部已调用 fetchDailyLog)
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date.format('YYYY-MM-DD'))
  }

  // 当前选中日期的任务（排除常驻任务，常驻任务在工作台展示）
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.due_date === selectedDate && !t.is_permanent),
    [tasks, selectedDate]
  )

  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')

  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // 切换日期时重置分页和搜索
  useEffect(() => {
    setCurrentPage(1)
    setSearchKeyword('')
  }, [selectedDate])

  // 自动保存状态
  const [autoSaved, setAutoSaved] = useState(false)

  // 过滤后的任务
  const filteredTasks = useMemo(() => {
    if (!searchKeyword.trim()) return todayTasks
    return todayTasks.filter((t) =>
      t.title.toLowerCase().includes(searchKeyword.toLowerCase())
    )
  }, [todayTasks, searchKeyword])

  const todoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'todo'),
    [filteredTasks]
  )
  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'in_progress'),
    [filteredTasks]
  )
  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'done'),
    [filteredTasks]
  )

  // 分页后的任务
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTasks.slice(start, start + pageSize)
  }, [filteredTasks, currentPage])

  const handleAddTask = async (values: any) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const isPermanent = values.is_permanent ? 1 : 0
      await createTask({
        ...values,
        is_permanent: isPermanent,
        // 所有任务默认状态为 in_progress（两态逻辑）
        status: 'in_progress',
        due_date: isPermanent ? undefined : selectedDate,
        estimated_hours: values.estimated_hours ? Number(values.estimated_hours) : undefined
      })
      message.success('任务创建成功')
      setShowAddModal(false)
      form.resetFields()
      // 创建任务后自动保存日志
      setTimeout(() => autoSave(), 100)
    } catch (error) {
      message.error('创建任务失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTask = async (values: any) => {
    if (!editingTask) return
    if (submitting) return
    setSubmitting(true)
    try {
      await updateTask(editingTask.id, {
        ...values,
        is_permanent: values.is_permanent ? 1 : 0,
        estimated_hours: values.estimated_hours ? Number(values.estimated_hours) : undefined
      })
      message.success('任务更新成功')
      setEditingTask(null)
      form.resetFields()
    } catch (error) {
      message.error('更新任务失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id)
      message.success('任务删除成功')
      // 删除任务后自动保存日志
      setTimeout(() => autoSave(), 100)
    } catch (error) {
      message.error('删除任务失败')
    }
  }

  const handleToggleStatus = async (task: Task) => {
    try {
      await toggleTaskStatus(task.id)
      // 切换状态后自动保存日志
      setTimeout(() => autoSave(), 100)
    } catch (error) {
      console.error('切换任务状态失败:', error)
      message.error('操作失败')
    }
  }

  const handleSaveLog = async () => {
    try {
      // 从 store 直接读取最新数据
      const currentTasks = useTaskStore.getState().tasks
      const currentSelectedDate = useDailyLogStore.getState().selectedDate
      const currentLogData = useDailyLogStore.getState().currentLog
      const tasksForDate = currentTasks.filter((t) => t.due_date === currentSelectedDate)

      await saveDailyLog({
        date: currentSelectedDate,
        summary: currentLogData?.summary,
        mood: currentLogData?.mood || undefined,
        tasks: tasksForDate.map((t) => ({
          task_id: t.id,
          time_spent: 0,
          notes: ''
        }))
      })
      message.success('日志保存成功')
    } catch (error) {
      message.error('保存日志失败')
    }
  }

  const priorityColors: Record<string, string> = {
    low: 'var(--claude-text-tertiary)',
    medium: 'var(--claude-info)',
    high: 'var(--claude-warning)',
    urgent: 'var(--claude-error)'
  }

  const moodIcons: Record<string, React.ReactNode> = {
    good: <SmileOutlined />,
    normal: <MehOutlined />,
    bad: <FrownOutlined />
  }

  // 任务预览弹窗状态
  const [previewTask, setPreviewTask] = useState<Task | null>(null)

  // 任务列表组件
  const TaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
    <div>
      {tasks.map((task) => (
        <div key={task.id} className={`task-item ${task.status === 'done' ? 'completed' : ''}`} style={{ cursor: 'pointer' }}
          onClick={() => setPreviewTask(task)}
        >
          <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(task) }}>
            <Checkbox checked={task.status === 'done'} style={{ pointerEvents: 'none' }} />
          </div>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0 }} />
          <span className="task-title">{task.title}</span>
          <Space size="small" className="table-row-actions" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text" size="small"
              style={{ color: '#b37feb' }}
              icon={<EditOutlined style={{ color: '#b37feb' }} />}
              onClick={() => {
                setEditingTask(task)
                form.setFieldsValue({ ...task, is_permanent: !!task.is_permanent })
              }}
            />
            <Popconfirm title="确定删除此任务？" onConfirm={() => handleDeleteTask(task.id)}>
              <Button type="text" size="small" style={{ color: '#b37feb' }} icon={<DeleteOutlined style={{ color: '#b37feb' }} />} />
            </Popconfirm>
          </Space>
        </div>
      ))}
    </div>
  )

  const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  const statusLabelsMap: Record<string, string> = { todo: '进行中', in_progress: '进行中', done: '已完成', cancelled: '已取消' }

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div className="page-title">
        <CalendarOutlined className="page-title-icon" />
        <span>每日日志</span>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧日历和心情 */}
        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 16, padding: 0 }}>
            <Calendar
              fullscreen={false}
              onSelect={handleDateSelect}
              onPanelChange={handlePanelChange}
            />
          </Card>

          {/* 心情选择 */}
          <Card
            title={
              <Space>
                <SmileOutlined style={{ color: 'var(--claude-primary)' }} />
                <Text strong>今日心情</Text>
              </Space>
            }
          >
            <div className="mood-selector">
              {(['good', 'normal', 'bad'] as MoodType[]).map((mood) => (
                <Tooltip
                  key={mood}
                  title={mood === 'good' ? '开心' : mood === 'normal' ? '一般' : '不好'}
                >
                  <div
                    className={`mood-btn ${currentLog?.mood === mood ? 'active' : ''}`}
                    onClick={() => updateMood(mood)}
                  >
                    <span className={`mood-${mood}`}>
                      {moodIcons[mood]}
                    </span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧任务列表 */}
        <Col xs={24} lg={16}>
          {/* 操作栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <Space>
              <ClockCircleOutlined style={{ color: 'var(--claude-primary)', fontSize: 16 }} />
              <Text strong style={{ fontSize: 16 }}>{dayjs(selectedDate).format('YYYY年MM月DD日')} 任务</Text>
            </Space>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
              <Input
                placeholder="搜索任务..."
                prefix={<SearchOutlined style={{ color: 'var(--claude-text-tertiary)' }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
                style={{ width: 180 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddModal(true)}
                style={{ background: '#b37feb', borderColor: '#b37feb' }}
              >
                添加任务
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveLog}
                style={{ color: '#b37feb', borderColor: '#b37feb' }}
              >
                保存日志
              </Button>
              {autoSaved && (
                <span style={{ color: 'var(--claude-success)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  ✓ 已自动保存
                </span>
              )}
            </div>
          </div>

          <Card>
            {searchKeyword && (
              <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--claude-bg-secondary)', borderRadius: 'var(--claude-radius)', fontSize: 13, color: 'var(--claude-text-secondary)' }}>
                找到 {filteredTasks.length} 个匹配任务
              </div>
            )}

            {/* 任务统计 */}
            {todayTasks.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 16, fontSize: 13 }}>
                <span style={{ color: 'var(--claude-text-secondary)' }}>
                  总计 <strong style={{ color: 'var(--claude-text-primary)' }}>{todayTasks.length}</strong> 个任务
                </span>
                <span style={{ color: 'var(--claude-text-secondary)' }}>
                  完成 <strong style={{ color: 'var(--claude-success)' }}>{doneTasks.length}</strong> 个
                </span>
                <span style={{ color: 'var(--claude-text-secondary)' }}>
                  进行中 <strong style={{ color: 'var(--claude-info)' }}>{todayTasks.length - doneTasks.length}</strong> 个
                </span>
              </div>
            )}

            {filteredTasks.length > 0 ? (
              <TaskList tasks={paginatedTasks} />
            ) : todayTasks.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--claude-text-tertiary)' }}>
                没有匹配的任务
              </div>
            ) : (
              <div className="empty-state">
                <ClockCircleOutlined className="empty-state-icon" />
                <div className="empty-state-text">暂无任务</div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddModal(true)}
                  style={{ background: '#b37feb', borderColor: '#b37feb' }}
                >
                  添加第一个任务
                </Button>
              </div>
            )}

            {filteredTasks.length > pageSize && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredTasks.length}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  showQuickJumper
                />
              </div>
            )}
          </Card>

          {/* 每日总结 */}
          <Card
            title={
              <Space>
                <EditOutlined style={{ color: 'var(--claude-primary)' }} />
                <Text strong>每日总结</Text>
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <TextArea
              rows={4}
              placeholder="记录今天的工作总结、感想、收获..."
              value={currentLog?.summary || ''}
              onChange={(e) => updateSummary(e.target.value)}
              style={{
                borderRadius: 'var(--claude-radius)',
                border: '1px solid var(--claude-border)',
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 添加/编辑任务弹窗 */}
      <Modal
        title={editingTask ? '编辑任务' : '添加任务'}
        open={showAddModal || !!editingTask}
        onCancel={() => {
          setShowAddModal(false)
          setEditingTask(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingTask ? handleEditTask : handleAddTask}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述（可选）" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="medium">
                <Select>
                  <Select.Option value="low">
                    <Space>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--claude-text-tertiary)' }} />
                      低
                    </Space>
                  </Select.Option>
                  <Select.Option value="medium">
                    <Space>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--claude-info)' }} />
                      中
                    </Space>
                  </Select.Option>
                  <Select.Option value="high">
                    <Space>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--claude-warning)' }} />
                      高
                    </Space>
                  </Select.Option>
                  <Select.Option value="urgent">
                    <Space>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--claude-error)' }} />
                      紧急
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="project_id" label="所属项目">
                <Select placeholder="选择项目" allowClear>
                  {projects.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      <Space>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                        {p.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimated_hours" label="预计工时（小时）">
                <InputNumber
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="is_permanent"
            label="常驻任务"
            valuePropName="checked"
            extra="常驻任务会显示在工作台，方便快速切换完成状态"
          >
            <Switch
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务预览弹窗 */}
      <Modal
        title="任务详情"
        open={!!previewTask}
        onCancel={() => setPreviewTask(null)}
        footer={<Button onClick={() => setPreviewTask(null)}>关闭</Button>}
        width={500}
      >
        {previewTask && (
          <div>
            <div style={{ marginBottom: 12 }}><Text type="secondary">标题</Text><br /><Text strong>{previewTask.title}</Text></div>
            {previewTask.description && <div style={{ marginBottom: 12 }}><Text type="secondary">描述</Text><br /><Text>{previewTask.description}</Text></div>}
            <Row gutter={16}>
              <Col span={8}><Text type="secondary">优先级</Text><br /><Tag color={previewTask.priority === 'urgent' ? 'red' : previewTask.priority === 'high' ? 'orange' : previewTask.priority === 'medium' ? 'blue' : 'default'}>{priorityLabels[previewTask.priority]}</Tag></Col>
              <Col span={8}><Text type="secondary">状态</Text><br /><Tag color={previewTask.status === 'done' ? 'success' : 'processing'}>{statusLabelsMap[previewTask.status]}</Tag></Col>
              <Col span={8}><Text type="secondary">类型</Text><br /><Tag color={previewTask.is_permanent ? 'purple' : 'default'}>{previewTask.is_permanent ? '常驻任务' : '今日任务'}</Tag></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Text type="secondary">截止日期</Text><br /><Text>{previewTask.due_date ? dayjs(previewTask.due_date).format('YYYY-MM-DD') : '无'}</Text></Col>
              <Col span={12}><Text type="secondary">所属项目</Text><br /><Text>{previewTask.project_id ? (projects.find(p => p.id === previewTask.project_id)?.name || '未知') : '无'}</Text></Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><Text type="secondary">创建时间</Text><br /><Text style={{ fontSize: 13 }}>{previewTask.created_at ? dayjs(previewTask.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Text></Col>
              {previewTask.estimated_hours ? <Col span={12}><Text type="secondary">预计工时</Text><br /><Text>{previewTask.estimated_hours}小时</Text></Col> : null}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DailyLog

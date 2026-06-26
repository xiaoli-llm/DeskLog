import React, { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Typography, Space, Button, Empty, Progress, Pagination, Tag, Checkbox, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ProjectOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  FileTextOutlined,
  BarChartOutlined,
  RocketOutlined,
  UnorderedListOutlined,
  PushpinOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

const priorityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
const priorityColors: Record<string, string> = {
  low: 'var(--claude-text-tertiary)',
  medium: 'var(--claude-info)',
  high: 'var(--claude-warning)',
  urgent: 'var(--claude-error)'
}
const statusLabels: Record<string, string> = {
  todo: '进行中', in_progress: '进行中', done: '已完成', cancelled: '已取消'
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, fetchTasks, toggleTaskStatus, updateTask, deleteTask } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [allTasksPage, setAllTasksPage] = useState(1)
  const [permPage, setPermPage] = useState(1)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [editForm] = Form.useForm()
  const [previewTask, setPreviewTask] = useState<any>(null)
  const [previewProject, setPreviewProject] = useState<any>(null)
  const pageSize = 8
  const permPageSize = 5

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTasks(), fetchProjects()])
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const filtered = tasks.filter((t) => t.due_date === today && !t.is_permanent)
    setTodayTasks(filtered.slice(0, 5))
  }, [tasks])

  const paginatedAllTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    const start = (allTasksPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [tasks, allTasksPage])

  const permanentTasks = useMemo(() => tasks.filter((t) => t.is_permanent), [tasks])
  const paginatedPermTasks = useMemo(() => {
    const start = (permPage - 1) * permPageSize
    return permanentTasks.slice(start, start + permPageSize)
  }, [permanentTasks, permPage])

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status !== 'done').length
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length
  const activeProjects = projects.filter((p) => p.status === 'active')

  const getProjectProgress = (projectId: number) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId)
    if (projectTasks.length === 0) return 0
    const completed = projectTasks.filter((t) => t.status === 'done').length
    return Math.round((completed / projectTasks.length) * 100)
  }

  const handleEditPermanent = async (values: any) => {
    if (!editingTask) return
    try {
      await updateTask(editingTask.id, { title: values.title, description: values.description, priority: values.priority })
      message.success('任务更新成功')
      setEditingTask(null)
      editForm.resetFields()
    } catch (error) { message.error('更新失败') }
  }

  const handleDeletePermanent = async (id: number) => {
    try {
      await deleteTask(id)
      message.success('任务删除成功')
    } catch (error) { message.error('删除失败') }
  }

  // 任务预览弹窗内容
  const TaskPreviewContent = ({ task }: { task: any }) => (
    <div>
      <div style={{ marginBottom: 12 }}><Text type="secondary">标题</Text><br /><Text strong>{task.title}</Text></div>
      {task.description && <div style={{ marginBottom: 12 }}><Text type="secondary">描述</Text><br /><Text>{task.description}</Text></div>}
      <Row gutter={16}>
        <Col span={8}><Text type="secondary">优先级</Text><br /><Tag color={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : task.priority === 'medium' ? 'blue' : 'default'}>{priorityLabels[task.priority]}</Tag></Col>
        <Col span={8}><Text type="secondary">状态</Text><br /><Tag color={task.status === 'done' ? 'success' : 'processing'}>{statusLabels[task.status]}</Tag></Col>
        <Col span={8}><Text type="secondary">类型</Text><br /><Tag color={task.is_permanent ? 'purple' : 'default'}>{task.is_permanent ? '常驻任务' : '今日任务'}</Tag></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}><Text type="secondary">截止日期</Text><br /><Text>{task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : '无'}</Text></Col>
        <Col span={12}><Text type="secondary">所属项目</Text><br /><Text>{task.project_id ? (projects.find(p => p.id === task.project_id)?.name || '未知') : '无'}</Text></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}><Text type="secondary">创建时间</Text><br /><Text style={{ fontSize: 13 }}>{task.created_at ? dayjs(task.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Text></Col>
        {task.estimated_hours ? <Col span={12}><Text type="secondary">预计工时</Text><br /><Text>{task.estimated_hours}小时</Text></Col> : null}
      </Row>
    </div>
  )

  // 项目预览弹窗内容
  const ProjectPreviewContent = ({ project }: { project: any }) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id)
    const completed = projectTasks.filter((t) => t.status === 'done').length
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
          <Text strong style={{ fontSize: 16 }}>{project.name}</Text>
        </div>
        {project.description && <div style={{ marginBottom: 12 }}><Text type="secondary">{project.description}</Text></div>}
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={8}><Text type="secondary">状态</Text><br /><Tag color="blue">{project.status === 'active' ? '进行中' : project.status === 'completed' ? '已完成' : '已归档'}</Tag></Col>
          <Col span={8}><Text type="secondary">总任务</Text><br /><Text strong>{projectTasks.length}</Text></Col>
          <Col span={8}><Text type="secondary">已完成</Text><br /><Text strong style={{ color: 'var(--claude-success)' }}>{completed}</Text></Col>
        </Row>
        <Progress percent={getProjectProgress(project.id)} strokeColor={project.color} style={{ marginBottom: 12 }} />
        {projectTasks.length > 0 && (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>项目任务</Text>
            {projectTasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--claude-border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'done' ? 'var(--claude-success)' : 'var(--claude-info)' }} />
                <Text style={{ flex: 1, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--claude-text-tertiary)' : 'var(--claude-text-primary)' }}>{t.title}</Text>
                <Tag color={t.status === 'done' ? 'success' : 'processing'} style={{ fontSize: 11 }}>{statusLabels[t.status]}</Tag>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div className="page-title">
        <CalendarOutlined className="page-title-icon" />
        <span>工作台</span>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <ProjectOutlined />
            </div>
            <div className="stat-card-value">{tasks.length}</div>
            <div className="stat-card-label">总任务数</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-card-icon success">
              <CheckCircleOutlined />
            </div>
            <div className="stat-card-value">{completedTasks}</div>
            <div className="stat-card-label">已完成</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <ClockCircleOutlined />
            </div>
            <div className="stat-card-value">{inProgressTasks}</div>
            <div className="stat-card-label">进行中</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-card-icon error">
              <ExclamationCircleOutlined />
            </div>
            <div className="stat-card-value">{urgentTasks}</div>
            <div className="stat-card-label">紧急待办</div>
          </div>
        </Col>
      </Row>

      {/* 常驻任务 - 始终显示 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <PushpinOutlined style={{ color: '#b37feb' }} />
                <Text strong>常驻任务</Text>
                <Tag color="purple">{permanentTasks.length}</Tag>
              </Space>
            }
            style={{ borderColor: '#d3adf7' }}
          >
            {permanentTasks.length > 0 ? (
              <>
                {paginatedPermTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item"
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--claude-border)',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleTaskStatus(task.id)}
                  >
                    <Checkbox
                      checked={task.status === 'done'}
                      style={{ pointerEvents: 'none' }}
                    />
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: task.status === 'done' ? 'var(--claude-success)' : '#b37feb',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        className="task-title"
                        style={{
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? 'var(--claude-text-tertiary)' : 'var(--claude-text-primary)',
                        }}
                      >
                        {task.title}
                      </span>
                    </div>
                    <Tag
                      color={task.status === 'done' ? 'success' : 'purple'}
                      style={{ fontSize: 12, marginRight: 8 }}
                    >
                      {task.status === 'done' ? '已完成' : '进行中'}
                    </Tag>
                    <Space size="small" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="text"
                        size="small"
                        style={{ color: '#b37feb' }}
                        icon={<EditOutlined style={{ color: '#b37feb' }} />}
                        onClick={() => {
                          setEditingTask(task)
                          editForm.setFieldsValue({
                            title: task.title,
                            description: task.description,
                            priority: task.priority
                          })
                        }}
                      />
                      <Popconfirm
                        title="确定删除此常驻任务？"
                        onConfirm={() => handleDeletePermanent(task.id)}
                      >
                        <Button
                          type="text"
                          size="small"
                          style={{ color: '#b37feb' }}
                          icon={<DeleteOutlined style={{ color: '#b37feb' }} />}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
                {permanentTasks.length > permPageSize && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Pagination
                      current={permPage}
                      pageSize={permPageSize}
                      total={permanentTasks.length}
                      onChange={(page) => setPermPage(page)}
                      showSizeChanger={false}
                      size="small"
                    />
                  </div>
                )}
              </>
            ) : (
              <Empty
                description="暂无常驻任务"
                style={{ padding: '24px 0' }}
              >
                <Text type="secondary">在每日日志中添加任务时勾选"常驻任务"即可创建</Text>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* 常驻任务编辑弹窗 */}
      <Modal
        title="编辑常驻任务"
        open={!!editingTask}
        onCancel={() => { setEditingTask(null); editForm.resetFields() }}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditPermanent}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="任务描述（可选）" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        {/* 今日任务 */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: 'var(--claude-primary)' }} />
                <Text strong>今日任务</Text>
                <Tag color="orange">{tasks.filter(t => t.due_date === dayjs().format('YYYY-MM-DD')).length}</Tag>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/daily')}
                style={{ color: 'var(--claude-primary)' }}
              >
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            {todayTasks.length > 0 ? (
              <div>
                {todayTasks.map((task) => (
                  <div key={task.id} className="task-item" style={{ cursor: 'pointer' }} onClick={() => setPreviewTask(task)}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0 }} />
                    <span className="task-title">{task.title}</span>
                    <span className={`status-${task.status}`} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 'var(--claude-radius-sm)' }}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无今日任务"
                style={{ padding: '40px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/daily')}
                >
                  添加任务
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        {/* 项目进度 */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <ProjectOutlined style={{ color: 'var(--claude-primary)' }} />
                <Text strong>项目进度</Text>
                <Tag color="green">{activeProjects.length}</Tag>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/projects')}
                style={{ color: 'var(--claude-primary)' }}
              >
                管理项目 <ArrowRightOutlined />
              </Button>
            }
          >
            {activeProjects.length > 0 ? (
              <div>
                {activeProjects.slice(0, 4).map((project) => (
                  <div key={project.id} style={{ marginBottom: 16, cursor: 'pointer', padding: '8px', borderRadius: 'var(--claude-radius)', transition: 'background 0.2s' }} onClick={() => setPreviewProject(project)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }} />
                      <Text strong style={{ fontSize: 14 }}>{project.name}</Text>
                      <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 13 }}>{getProjectProgress(project.id)}%</Text>
                    </div>
                    <Progress percent={getProjectProgress(project.id)} showInfo={false} strokeColor={project.color} trailColor="var(--claude-bg-secondary)" size="small" />
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无活跃项目"
                style={{ padding: '40px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/projects')}
                >
                  创建项目
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* 全部任务 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <UnorderedListOutlined style={{ color: 'var(--claude-primary)' }} />
                <Text strong>全部任务</Text>
                <Tag color="blue">{tasks.length}</Tag>
              </Space>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate('/daily')}
                style={{ color: 'var(--claude-primary)' }}
              >
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            {tasks.length > 0 ? (
              <div>
                {paginatedAllTasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item"
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--claude-border)', cursor: 'pointer' }}
                    onClick={() => setPreviewTask(task)}
                  >
                    <Checkbox checked={task.status === 'done'} disabled />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[task.priority], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span className="task-title" style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--claude-text-tertiary)' : 'var(--claude-text-primary)' }}>
                        {task.title}
                        {task.is_permanent ? <Tag color="purple" style={{ fontSize: 11, marginLeft: 6 }}>常驻</Tag> : null}
                      </span>
                      <div style={{ fontSize: 12, color: 'var(--claude-text-tertiary)', marginTop: 2 }}>
                        {task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : '无截止日期'}
                        {task.project_id && <span style={{ marginLeft: 8 }}>{projects.find(p => p.id === task.project_id)?.name || '未知项目'}</span>}
                      </div>
                    </div>
                    <Tag color={task.status === 'done' ? 'success' : 'processing'} style={{ fontSize: 12 }}>{statusLabels[task.status]}</Tag>
                  </div>
                ))}
                {tasks.length > pageSize && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Pagination
                      current={allTasksPage}
                      pageSize={pageSize}
                      total={tasks.length}
                      onChange={(page) => setAllTasksPage(page)}
                      showSizeChanger={false}
                      showQuickJumper
                    />
                  </div>
                )}
              </div>
            ) : (
              <Empty
                description="暂无任务"
                style={{ padding: '40px 0' }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/daily')}
                >
                  创建任务
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <div style={{ marginTop: 24 }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          快速操作
        </Text>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div
              className="quick-action-btn"
              onClick={() => navigate('/daily')}
            >
              <div className="quick-action-btn-icon">
                <FileTextOutlined />
              </div>
              <div className="quick-action-btn-content">
                <div className="quick-action-btn-title">记录今日日志</div>
                <div className="quick-action-btn-desc">记录今天的工作内容</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              className="quick-action-btn"
              onClick={() => navigate('/projects')}
            >
              <div className="quick-action-btn-icon">
                <RocketOutlined />
              </div>
              <div className="quick-action-btn-content">
                <div className="quick-action-btn-title">查看项目</div>
                <div className="quick-action-btn-desc">管理你的项目进度</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              className="quick-action-btn"
              onClick={() => navigate('/statistics')}
            >
              <div className="quick-action-btn-icon">
                <BarChartOutlined />
              </div>
              <div className="quick-action-btn-content">
                <div className="quick-action-btn-title">数据洞察</div>
                <div className="quick-action-btn-desc">查看工作统计分析</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
      {/* 任务预览弹窗 */}
      <Modal
        title="任务详情"
        open={!!previewTask}
        onCancel={() => setPreviewTask(null)}
        footer={<Button onClick={() => setPreviewTask(null)}>关闭</Button>}
        width={500}
      >
        {previewTask && <TaskPreviewContent task={previewTask} />}
      </Modal>

      {/* 项目预览弹窗 */}
      <Modal
        title="项目详情"
        open={!!previewProject}
        onCancel={() => setPreviewProject(null)}
        footer={<Button onClick={() => setPreviewProject(null)}>关闭</Button>}
        width={560}
      >
        {previewProject && <ProjectPreviewContent project={previewProject} />}
      </Modal>
    </div>
  )
}

export default Dashboard

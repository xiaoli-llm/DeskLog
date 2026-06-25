import React, { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Typography, Space, Button, Empty, Progress, Pagination, Tag, Checkbox } from 'antd'
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
  UnorderedListOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'
import dayjs from 'dayjs'

const { Text } = Typography

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, fetchTasks } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [allTasksPage, setAllTasksPage] = useState(1)
  const pageSize = 8

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
    const filtered = tasks.filter((t) => t.due_date === today || t.status === 'in_progress')
    setTodayTasks(filtered.slice(0, 5))
  }, [tasks])

  // 分页后的全部任务
  const paginatedAllTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      // 未完成的在前，已完成的在后
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      // 按截止日期排序
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    const start = (allTasksPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [tasks, allTasksPage])

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const todoTasks = tasks.filter((t) => t.status === 'todo').length
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length

  const activeProjects = projects.filter((p) => p.status === 'active')

  const getProjectProgress = (projectId: number) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId)
    if (projectTasks.length === 0) return 0
    const completed = projectTasks.filter((t) => t.status === 'done').length
    return Math.round((completed / projectTasks.length) * 100)
  }

  const priorityColors: Record<string, string> = {
    low: 'var(--claude-text-tertiary)',
    medium: 'var(--claude-info)',
    high: 'var(--claude-warning)',
    urgent: 'var(--claude-error)'
  }

  const statusLabels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
    cancelled: '已取消'
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
                  <div key={task.id} className="task-item">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: priorityColors[task.priority],
                        flexShrink: 0,
                      }}
                    />
                    <span className="task-title">{task.title}</span>
                    <span
                      className={`status-${task.status}`}
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 'var(--claude-radius-sm)',
                      }}
                    >
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
                  <div key={project.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: project.color,
                        }}
                      />
                      <Text strong style={{ fontSize: 14 }}>{project.name}</Text>
                      <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 13 }}>
                        {getProjectProgress(project.id)}%
                      </Text>
                    </div>
                    <Progress
                      percent={getProjectProgress(project.id)}
                      showInfo={false}
                      strokeColor={project.color}
                      trailColor="var(--claude-bg-secondary)"
                      size="small"
                    />
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
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--claude-border)',
                    }}
                  >
                    <Checkbox checked={task.status === 'done'} disabled />
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: priorityColors[task.priority],
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
                      <div style={{ fontSize: 12, color: 'var(--claude-text-tertiary)', marginTop: 2 }}>
                        {task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : '无截止日期'}
                        {task.project_id && (
                          <span style={{ marginLeft: 8 }}>
                            {projects.find(p => p.id === task.project_id)?.name || '未知项目'}
                          </span>
                        )}
                      </div>
                    </div>
                    <Tag
                      color={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'processing' : 'default'}
                      style={{ fontSize: 12 }}
                    >
                      {statusLabels[task.status]}
                    </Tag>
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
    </div>
  )
}

export default Dashboard

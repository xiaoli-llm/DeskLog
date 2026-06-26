import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  ColorPicker,
  Select,
  Tag,
  Space,
  Typography,
  Progress,
  Dropdown,
  message,
  Popconfirm,
  Empty,
  List,
  Badge,
  Divider,
  Pagination
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { useProjectStore } from '../stores/projectStore'
import { useTaskStore } from '../stores/taskStore'
import { Project, Task } from '@shared/types'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

const Projects: React.FC = () => {
  const { projects, fetchProjects, createProject, updateProject, deleteProject } = useProjectStore()
  const { tasks, fetchTasks } = useTaskStore()

  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const [projectTasksPage, setProjectTasksPage] = useState(1)
  const taskPageSize = 5

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProjects()
        await fetchTasks()
      } catch (error) {
        console.error('加载数据失败:', error)
      }
    }
    loadData()
  }, [])

  // 切换编辑项目时重置任务分页
  useEffect(() => {
    setProjectTasksPage(1)
  }, [editingProject?.id])

  // 获取项目相关任务
  const getProjectTasks = (projectId: number): Task[] => {
    return tasks.filter((t) => t.project_id === projectId)
  }

  // 分页后的项目任务
  const getPaginatedProjectTasks = (projectId: number): Task[] => {
    const allTasks = getProjectTasks(projectId)
    const start = (projectTasksPage - 1) * taskPageSize
    return allTasks.slice(start, start + taskPageSize)
  }

  // 任务状态标签
  const taskStatusConfig: Record<string, { color: string; label: string }> = {
    todo: { color: 'default', label: '待办' },
    in_progress: { color: 'processing', label: '进行中' },
    done: { color: 'success', label: '已完成' },
    cancelled: { color: 'error', label: '已取消' }
  }

  const handleCreateProject = async (values: any) => {
    try {
      // 安全获取颜色值
      let color = '#D97706'
      if (values.color) {
        if (typeof values.color === 'string') {
          color = values.color
        } else if (typeof values.color.toHexString === 'function') {
          color = values.color.toHexString()
        }
      }
      await createProject({
        ...values,
        color
      })
      message.success('项目创建成功')
      setShowModal(false)
      form.resetFields()
    } catch (error) {
      console.error('创建项目失败:', error)
      message.error('创建项目失败')
    }
  }

  const handleEditProject = async (values: any) => {
    if (!editingProject) return
    try {
      let color = editingProject.color
      if (values.color) {
        if (typeof values.color === 'string') {
          color = values.color
        } else if (typeof values.color.toHexString === 'function') {
          color = values.color.toHexString()
        }
      }
      await updateProject(editingProject.id, {
        ...values,
        color
      })
      message.success('项目更新成功')
      setEditingProject(null)
      form.resetFields()
    } catch (error) {
      console.error('更新项目失败:', error)
      message.error('更新项目失败')
    }
  }

  const handleDeleteProject = async (id: number) => {
    try {
      await deleteProject(id)
      message.success('项目删除成功')
    } catch (error) {
      message.error('删除项目失败')
    }
  }

  const getProjectStats = (projectId: number) => {
    const projectTasks = tasks.filter((t) => t.project_id === projectId)
    const total = projectTasks.length
    const completed = projectTasks.filter((t) => t.status === 'done').length
    // 进行中 = in_progress + todo（两态逻辑，确保 completed + inProgress = total）
    const inProgress = projectTasks.filter((t) => t.status !== 'done').length

    return { total, completed, inProgress, progress: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const statusColors: Record<string, string> = {
    active: 'var(--claude-success)',
    archived: 'var(--claude-text-tertiary)',
    completed: 'var(--claude-info)'
  }

  const statusLabels: Record<string, string> = {
    active: '进行中',
    archived: '已归档',
    completed: '已完成'
  }

  const activeProjects = projects.filter((p) => p.status === 'active')
  const archivedProjects = projects.filter((p) => p.status !== 'active')

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <ProjectOutlined className="page-title-icon" />
          <span>项目管理</span>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowModal(true)}
        >
          新建项目
        </Button>
      </div>

      {/* 活跃项目 */}
      {activeProjects.length > 0 ? (
        <Row gutter={[16, 16]}>
          {activeProjects.map((project) => {
            const stats = getProjectStats(project.id)
            return (
              <Col xs={24} sm={12} lg={8} key={project.id}>
                <div className="project-card">
                  <div className="project-card-header">
                    <div
                      className="project-card-dot"
                      style={{ background: project.color }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="project-card-name">{project.name}</div>
                      <Tag
                        style={{
                          background: `${project.color}15`,
                          color: project.color,
                          border: 'none',
                          marginTop: 4,
                        }}
                      >
                        {statusLabels[project.status]}
                      </Tag>
                    </div>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: '编辑',
                            icon: <EditOutlined />,
                            onClick: () => {
                              setEditingProject(project)
                              form.setFieldsValue({
                                ...project,
                                color: project.color
                              })
                            }
                          },
                          {
                            key: 'archive',
                            label: '归档',
                            icon: <FolderOutlined />,
                            onClick: () => updateProject(project.id, { status: 'archived' })
                          },
                          { type: 'divider' },
                          {
                            key: 'delete',
                            label: '删除',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => handleDeleteProject(project.id)
                          }
                        ]
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        style={{ color: 'var(--claude-text-tertiary)' }}
                      />
                    </Dropdown>
                  </div>

                  {project.description && (
                    <div className="project-card-desc">
                      {project.description}
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 13, color: 'var(--claude-text-secondary)' }}>
                        项目进度
                      </Text>
                      <Text strong style={{ fontSize: 13, color: project.color }}>
                        {stats.progress}%
                      </Text>
                    </div>
                    <Progress
                      percent={stats.progress}
                      showInfo={false}
                      strokeColor={project.color}
                      trailColor="var(--claude-bg-secondary)"
                      size="small"
                    />
                  </div>

                  <div className="project-card-stats">
                    <div className="project-card-stat">
                      <span className="project-card-stat-value">{stats.total}</span>
                      <span>总任务</span>
                    </div>
                    <div className="project-card-stat">
                      <CheckCircleOutlined style={{ color: 'var(--claude-success)', fontSize: 12 }} />
                      <span className="project-card-stat-value">{stats.completed}</span>
                      <span>已完成</span>
                    </div>
                    <div className="project-card-stat">
                      <ClockCircleOutlined style={{ color: 'var(--claude-info)', fontSize: 12 }} />
                      <span className="project-card-stat-value">{stats.inProgress}</span>
                      <span>进行中</span>
                    </div>
                  </div>
                </div>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Card>
          <div className="empty-state">
            <FolderOutlined className="empty-state-icon" />
            <div className="empty-state-text">暂无活跃项目</div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowModal(true)}
            >
              创建第一个项目
            </Button>
          </div>
        </Card>
      )}

      {/* 已归档项目 */}
      {archivedProjects.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <Text
            strong
            style={{
              fontSize: 16,
              display: 'block',
              marginBottom: 16,
              color: 'var(--claude-text-secondary)',
            }}
          >
            已归档项目
          </Text>
          <Row gutter={[16, 16]}>
            {archivedProjects.map((project) => (
              <Col xs={24} sm={12} lg={8} key={project.id}>
                <Card size="small" style={{ opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: project.color,
                      }}
                    />
                    <Text strong>{project.name}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {project.description || '暂无描述'}
                  </Text>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      onClick={() => updateProject(project.id, { status: 'active' })}
                    >
                      恢复
                    </Button>
                    <Popconfirm
                      title="确定删除此项目？"
                      onConfirm={() => handleDeleteProject(project.id)}
                    >
                      <Button size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* 新建/编辑项目弹窗 */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={showModal || !!editingProject}
        onCancel={() => {
          setShowModal(false)
          setEditingProject(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
        width={editingProject ? 700 : 520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingProject ? handleEditProject : handleCreateProject}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={3} placeholder="请输入项目描述（可选）" />
          </Form.Item>
          <Form.Item name="color" label="项目颜色" initialValue="#D97706">
            <ColorPicker />
          </Form.Item>
          {editingProject && (
            <Form.Item name="status" label="状态">
              <Select>
                <Select.Option value="active">进行中</Select.Option>
                <Select.Option value="archived">归档</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>

        {/* 项目任务列表 */}
        {editingProject && (
          <div style={{ marginTop: 24 }}>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <UnorderedListOutlined style={{ color: 'var(--claude-primary)' }} />
              <Text strong style={{ fontSize: 16 }}>项目任务</Text>
              <Tag color="blue">{getProjectTasks(editingProject.id).length} 个任务</Tag>
            </div>

            {getProjectTasks(editingProject.id).length > 0 ? (
              <>
                <List
                  size="small"
                  dataSource={getPaginatedProjectTasks(editingProject.id)}
                  renderItem={(task) => {
                    const statusConfig = taskStatusConfig[task.status] || taskStatusConfig.todo
                    return (
                      <List.Item
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--claude-radius)',
                          marginBottom: 8,
                          background: task.status === 'done' ? 'var(--claude-success-bg)' : 'var(--claude-bg-secondary)',
                          border: '1px solid var(--claude-border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: task.status === 'done' ? 'var(--claude-success)' :
                                         task.status === 'in_progress' ? 'var(--claude-info)' :
                                         task.status === 'cancelled' ? 'var(--claude-error)' : 'var(--claude-text-tertiary)',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <Text
                              style={{
                                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                color: task.status === 'done' ? 'var(--claude-text-tertiary)' : 'var(--claude-text-primary)'
                              }}
                            >
                              {task.title}
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {task.due_date ? dayjs(task.due_date).format('YYYY年MM月DD日') : '未设置截止日期'}
                              </Text>
                            </div>
                          </div>
                          <Badge status={statusConfig.color as any} text={statusConfig.label} />
                        </div>
                      </List.Item>
                    )
                  }}
                />
                {getProjectTasks(editingProject.id).length > taskPageSize && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Pagination
                      current={projectTasksPage}
                      pageSize={taskPageSize}
                      total={getProjectTasks(editingProject.id).length}
                      onChange={(page) => setProjectTasksPage(page)}
                      showSizeChanger={false}
                      size="small"
                    />
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--claude-text-tertiary)' }}>
                暂无任务
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Projects

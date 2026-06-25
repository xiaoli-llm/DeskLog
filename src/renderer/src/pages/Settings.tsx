import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Switch,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Modal,
  List,
  Tag
} from 'antd'
import {
  SettingOutlined,
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  BellOutlined,
  DatabaseOutlined,
  BgColorsOutlined
} from '@ant-design/icons'

const { Text } = Typography

// 设置存储键名
const SETTINGS_KEY = 'desklog-settings'

// 从localStorage加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

// 保存设置到localStorage
const saveSettings = (settings: any) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 加载已保存的设置
  useEffect(() => {
    const savedSettings = loadSettings()
    if (savedSettings) {
      form.setFieldsValue(savedSettings)
    }
  }, [form])

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      const success = saveSettings(values)
      if (success) {
        message.success('设置保存成功')
      } else {
        message.error('保存设置失败')
      }
    } catch (error) {
      message.error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const data = await window.electronAPI.exportData('json')
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `desklog-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('数据导出成功')
    } catch (error) {
      message.error('导出数据失败')
    }
  }

  const handleImportData = () => {
    Modal.confirm({
      title: '导入数据',
      content: '导入数据将覆盖现有数据，确定继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        message.info('导入功能开发中...')
      }
    })
  }

  const shortcuts = [
    { key: 'Ctrl+N', action: '快速添加任务' },
    { key: 'Ctrl+L', action: '跳转到今日日志' },
    { key: 'Ctrl+P', action: '打开项目列表' },
    { key: 'Ctrl+S', action: '保存当前编辑' },
    { key: 'Ctrl+E', action: '导出数据' }
  ]

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div className="page-title">
        <SettingOutlined className="page-title-icon" />
        <span>偏好设置</span>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          autoSave: true,
          notifications: true,
          language: 'zh-CN',
          theme: 'light',
          fontSize: 14
        }}
      >
        {/* 外观设置 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <BgColorsOutlined style={{ color: 'var(--claude-primary)' }} />
              外观设置
            </Space>
          </div>

          <Form.Item name="language" label="语言">
            <Select>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="theme" label="主题">
            <Select>
              <Select.Option value="light">
                <Space>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: '#FAF9F6', border: '1px solid #E7E5E4' }} />
                  浅色主题
                </Space>
              </Select.Option>
              <Select.Option value="dark">
                <Space>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: '#1C1917', border: '1px solid #44403C' }} />
                  深色主题
                </Space>
              </Select.Option>
              <Select.Option value="auto">跟随系统</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="fontSize" label="字体大小">
            <Select>
              <Select.Option value={12}>小 (12px)</Select.Option>
              <Select.Option value={14}>中 (14px)</Select.Option>
              <Select.Option value={16}>大 (16px)</Select.Option>
              <Select.Option value={18}>特大 (18px)</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* 通用设置 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <SettingOutlined style={{ color: 'var(--claude-primary)' }} />
              通用设置
            </Space>
          </div>

          <Form.Item name="autoSave" label="自动保存" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        {/* 通知设置 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <BellOutlined style={{ color: 'var(--claude-primary)' }} />
              通知设置
            </Space>
          </div>

          <Form.Item name="notifications" label="启用通知" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="reminderTime" label="每日提醒时间">
            <Select>
              <Select.Option value="09:00">09:00</Select.Option>
              <Select.Option value="10:00">10:00</Select.Option>
              <Select.Option value="11:00">11:00</Select.Option>
              <Select.Option value="14:00">14:00</Select.Option>
              <Select.Option value="15:00">15:00</Select.Option>
              <Select.Option value="16:00">16:00</Select.Option>
            </Select>
          </Form.Item>
        </div>

        {/* 快捷键 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <KeyOutlined style={{ color: 'var(--claude-primary)' }} />
              快捷键
            </Space>
          </div>

          <List
            dataSource={shortcuts}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Tag
                    style={{
                      background: 'var(--claude-bg-secondary)',
                      border: '1px solid var(--claude-border)',
                      borderRadius: 'var(--claude-radius-sm)',
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  >
                    {item.key}
                  </Tag>
                  <Text>{item.action}</Text>
                </Space>
              </List.Item>
            )}
          />
        </div>

        {/* 数据管理 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <DatabaseOutlined style={{ color: 'var(--claude-primary)' }} />
              数据管理
            </Space>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Text strong>导出数据</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>将所有数据导出为 JSON 文件</Text>
            </div>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportData}
            >
              导出
            </Button>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <Text strong>导入数据</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>从 JSON 文件导入数据（将覆盖现有数据）</Text>
            </div>
            <Button
              icon={<UploadOutlined />}
              onClick={handleImportData}
            >
              导入
            </Button>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>清空数据</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>删除所有数据，此操作不可恢复</Text>
            </div>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '确定清空所有数据？',
                  content: '此操作不可恢复，所有项目、任务、日志数据将被删除。',
                  okText: '确定清空',
                  okType: 'danger',
                  cancelText: '取消',
                  onOk: () => {
                    message.info('清空功能开发中...')
                  }
                })
              }}
            >
              清空
            </Button>
          </div>
        </div>

        {/* 关于 */}
        <div className="form-section">
          <div className="form-section-title">
            <Space>
              <InfoCircleOutlined style={{ color: 'var(--claude-primary)' }} />
              关于
            </Space>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--claude-radius-lg)',
              background: 'var(--claude-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
              color: 'var(--claude-primary)',
            }}>
              📝
            </div>
            <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>
              DeskLog
            </Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              版本 1.0.0
            </Text>
            <Text style={{ color: 'var(--claude-text-secondary)', maxWidth: 400, display: 'inline-block' }}>
              一个简洁高效的工作任务管理与进度追踪桌面应用。
              帮助您记录每日工作，管理项目进度，提升工作效率。
            </Text>
          </div>
        </div>

        {/* 保存按钮 */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
          >
            保存设置
          </Button>
        </div>
      </Form>
    </div>
  )
}

export default Settings

import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Space, Typography, Tooltip } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  ProjectOutlined,
  BarChartOutlined,
  SettingOutlined,
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import Dashboard from './pages/Dashboard'
import DailyLog from './pages/DailyLog'
import Projects from './pages/Projects'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'

const { Header, Sider, Content } = Layout
const { Text } = Typography

type MenuItemType = Required<MenuProps>['items'][number]

const menuItems: MenuItemType[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '工作台'
  },
  {
    key: '/daily',
    icon: <CalendarOutlined />,
    label: '每日日志'
  },
  {
    key: '/projects',
    icon: <ProjectOutlined />,
    label: '项目管理'
  },
  {
    key: '/statistics',
    icon: <BarChartOutlined />,
    label: '数据洞察'
  },
  {
    type: 'divider'
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '偏好设置'
  }
]

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key)
    }
  }

  // 根据当前页面决定右侧按钮
  const renderHeaderRight = () => {
    switch (location.pathname) {
      case '/daily':
        return (
          <Tooltip title="通知">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ color: 'var(--claude-text-secondary)' }}
            />
          </Tooltip>
        )
      case '/projects':
        return (
          <Tooltip title="通知">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ color: 'var(--claude-text-secondary)' }}
            />
          </Tooltip>
        )
      default:
        return (
          <>
            <Tooltip title="通知">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: 'var(--claude-text-secondary)' }}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/daily')}
            >
              记录日志
            </Button>
          </>
        )
    }
  }

  return (
    <Layout className="app-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        collapsedWidth={72}
        className="app-sider"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo 区域 */}
        <div className="app-logo">
          <FileTextOutlined className="app-logo-icon" />
          {!collapsed && (
            <Text className="app-logo-title">DeskLog</Text>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />

        {/* 底部用户区域 */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            padding: '12px',
            background: 'var(--claude-bg-secondary)',
            borderRadius: 'var(--claude-radius)',
          }}>
            <Text style={{ fontSize: 12, color: 'var(--claude-text-tertiary)' }}>
              数据存储在本地
            </Text>
          </div>
        )}
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 240, transition: 'all 0.2s' }}>
        <Header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: 'var(--claude-text-secondary)' }}
              />
              <Text style={{ color: 'var(--claude-text-tertiary)', fontSize: 13 }}>
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </Space>

            <Space size="middle">
              {renderHeaderRight()}
            </Space>
          </div>
        </Header>

        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily" element={<DailyLog />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App

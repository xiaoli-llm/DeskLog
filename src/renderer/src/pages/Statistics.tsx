import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, DatePicker, Space, Button } from 'antd'
import {
  BarChartOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useTaskStore } from '../stores/taskStore'
import { useProjectStore } from '../stores/projectStore'

const { Text } = Typography
const { RangePicker } = DatePicker

const Statistics: React.FC = () => {
  const { tasks, fetchTasks } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ])

  useEffect(() => {
    Promise.all([fetchTasks(), fetchProjects()])
  }, [])

  // 过滤日期范围内的任务
  const filteredTasks = tasks.filter((task) => {
    const created = dayjs(task.created_at)
    return created.isAfter(dateRange[0].startOf('day')) && created.isBefore(dateRange[1].endOf('day'))
  })

  const completedTasks = filteredTasks.filter((t) => t.status === 'done').length
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress').length
  const todoTasks = filteredTasks.filter((t) => t.status === 'todo').length
  const cancelledTasks = filteredTasks.filter((t) => t.status === 'cancelled').length

  // Claude 风格配色
  const claudeColors = {
    primary: '#D97706',
    primaryLight: '#FDE68A',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
    text: '#1C1917',
    textSecondary: '#57534E',
    border: '#E7E5E4',
    bg: '#FAF9F6',
  }

  // 任务状态分布饼图配置
  const statusPieOption = {
    title: {
      text: '任务状态分布',
      left: 'center',
      textStyle: {
        color: claudeColors.text,
        fontSize: 16,
        fontWeight: 600,
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: '#FFFFFF',
      borderColor: claudeColors.border,
      textStyle: { color: claudeColors.text }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: claudeColors.textSecondary }
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#FFFFFF',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: todoTasks, name: '待办', itemStyle: { color: '#A8A29E' } },
          { value: inProgressTasks, name: '进行中', itemStyle: { color: claudeColors.info } },
          { value: completedTasks, name: '已完成', itemStyle: { color: claudeColors.success } },
          { value: cancelledTasks, name: '已取消', itemStyle: { color: claudeColors.error } }
        ]
      }
    ]
  }

  // 优先级分布饼图配置
  const priorityData = [
    { value: filteredTasks.filter((t) => t.priority === 'urgent').length, name: '紧急', itemStyle: { color: claudeColors.error } },
    { value: filteredTasks.filter((t) => t.priority === 'high').length, name: '高', itemStyle: { color: claudeColors.warning } },
    { value: filteredTasks.filter((t) => t.priority === 'medium').length, name: '中', itemStyle: { color: claudeColors.info } },
    { value: filteredTasks.filter((t) => t.priority === 'low').length, name: '低', itemStyle: { color: '#A8A29E' } }
  ]

  const priorityPieOption = {
    title: {
      text: '任务优先级分布',
      left: 'center',
      textStyle: {
        color: claudeColors.text,
        fontSize: 16,
        fontWeight: 600,
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: '#FFFFFF',
      borderColor: claudeColors.border,
      textStyle: { color: claudeColors.text }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: claudeColors.textSecondary }
    },
    series: [
      {
        name: '优先级',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#FFFFFF',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: priorityData
      }
    ]
  }

  // 每日任务完成趋势图配置
  const getDailyTrendData = () => {
    const days: string[] = []
    const completedData: number[] = []
    const createdData: number[] = []

    let current = dateRange[0].startOf('day')
    const end = dateRange[1].endOf('day')

    while (current.isBefore(end)) {
      const dateStr = current.format('MM-DD')
      days.push(dateStr)

      const dayStart = current.startOf('day')
      const dayEnd = current.endOf('day')

      completedData.push(
        filteredTasks.filter(
          (t) => t.completed_at && dayjs(t.completed_at).isAfter(dayStart) && dayjs(t.completed_at).isBefore(dayEnd)
        ).length
      )

      createdData.push(
        filteredTasks.filter(
          (t) => dayjs(t.created_at).isAfter(dayStart) && dayjs(t.created_at).isBefore(dayEnd)
        ).length
      )

      current = current.add(1, 'day')
    }

    return { days, completedData, createdData }
  }

  const trendData = getDailyTrendData()

  const trendLineOption = {
    title: {
      text: '每日任务趋势',
      left: 'center',
      textStyle: {
        color: claudeColors.text,
        fontSize: 16,
        fontWeight: 600,
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: claudeColors.border,
      textStyle: { color: claudeColors.text }
    },
    legend: {
      data: ['新建任务', '完成任务'],
      bottom: 0,
      textStyle: { color: claudeColors.textSecondary }
    },
    xAxis: {
      type: 'category',
      data: trendData.days,
      axisLine: { lineStyle: { color: claudeColors.border } },
      axisLabel: { color: claudeColors.textSecondary }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: claudeColors.border } },
      axisLabel: { color: claudeColors.textSecondary }
    },
    series: [
      {
        name: '新建任务',
        type: 'line',
        data: trendData.createdData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: claudeColors.info },
        itemStyle: { color: claudeColors.info },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${claudeColors.info}20` },
              { offset: 1, color: `${claudeColors.info}05` }
            ]
          }
        }
      },
      {
        name: '完成任务',
        type: 'line',
        data: trendData.completedData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: claudeColors.success },
        itemStyle: { color: claudeColors.success },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${claudeColors.success}20` },
              { offset: 1, color: `${claudeColors.success}05` }
            ]
          }
        }
      }
    ]
  }

  // 项目任务分布柱状图配置
  const getProjectBarData = () => {
    const activeProjects = projects.filter((p) => p.status === 'active')
    const projectNames = activeProjects.map((p) => p.name)
    const todoData = activeProjects.map((p) => tasks.filter((t) => t.project_id === p.id && t.status === 'todo').length)
    const inProgressData = activeProjects.map((p) => tasks.filter((t) => t.project_id === p.id && t.status === 'in_progress').length)
    const doneData = activeProjects.map((p) => tasks.filter((t) => t.project_id === p.id && t.status === 'done').length)

    return { projectNames, todoData, inProgressData, doneData }
  }

  const projectBarData = getProjectBarData()

  const projectBarOption = {
    title: {
      text: '项目任务分布',
      left: 'center',
      textStyle: {
        color: claudeColors.text,
        fontSize: 16,
        fontWeight: 600,
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#FFFFFF',
      borderColor: claudeColors.border,
      textStyle: { color: claudeColors.text }
    },
    legend: {
      data: ['待办', '进行中', '已完成'],
      bottom: 0,
      textStyle: { color: claudeColors.textSecondary }
    },
    xAxis: {
      type: 'category',
      data: projectBarData.projectNames,
      axisLine: { lineStyle: { color: claudeColors.border } },
      axisLabel: { color: claudeColors.textSecondary, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: claudeColors.border } },
      axisLabel: { color: claudeColors.textSecondary }
    },
    series: [
      {
        name: '待办',
        type: 'bar',
        stack: 'total',
        data: projectBarData.todoData,
        itemStyle: { color: '#A8A29E', borderRadius: [0, 0, 0, 0] }
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        data: projectBarData.inProgressData,
        itemStyle: { color: claudeColors.info }
      },
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        data: projectBarData.doneData,
        itemStyle: { color: claudeColors.success, borderRadius: [4, 4, 0, 0] }
      }
    ]
  }

  const handleExport = () => {
    const data = {
      tasks: filteredTasks,
      projects,
      statistics: {
        total: filteredTasks.length,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        cancelled: cancelledTasks
      },
      exported_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `desklog-export-${dayjs().format('YYYY-MM-DD')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <BarChartOutlined className="page-title-icon" />
          <span>数据洞察</span>
        </div>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange([dates[0]!, dates[1]!])
              }
            }}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出数据
          </Button>
        </Space>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div className="stat-card-icon primary">
              <BarChartOutlined />
            </div>
            <div className="stat-card-value">{filteredTasks.length}</div>
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
            <div className="stat-card-icon warning">
              <ExclamationCircleOutlined />
            </div>
            <div className="stat-card-value">
              {filteredTasks.length > 0 ? Math.round((completedTasks / filteredTasks.length) * 100) : 0}%
            </div>
            <div className="stat-card-label">完成率</div>
          </div>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={statusPieOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={priorityPieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card>
            <ReactECharts option={trendLineOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card>
            <ReactECharts option={projectBarOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Statistics

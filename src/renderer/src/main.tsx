import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

// 设置 dayjs 中文
dayjs.locale('zh-cn')

// Claude 风格主题配置
const claudeTheme = {
  token: {
    // 主色调 - 温暖的琥珀色
    colorPrimary: '#D97706',
    colorPrimaryBg: '#FEF3C7',
    colorPrimaryBgHover: '#FDE68A',
    colorPrimaryBorder: '#F59E0B',
    colorPrimaryBorderHover: '#D97706',
    colorPrimaryHover: '#B45309',
    colorPrimaryActive: '#92400E',
    colorPrimaryTextHover: '#B45309',
    colorPrimaryText: '#D97706',
    colorPrimaryTextActive: '#92400E',

    // 成功色
    colorSuccess: '#16A34A',
    colorSuccessBg: '#F0FDF4',
    colorSuccessBorder: '#86EFAC',

    // 警告色
    colorWarning: '#D97706',
    colorWarningBg: '#FFFBEB',
    colorWarningBorder: '#FCD34D',

    // 错误色
    colorError: '#DC2626',
    colorErrorBg: '#FEF2F2',
    colorErrorBorder: '#FCA5A5',

    // 信息色
    colorInfo: '#2563EB',
    colorInfoBg: '#EFF6FF',
    colorInfoBorder: '#93C5FD',

    // 文字颜色
    colorText: '#1C1917',
    colorTextSecondary: '#57534E',
    colorTextTertiary: '#A8A29E',
    colorTextQuaternary: '#D6D3D1',

    // 背景色
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#FAF9F6',
    colorBgSpotlight: '#F5F3EF',
    colorBgMask: 'rgba(28, 25, 23, 0.45)',

    // 边框颜色
    colorBorder: '#E7E5E4',
    colorBorderSecondary: '#F5F3EF',

    // 分割线
    colorSplit: '#E7E5E4',

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,

    // 行高
    lineHeight: 1.6,

    // 控件高度
    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,

    // 动画
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',

    // 阴影
    boxShadow: '0 1px 3px 0 rgba(28, 25, 23, 0.1), 0 1px 2px -1px rgba(28, 25, 23, 0.1)',
    boxShadowSecondary: '0 4px 6px -1px rgba(28, 25, 23, 0.1), 0 2px 4px -2px rgba(28, 25, 23, 0.1)',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      paddingInline: 16,
      paddingBlock: 6,
    },
    Card: {
      paddingLG: 24,
      borderRadiusLG: 12,
    },
    Input: {
      paddingInline: 12,
      paddingBlock: 8,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#F5F3EF',
      headerColor: '#57534E',
      rowHoverBg: '#FFFBEB',
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
      itemHeight: 40,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Calendar: {
      borderRadiusLG: 12,
    },
    Progress: {
      defaultColor: '#D97706',
    },
    Tag: {
      borderRadiusSM: 6,
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider locale={zhCN} theme={claudeTheme}>
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

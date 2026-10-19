// app.js
const { migrateDiary } = require('./utils/diary')

// 运行时错误写入实时日志（公众平台「开发管理 → 运维中心 → 实时日志」可查）
function reportError(type, detail) {
  const message = (detail && detail.stack) || String(detail)
  const logger = typeof wx.getRealtimeLogManager === 'function' ? wx.getRealtimeLogManager() : null
  if (logger) logger.error(type, message)
  console.error(type, message)
}

// 新版本下载完成后提示重启，避免老用户长期停留在旧版本
function checkForUpdate() {
  if (typeof wx.getUpdateManager !== 'function') return
  const updateManager = wx.getUpdateManager()
  updateManager.onUpdateReady(() => {
    wx.showModal({
      title: '发现新版本',
      content: '新版本已准备好，是否重启使用？',
      confirmText: '重启',
      success: res => {
        if (res.confirm) updateManager.applyUpdate()
      }
    })
  })
}

App({
  onLaunch() {
    migrateDiary()
    checkForUpdate()
  },

  onError(error) {
    reportError('onError', error)
  },

  onUnhandledRejection(res) {
    reportError('unhandledRejection', res && res.reason)
  },

  globalData: {}
})

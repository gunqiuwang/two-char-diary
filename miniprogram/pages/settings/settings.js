// pages/settings/settings.js
Page({
  data: {
    statusBarHeight: 20,
    reminderEnabled: false,
    reminderTime: '21:00',
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false,
    bgStyles: [
      { key: 'xuan', name: '宣纸', bg: '#f5f4ed' },
      { key: 'silk', name: '绢帛', bg: '#f0e6d2' },
      { key: 'bamboo', name: '竹简', bg: '#dde6d6' },
      { key: 'dark', name: '素黑', bg: '#2a2a28' }
    ]
  },

  onLoad() {
    const sysInfo = wx.getWindowInfo()
    const settings = wx.getStorageSync('settings') || {}
    const bgStyle = settings.bgStyle || 'xuan'
    const bgMap = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      reminderEnabled: settings.reminderEnabled || false,
      reminderTime: settings.reminderTime || '21:00',
      bgStyle,
      bgClass: bgMap[bgStyle] || '',
      isDark: bgStyle === 'dark'
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onTimeChange(e) {
    this.setData({ reminderTime: e.detail.value })
    this.saveSettings()
  },

  onReminderToggle(e) {
    this.setData({ reminderEnabled: e.detail.value })
    this.saveSettings()
  },

  onBgStyleChange(e) {
    const key = e.currentTarget.dataset.key
    const bgMap = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }
    this.setData({ bgStyle: key, bgClass: bgMap[key] || '', isDark: key === 'dark' })
    this.saveSettings()
  },

  saveSettings() {
    wx.setStorageSync('settings', {
      reminderEnabled: this.data.reminderEnabled,
      reminderTime: this.data.reminderTime,
      bgStyle: this.data.bgStyle
    })
  },

  exportData() {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(diaryData)
    if (keys.length === 0) {
      wx.showToast({ title: '暂无数据', icon: 'none' })
      return
    }

    let text = '二字日记导出\n\n'
    keys.sort().reverse().forEach(date => {
      const d = diaryData[date]
      text += `${date}  ${d.words}`
      if (d.hexagramName) text += `  ${d.hexagramName}`
      text += '\n'
    })

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '将删除所有记录，此操作不可恢复',
      confirmText: '清除',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('diary_data')
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }
})

// pages/settings/settings.js
const { loadBgStyle, BG_MAP } = require('../../utils/common')

Page({
  data: {
    statusBarHeight: 20,
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
    const bg = loadBgStyle()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      ...bg
    })
  },

  goBack() {
    wx.navigateBack()
  },

  onBgStyleChange(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ bgStyle: key, bgClass: BG_MAP[key] || '', isDark: key === 'dark' })
    this.saveSettings()
  },

  saveSettings() {
    wx.setStorageSync('settings', {
      bgStyle: this.data.bgStyle
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

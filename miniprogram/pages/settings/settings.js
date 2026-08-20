// pages/settings/settings.js
const { loadBgStyle, BG_MAP, getWindowInfoSafe } = require('../../utils/common')

Page({
  data: {
    statusBarHeight: 20,
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false,
    motionMode: 'standard',
    reduceMotion: false,
    bgStyles: [
      { key: 'xuan', name: '宣纸', bg: '#f5f4ed' },
      { key: 'silk', name: '绢帛', bg: '#f0e6d2' },
      { key: 'bamboo', name: '竹简', bg: '#dde6d6' },
      { key: 'dark', name: '素黑', bg: '#2a2a28' }
    ],
    dataOverview: {
      days: 0,
      casts: 0,
      latest: '暂无记录'
    }
  },

  onLoad() {
    const sysInfo = getWindowInfoSafe()
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight || 20,
      ...loadBgStyle()
    })
    this.refreshOverview()
  },

  onShow() {
    this.setData(loadBgStyle())
    this.refreshOverview()
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onBgStyleChange(e) {
    const key = e.currentTarget.dataset.key
    if (!Object.prototype.hasOwnProperty.call(BG_MAP, key)) return
    this.setData({ bgStyle: key, bgClass: BG_MAP[key] || '', isDark: key === 'dark' })
    this.saveSettings({ bgStyle: key })
  },

  onMotionModeChange(e) {
    const motionMode = e.currentTarget.dataset.mode === 'reduced' ? 'reduced' : 'standard'
    this.setData({ motionMode, reduceMotion: motionMode === 'reduced' })
    this.saveSettings({ motionMode })
  },

  saveSettings(patch) {
    const settings = wx.getStorageSync('settings') || {}
    wx.setStorageSync('settings', { ...settings, ...patch })
  },

  refreshOverview() {
    const diaryData = wx.getStorageSync('diary_data') || {}
    const keys = Object.keys(diaryData)
      .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key) && diaryData[key] && diaryData[key].words)
      .sort()
    const casts = keys.filter(key => Array.isArray(diaryData[key].yaos) && diaryData[key].yaos.length === 6).length
    const latestKey = keys.length ? keys[keys.length - 1] : ''
    const latest = latestKey
      ? `${Number(latestKey.slice(5, 7))}月${Number(latestKey.slice(8, 10))}日`
      : '暂无记录'

    this.setData({
      dataOverview: {
        days: keys.length,
        casts,
        latest
      }
    })
  },

  clearData() {
    const days = this.data.dataOverview.days
    wx.showModal({
      title: '确认清除',
      content: days
        ? `将删除本机全部 ${days} 天记录，此操作不可恢复。`
        : '本机目前没有记录。',
      confirmText: '清除',
      confirmColor: '#e64340',
      success: res => {
        if (!res.confirm || !days) return
        wx.setStorageSync('diary_data', {})
        this.refreshOverview()
        wx.showToast({ title: '已清除', icon: 'success' })
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '二字爻记',
      content: '每天用两个字和一卦记录当天\n\n极简 · 克制 · 安静\n\n记录默认只保存在本机。清理微信缓存、删除小程序或更换设备可能导致本地记录丢失。\n\n当前版本：1.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  onShareAppMessage() {
    return {
      title: '二字爻记 - 每天用两个字记录一天',
      path: '/pages/index/index'
    }
  }
})

// pages/settings/settings.js
const { loadBgStyle, BG_MAP, getWindowInfoSafe } = require('../../utils/common')
const { loadDiary, saveDiary, getYaoCode, buildBackup, parseBackup, mergeDiary } = require('../../utils/diary')

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
    const diaryData = loadDiary()
    const keys = Object.keys(diaryData)
      .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key) && diaryData[key] && diaryData[key].words)
      .sort()
    const casts = keys.filter(key => getYaoCode(diaryData[key])).length
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
    // 只起卦未记字的日子不计入天数，但也要能清掉
    const hasData = Object.keys(loadDiary()).length > 0
    wx.showModal({
      title: '确认清除',
      content: days
        ? `将删除本机全部 ${days} 天记录，此操作不可恢复。`
        : hasData ? '将删除本机的起卦记录，此操作不可恢复。' : '本机目前没有记录。',
      confirmText: '清除',
      confirmColor: '#e64340',
      success: res => {
        if (!res.confirm || !hasData) return
        wx.setStorageSync('diary_data', {})
        this.refreshOverview()
        wx.showToast({ title: '已清除', icon: 'success' })
      }
    })
  },

  exportData() {
    const text = buildBackup(loadDiary())
    if (!text) {
      wx.showToast({ title: '暂无可导出的记录', icon: 'none' })
      return
    }
    const count = text.split('\n').length - 1
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: '已复制备份',
          content: `${count} 天记录已复制到剪贴板。请粘贴到备忘录或发给自己保存，换机后在本页「从剪贴板导入」即可恢复。`,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  importData() {
    wx.getClipboardData({
      success: res => {
        const imported = parseBackup(res.data)
        const count = Object.keys(imported).length
        if (!count) {
          wx.showModal({
            title: '未识别到备份',
            content: '请先复制由「导出备份」生成的文本，再点击导入。',
            showCancel: false,
            confirmText: '知道了'
          })
          return
        }
        wx.showModal({
          title: '导入记录',
          content: `识别到 ${count} 天记录。本机已有的内容会保留，只补充缺失的部分。`,
          confirmText: '导入',
          success: result => {
            if (!result.confirm) return
            const { data, added } = mergeDiary(loadDiary(), imported)
            if (!saveDiary(data)) return
            this.refreshOverview()
            wx.showToast({ title: added ? `已导入 ${added} 天` : '没有新的记录', icon: added ? 'success' : 'none' })
          }
        })
      }
    })
  },

  showAbout() {
    wx.showModal({
      title: '二字爻记',
      content: '每天用两个字和一卦记录当天\n\n极简 · 克制 · 安静\n\n记录默认只保存在本机。清理微信缓存、删除小程序或更换设备可能导致本地记录丢失，建议定期在「数据」中导出备份。\n\n当前版本：1.0.0',
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

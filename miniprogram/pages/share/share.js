// pages/share/share.js
const { solarToLunar } = require('../../utils/lunar')

Page({
  data: {
    statusBarHeight: 20,
    lunarYear: '',
    lunarMonthDay: '',
    words: '',
    hexagramSymbol: '',
    hexagramName: '',
    hexagramText: '',
    displayYaos: [],
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
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.loadBgStyle()

    const today = this.getTodayKey()
    const diaryData = wx.getStorageSync('diary_data') || {}
    const stored = diaryData[today] || {}

    if (stored.words) {
      const now = new Date()
      const lunar = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
      this.setData({
        lunarYear: stored.lunarYear || `${lunar.ganZhiYear}年`,
        lunarMonthDay: stored.lunarMonthDay || `${lunar.monthText}${lunar.dayText}`,
        words: stored.words,
        hexagramSymbol: stored.hexagramSymbol || '',
        hexagramName: stored.hexagramName || '',
        hexagramText: stored.hexagramText || '',
        displayYaos: stored.yaoTexts || []
      })
    } else {
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  getTodayKey() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  },

  goBack() {
    wx.navigateBack()
  },

  loadBgStyle() {
    const settings = wx.getStorageSync('settings') || {}
    const bgStyle = settings.bgStyle || 'xuan'
    const bgMap = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }
    this.setData({ bgStyle, bgClass: bgMap[bgStyle] || '', isDark: bgStyle === 'dark' })
  },

  onBgStyleChange(e) {
    const key = e.currentTarget.dataset.key
    const bgMap = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }
    this.setData({ bgStyle: key, bgClass: bgMap[key] || '', isDark: key === 'dark' })
    const settings = wx.getStorageSync('settings') || {}
    settings.bgStyle = key
    wx.setStorageSync('settings', settings)
  },

  async saveImage() {
    wx.showLoading({ title: '生成中...', mask: true })
    try {
      const path = await this.generateCard()
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: () => { wx.hideLoading(); wx.showToast({ title: '已保存', icon: 'success' }) },
        fail: (err) => {
          wx.hideLoading()
          if (err.errMsg.includes('auth')) {
            wx.showModal({ title: '提示', content: '需要授权保存图片', success: (r) => { if (r.confirm) wx.openSetting() } })
          }
        }
      })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  generateCard() {
    return new Promise((resolve, reject) => {
      let words = this.data.words
      if (!words) {
        const today = this.getTodayKey()
        const diaryData = wx.getStorageSync('diary_data') || {}
        const stored = diaryData[today] || {}
        words = stored.words || ''
      }

      if (!words) {
        reject(new Error('no words'))
        return
      }

      const query = wx.createSelectorQuery()
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) { reject(new Error('no canvas')); return }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const w = 750, h = 1000
        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)

        const bgColors = { xuan: '#f5f4ed', silk: '#f0e6d2', bamboo: '#dde6d6', dark: '#2a2a28' }
        ctx.fillStyle = bgColors[this.data.bgStyle] || '#f5f4ed'
        ctx.fillRect(0, 0, w, h)

        const cx = w / 2

        const isDark = this.data.bgStyle === 'dark'
        ctx.fillStyle = isDark ? '#7a7a70' : '#C8C5BC'
        ctx.font = '20px serif'
        ctx.textAlign = 'center'
        ctx.fillText(this.data.lunarYear || '', cx, 140)
        ctx.fillText(this.data.lunarMonthDay || '', cx, 168)

        ctx.fillStyle = isDark ? '#d0d0c8' : '#1F1F1F'
        ctx.font = 'bold 88px serif'
        ctx.textAlign = 'center'
        ctx.fillText(words, cx, 340)

        let y = 440
        if (this.data.hexagramSymbol) {
          ctx.fillStyle = isDark ? '#d0d0c8' : '#2F312B'
          ctx.font = '80px serif'
          ctx.textAlign = 'center'
          ctx.fillText(this.data.hexagramSymbol, cx, y)
          y += 70
        }

        if (this.data.hexagramName) {
          ctx.fillStyle = isDark ? '#b0b0a8' : '#4A4A45'
          ctx.font = '26px serif'
          ctx.textAlign = 'center'
          ctx.fillText(this.data.hexagramName, cx, y)
          y += 36
        }

        if (this.data.hexagramText) {
          ctx.fillStyle = isDark ? '#8a8a80' : '#8A8A82'
          ctx.font = '22px serif'
          ctx.textAlign = 'center'
          const maxWidth = w * 0.65
          const text = this.data.hexagramText
          if (ctx.measureText(text).width > maxWidth) {
            const mid = Math.ceil(text.length / 2)
            ctx.fillText(text.substring(0, mid), cx, y)
            ctx.fillText(text.substring(mid), cx, y + 30)
            y += 60
          } else {
            ctx.fillText(text, cx, y)
            y += 40
          }
        }

        wx.canvasToTempFilePath({
          canvas, x: 0, y: 0, width: w, height: h,
          destWidth: w * 2, destHeight: h * 2,
          success: (r) => resolve(r.tempFilePath),
          fail: reject
        })
      })
    })
  },

  shareToFriend() {
    wx.showToast({ title: '请点击右上角分享', icon: 'none' })
  },

  onShareAppMessage() {
    return { title: `今日二字：${this.data.words}`, path: '/pages/index/index' }
  }
})

// pages/share/share.js
const { solarToLunar } = require('../../utils/lunar')
const { getTodayKey, loadBgStyle, BG_MAP } = require('../../utils/common')

Page({
  data: {
    statusBarHeight: 20,
    lunarYear: '',
    lunarMonthDay: '',
    words: '',
    hexagramName: '',
    hexagramText: '',
    displayYaos: [],
    hexLines: [],
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

        const today = getTodayKey()
    const diaryData = wx.getStorageSync('diary_data') || {}
    const stored = diaryData[today] || {}

    if (stored.words) {
      const now = new Date()
      const lunar = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
      const hexLines = stored.yaos ? stored.yaos.slice().reverse().map(y => ({ type: y.type })) : []
      this.setData({
        lunarYear: stored.lunarYear || `${lunar.ganZhiYear}年`,
        lunarMonthDay: stored.lunarMonthDay || `${lunar.monthText}${lunar.dayText}`,
        words: stored.words,
        hexagramName: stored.hexagramName || '',
        hexagramText: stored.hexagramText || '',
        displayYaos: stored.yaoTexts || [],
        hexLines
      })
    } else {
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  loadBgStyle() {
    const bg = loadBgStyle()
    this.setData(bg)
  },

  onBgStyleChange(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ bgStyle: key, bgClass: BG_MAP[key] || '', isDark: key === 'dark' })
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
        const today = getTodayKey()
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
        const dpr = wx.getWindowInfo().pixelRatio
        
        // 根据风格设置颜色
        const isDark = this.data.isDark
        const bgColors = { xuan: '#f5f4ed', silk: '#f0e6d2', bamboo: '#dde6d6', dark: '#2a2a28' }
        const cardBgColors = { xuan: '#faf9f5', silk: '#faf6ee', bamboo: '#e8efe2', dark: '#333330' }
        const cardBorderColors = { xuan: '#D8D4CB', silk: '#e0d6c4', bamboo: '#c8d4c0', dark: '#444440' }
        
        const bgColor = bgColors[this.data.bgStyle] || '#f5f4ed'
        const cardBg = cardBgColors[this.data.bgStyle] || '#faf9f5'
        const cardBorder = cardBorderColors[this.data.bgStyle] || '#D8D4CB'
        
        // 卡片尺寸
        const cardW = 670
        const padding = 48
        const contentW = cardW - padding * 2
        
        // 计算卡片高度
        let cardH = padding + 30 + 40 + 36 + 160 + 40 // 标题 + 日期 + 米字格 + 间距
        if (this.data.hexLines && this.data.hexLines.length === 6) {
          cardH += 6 * 14 + 16 + 28 + 22 + 8 // 爻线 + 卦名 + 卦辞
        }
        if (this.data.displayYaos && this.data.displayYaos.length) {
          cardH += 12 + this.data.displayYaos.length * 30
        }
        cardH += padding
        
        // 画布尺寸
        const w = 750
        const ch = cardH + 120
        canvas.width = w * dpr
        canvas.height = ch * dpr
        ctx.scale(dpr, dpr)
        
        const cx = w / 2
        
        // 背景
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, w, ch)
        
        // 卡片背景
        const cardX = (w - cardW) / 2
        const cardY = 60
        this.drawRoundRect(ctx, cardX, cardY, cardW, cardH, 12)
        ctx.fillStyle = cardBg
        ctx.fill()
        ctx.strokeStyle = cardBorder
        ctx.lineWidth = 2
        ctx.stroke()
        
        let y = cardY + padding
        
        // 标题 "二字爻记" + 印章
        ctx.fillStyle = isDark ? '#d0d0c8' : '#2F312B'
        ctx.font = '500 30px "PingFang SC", serif'
        ctx.textAlign = 'center'
        ctx.fillText('二字爻记', cx - 14, y + 20)
        
        // 印章
        const sealX = cx + 80
        const sealY = y + 8
        ctx.save()
        ctx.translate(sealX, sealY)
        ctx.rotate(-12 * Math.PI / 180)
        ctx.strokeStyle = isDark ? 'rgba(200,80,60,0.4)' : 'rgba(180,40,30,0.45)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(-18, -18, 36, 36)
        ctx.fillStyle = isDark ? 'rgba(200,80,60,0.45)' : 'rgba(180,40,30,0.5)'
        ctx.font = '400 20px "Noto Serif SC", serif'
        ctx.fillText('爻', 0, 7)
        ctx.restore()
        
        y += 30 + 40
        
        // 日期行
        const dateText = `${this.data.lunarYear || ''}  ·  ${this.data.lunarMonthDay || ''}`
        ctx.fillStyle = isDark ? '#7a7a70' : '#8A8580'
        ctx.font = '20px "PingFang SC", serif'
        ctx.textAlign = 'center'
        const dateW = ctx.measureText(dateText).width
        const lineW = 32
        const lineGap = 12
        ctx.strokeStyle = isDark ? '#555550' : '#C8C3B8'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx - dateW / 2 - lineGap - lineW, y - 4)
        ctx.lineTo(cx - dateW / 2 - lineGap, y - 4)
        ctx.stroke()
        ctx.fillText(dateText, cx, y)
        ctx.beginPath()
        ctx.moveTo(cx + dateW / 2 + lineGap, y - 4)
        ctx.lineTo(cx + dateW / 2 + lineGap + lineW, y - 4)
        ctx.stroke()
        
        y += 36 + 40
        
        // 米字格
        const boxSize = 160
        const boxGap = 36
        const box1X = cx - boxSize - boxGap / 2
        const box2X = cx + boxGap / 2
        
        for (let i = 0; i < 2; i++) {
          const bx = i === 0 ? box1X : box2X
          
          // 边框
          ctx.strokeStyle = isDark ? '#555550' : '#C8C3B8'
          ctx.lineWidth = 2
          ctx.strokeRect(bx, y, boxSize, boxSize)
          
          // 横线
          ctx.strokeStyle = isDark ? '#444440' : '#E0DDD4'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(bx, y + boxSize / 2)
          ctx.lineTo(bx + boxSize, y + boxSize / 2)
          ctx.stroke()
          
          // 竖线
          ctx.beginPath()
          ctx.moveTo(bx + boxSize / 2, y)
          ctx.lineTo(bx + boxSize / 2, y + boxSize)
          ctx.stroke()
          
          // 对角线
          ctx.strokeStyle = isDark ? '#3a3a38' : '#EAE7E0'
          ctx.beginPath()
          ctx.moveTo(bx, y)
          ctx.lineTo(bx + boxSize, y + boxSize)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(bx + boxSize, y)
          ctx.lineTo(bx, y + boxSize)
          ctx.stroke()
          
          // 字
          ctx.fillStyle = isDark ? '#d0d0c8' : '#1F1F1F'
          ctx.font = 'bold 120px "PingFang SC", serif'
          ctx.textAlign = 'center'
          ctx.fillText(words[i] || '', bx + boxSize / 2, y + boxSize / 2 + 40)
        }
        y += boxSize + 40
        
        // 卦象
        if (this.data.hexLines && this.data.hexLines.length === 6) {
          ctx.fillStyle = isDark ? '#d0d0c8' : '#2F312B'
          ctx.strokeStyle = isDark ? '#d0d0c8' : '#2F312B'
          ctx.lineWidth = 4
          
          for (let i = 0; i < 6; i++) {
            const line = this.data.hexLines[i]
            const lineY = y + i * 14
            
            if (line.type === 'yang') {
              ctx.beginPath()
              ctx.moveTo(cx - 36, lineY)
              ctx.lineTo(cx + 36, lineY)
              ctx.stroke()
            } else {
              ctx.beginPath()
              ctx.moveTo(cx - 36, lineY)
              ctx.lineTo(cx - 6, lineY)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(cx + 6, lineY)
              ctx.lineTo(cx + 36, lineY)
              ctx.stroke()
            }
          }
          y += 6 * 14 + 16
          
          // 卦名
          if (this.data.hexagramName) {
            ctx.fillStyle = isDark ? '#b0b0a8' : '#3A3A35'
            ctx.font = '28px "PingFang SC", serif'
            ctx.textAlign = 'center'
            ctx.fillText(this.data.hexagramName, cx, y)
            y += 28 + 6
          }
          
          // 卦辞
          if (this.data.hexagramText) {
            ctx.fillStyle = isDark ? '#8a8a80' : '#6B6860'
            ctx.font = '22px "PingFang SC", serif'
            ctx.textAlign = 'center'
            const ciText = this.data.hexagramText
            const maxCiW = contentW * 0.9
            if (ctx.measureText(ciText).width > maxCiW) {
              const mid = Math.ceil(ciText.length / 2)
              ctx.fillText(ciText.substring(0, mid), cx, y)
              ctx.fillText(ciText.substring(mid), cx, y + 28)
              y += 56
            } else {
              ctx.fillText(ciText, cx, y)
              y += 28 + 8
            }
          }
        }
        
        // 爻辞
        if (this.data.displayYaos && this.data.displayYaos.length) {
          y += 12
          ctx.strokeStyle = isDark ? '#444440' : '#E8E5DC'
          ctx.fillStyle = isDark ? '#9a9a90' : '#5A5850'
          ctx.font = '20px "PingFang SC", serif'
          ctx.textAlign = 'left'
          const yaoX = cardX + padding
          this.data.displayYaos.forEach((yaoText, idx) => {
            ctx.fillText(yaoText, yaoX, y)
            y += 30
            if (idx < this.data.displayYaos.length - 1) {
              ctx.beginPath()
              ctx.moveTo(yaoX, y - 8)
              ctx.lineTo(yaoX + contentW, y - 8)
              ctx.stroke()
            }
          })
        }
        
        wx.canvasToTempFilePath({
          canvas, x: 0, y: 0, width: w, height: ch,
          destWidth: w * dpr, destHeight: ch * dpr,
          success: (r) => resolve(r.tempFilePath),
          fail: reject
        })
      })
    })
  },

  drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  },

  onShareAppMessage() {
    return { title: `今日二字：${this.data.words}`, path: '/pages/index/index' }
  }
})

// pages/share/share.js
const { solarToLunar } = require('../../utils/lunar')
const { getTodayKey, loadBgStyle, BG_MAP, getWindowInfoSafe } = require('../../utils/common')

Page({
  data: {
    statusBarHeight: 20,
    lunarYear: '',
    lunarMonthDay: '',
    dateKey: '',
    words: '',
    wordChars: ['', ''],
    shareImagePath: '',
    isSaving: false,
    hexagramName: '',
    hexagramText: '',
    displayYaos: [],
    hexLines: [],
    bgStyle: 'xuan',
    bgClass: '',
    isDark: false
  },

  onLoad(options) {
    this._isUnloaded = false
    const sysInfo = getWindowInfoSafe()
    this.setData({ statusBarHeight: sysInfo.statusBarHeight || 20 })
    this.loadBgStyle()

    // 启用分享到朋友圈
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {},
      fail: () => {}
    })

    const dateKey = this.normalizeDateKey(options.date)
    const diaryData = wx.getStorageSync('diary_data') || {}
    const stored = diaryData[dateKey] || {}
    const sharedWordChars = Array.from(this.safeDecode(options.w || '')).slice(0, 2)

    if (sharedWordChars.length === 2) {
      const [y, m, d] = dateKey.split('-').map(Number)
      const lunar = solarToLunar(y, m, d)
      const lineString = this.safeDecode(options.l || '').replace(/[^01]/g, '').slice(0, 6)
      const hexLines = lineString.split('').map((ch, index) => ({ key: index, type: ch === '1' ? 'yang' : 'yin' }))
      const sharedStyle = Object.prototype.hasOwnProperty.call(BG_MAP, options.s) ? options.s : this.data.bgStyle
      this.setData({
        dateKey,
        bgStyle: sharedStyle,
        bgClass: BG_MAP[sharedStyle] || '',
        isDark: sharedStyle === 'dark',
        lunarYear: this.safeDecode(options.ly || '').slice(0, 16) || `${lunar.ganZhiYear}年`,
        lunarMonthDay: this.safeDecode(options.lm || '').slice(0, 16) || `${lunar.monthText}${lunar.dayText}`,
        words: sharedWordChars.join(''),
        wordChars: [sharedWordChars[0] || '', sharedWordChars[1] || ''],
        hexagramName: this.safeDecode(options.hn || '').slice(0, 16),
        hexagramText: this.safeDecode(options.ht || '').slice(0, 160),
        displayYaos: [],
        hexLines
      }, () => {
        this.prepareShareImage()
      })
    } else if (stored.words) {
      const [y, m, d] = dateKey.split('-').map(Number)
      const lunar = solarToLunar(y, m, d)
      const storedWordChars = Array.from(stored.words || '').slice(0, 2)
      const hexLines = stored.yaos ? stored.yaos.slice().reverse().map((y, index) => ({ key: index, type: y.type })) : []
      this.setData({
        dateKey,
        lunarYear: stored.lunarYear || `${lunar.ganZhiYear}年`,
        lunarMonthDay: stored.lunarMonthDay || `${lunar.monthText}${lunar.dayText}`,
        words: storedWordChars.join(''),
        wordChars: [storedWordChars[0] || '', storedWordChars[1] || ''],
        hexagramName: stored.hexagramName || '',
        hexagramText: stored.hexagramText || '',
        displayYaos: stored.yaoTexts || [],
        hexLines
      }, () => {
        this.prepareShareImage()
      })
    } else {
      this.setData({ dateKey })
      wx.showToast({ title: '数据加载失败', icon: 'none' })
    }
  },

  normalizeDateKey(value) {
    const fallback = getTodayKey()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return fallback
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const minDate = new Date(1900, 0, 31)
    const maxDate = new Date(2050, 11, 31)
    if (
      date < minDate ||
      date > maxDate ||
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) return fallback
    return value
  },

  safeDecode(value) {
    try {
      return decodeURIComponent(value || '')
    } catch (e) {
      return value || ''
    }
  },

  buildShareQuery() {
    const dateKey = this.data.dateKey || getTodayKey()
    const lines = (this.data.hexLines || []).map(line => line.type === 'yang' ? '1' : '0').join('')
    const params = {
      date: dateKey,
      w: this.data.words || '',
      ly: this.data.lunarYear || '',
      lm: this.data.lunarMonthDay || '',
      hn: this.data.hexagramName || '',
      ht: this.data.hexagramText || '',
      l: lines,
      s: this.data.bgStyle || 'xuan'
    }
    return Object.keys(params)
      .filter(key => params[key])
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  onUnload() {
    this._isUnloaded = true
    if (this._shareImageTimer) clearTimeout(this._shareImageTimer)
    this._shareGenerationId = (this._shareGenerationId || 0) + 1
  },

  loadBgStyle() {
    const bg = loadBgStyle()
    this.setData(bg)
  },

  prepareShareImage() {
    if (!this.data.words) return
    if (this._shareImageTimer) clearTimeout(this._shareImageTimer)
    const generationId = (this._shareGenerationId || 0) + 1
    this._shareGenerationId = generationId
    this._shareImageTimer = setTimeout(() => {
      this._shareImageTimer = null
      this.generateCard()
        .then(path => {
          if (this._shareGenerationId === generationId) {
            this.setData({ shareImagePath: path })
          }
        })
        .catch(() => {})
    }, 300)
  },

  async saveImage() {
    if (this.data.isSaving || !this.data.words) return
    this.setData({ isSaving: true })
    try {
      const path = await this.generateCard()
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({ filePath: path, success: resolve, fail: reject })
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (error) {
      const errMsg = error && error.errMsg ? error.errMsg : ''
      if (errMsg.includes('auth') || errMsg.includes('deny')) {
        wx.showModal({
          title: '需要相册权限',
          content: '请在设置中允许保存图片到相册。',
          confirmText: '去设置',
          success: (result) => {
            if (result.confirm) wx.openSetting()
          }
        })
      } else {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      }
    } finally {
      if (!this._isUnloaded) this.setData({ isSaving: false })
    }
  },

  generateCard() {
    return new Promise((resolve, reject) => {
      let words = this.data.words
      if (!words) {
        const dateKey = this.data.dateKey || getTodayKey()
        const diaryData = wx.getStorageSync('diary_data') || {}
        const stored = diaryData[dateKey] || {}
        words = stored.words || ''
      }

      if (!words) {
        reject(new Error('no words'))
        return
      }

      const query = wx.createSelectorQuery().in(this)
      query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) { reject(new Error('no canvas')); return }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(getWindowInfoSafe().pixelRatio || 1, 2)
        
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
        const padding = 60
        const contentW = cardW - padding * 2
        const yaoW = 500
        
        // 计算卡片高度（更宽松的间距）
        let cardH = padding + 30 + 50 + 36 + 160 + 50 // 标题 + 日期 + 米字格 + 间距
        if (this.data.hexLines && this.data.hexLines.length === 6) {
          const ciLines = this.estimateLineCount(this.data.hexagramText || '', 18)
          cardH += 6 * 18 + 30 + 36 + 12 + ciLines * 30 + 16
        }
        if (this.data.displayYaos && this.data.displayYaos.length) {
          const yaoLines = this.data.displayYaos.reduce((sum, text) => {
            return sum + this.estimateLineCount(text || '', 18)
          }, 0)
          cardH += 30 + yaoLines * 34 + Math.max(0, this.data.displayYaos.length - 1) * 34
        }
        cardH += padding + 20
        
        // 画布尺寸（更大的画布）
        const w = 750
        const ch = cardH + 160
        canvas.width = w * dpr
        canvas.height = ch * dpr
        ctx.scale(dpr, dpr)
        
        const cx = w / 2
        
        // 背景
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, w, ch)
        
        // 卡片背景
        const cardX = (w - cardW) / 2
        const cardY = 80
        this.drawRoundRect(ctx, cardX, cardY, cardW, cardH, 12)
        ctx.fillStyle = cardBg
        ctx.fill()
        ctx.strokeStyle = cardBorder
        ctx.lineWidth = 2
        ctx.stroke()
        
        let y = cardY + padding
        
        // 标题 "二字爻记" + 印章
        ctx.fillStyle = isDark ? '#d0d0c8' : '#2F312B'
        ctx.font = '500 32px sans-serif'
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
        ctx.font = '400 20px sans-serif'
        ctx.fillText('爻', 0, 7)
        ctx.restore()
        
        y += 30 + 50
        
        // 日期行
        const dateText = `${this.data.lunarYear || ''}  ·  ${this.data.lunarMonthDay || ''}`
        ctx.fillStyle = isDark ? '#7a7a70' : '#8A8580'
        ctx.font = '22px sans-serif'
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
        
        y += 36 + 50
        
        // 米字格
        const wordChars = Array.from(words)
        const boxSize = 160
        const boxGap = 48
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
          ctx.font = 'bold 120px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(wordChars[i] || '', bx + boxSize / 2, y + boxSize / 2 + 40)
        }
        y += boxSize + 50
        
        // 卦象
        if (this.data.hexLines && this.data.hexLines.length === 6) {
          ctx.fillStyle = isDark ? '#d0d0c8' : '#2F312B'
          ctx.strokeStyle = isDark ? '#d0d0c8' : '#2F312B'
          ctx.lineWidth = 4
          
          for (let i = 0; i < 6; i++) {
            const line = this.data.hexLines[i]
            const lineY = y + i * 18
            
            if (line.type === 'yang') {
              ctx.beginPath()
              ctx.moveTo(cx - 40, lineY)
              ctx.lineTo(cx + 40, lineY)
              ctx.stroke()
            } else {
              ctx.beginPath()
              ctx.moveTo(cx - 40, lineY)
              ctx.lineTo(cx - 8, lineY)
              ctx.stroke()
              ctx.beginPath()
              ctx.moveTo(cx + 8, lineY)
              ctx.lineTo(cx + 40, lineY)
              ctx.stroke()
            }
          }
          y += 6 * 18 + 30
          
          // 卦名
          if (this.data.hexagramName) {
            ctx.fillStyle = isDark ? '#b0b0a8' : '#3A3A35'
            ctx.font = '30px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(this.data.hexagramName, cx, y)
            y += 36 + 12
          }
          
          // 卦辞
          if (this.data.hexagramText) {
            ctx.fillStyle = isDark ? '#8a8a80' : '#6B6860'
            ctx.font = '24px sans-serif'
            ctx.textAlign = 'center'
            const ciText = this.data.hexagramText
            const maxCiW = contentW * 0.9
            y = this.drawWrappedText(ctx, ciText, cx, y, maxCiW, 30, 'center') + 16
          }
        }
        
        // 爻辞
        if (this.data.displayYaos && this.data.displayYaos.length) {
          y += 30
          ctx.strokeStyle = isDark ? '#444440' : '#E8E5DC'
          ctx.fillStyle = isDark ? '#9a9a90' : '#5A5850'
          ctx.font = '24px sans-serif'
          ctx.textAlign = 'left'
          const yaoX = cx - yaoW / 2
          this.data.displayYaos.forEach((yaoText, idx) => {
            const textBottom = this.drawWrappedText(ctx, yaoText, yaoX, y, yaoW, 34, 'left')
            y = textBottom + 18
            if (idx < this.data.displayYaos.length - 1) {
              ctx.beginPath()
              ctx.moveTo(yaoX, y)
              ctx.lineTo(yaoX + yaoW, y)
              ctx.stroke()
              y += 16
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

  estimateLineCount(text, charsPerLine) {
    if (!text) return 0
    return Math.max(1, Math.ceil(text.length / charsPerLine))
  },

  wrapText(ctx, text, maxWidth) {
    const lines = []
    let line = ''
    for (const char of text) {
      const nextLine = line + char
      if (line && ctx.measureText(nextLine).width > maxWidth) {
        lines.push(line)
        line = char
      } else {
        line = nextLine
      }
    }
    if (line) lines.push(line)
    return lines
  },

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align) {
    const oldAlign = ctx.textAlign
    const oldBaseline = ctx.textBaseline
    ctx.textAlign = align
    ctx.textBaseline = 'top'
    const lines = this.wrapText(ctx, text, maxWidth)
    lines.forEach((line, idx) => {
      ctx.fillText(line, x, y + idx * lineHeight)
    })
    ctx.textAlign = oldAlign
    ctx.textBaseline = oldBaseline
    return y + lines.length * lineHeight
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
    const query = this.buildShareQuery()
    return {
      title: `今日二字：${this.data.words || '未记'}`,
      path: `/pages/share/share?${query}`,
      imageUrl: this.data.shareImagePath || ''
    }
  },

  onShareTimeline() {
    const query = this.buildShareQuery()
    return {
      title: `今日二字：${this.data.words || '未记'}`,
      query,
      imageUrl: this.data.shareImagePath || ''
    }
  }
})

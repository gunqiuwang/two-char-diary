// pages/share/share.js
const { solarToLunar } = require('../../utils/lunar')
const { getTodayKey, loadBgStyle, BG_MAP, getWindowInfoSafe } = require('../../utils/common')
const { loadDiary, getHexView, getHexViewFromBits } = require('../../utils/diary')

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
    const stored = loadDiary()[dateKey] || {}
    const sharedWordChars = Array.from(this.safeDecode(options.w || '')).slice(0, 2)
    const [y, m, d] = dateKey.split('-').map(Number)
    const lunar = solarToLunar(y, m, d)
    const lunarText = {
      lunarYear: lunar ? `${lunar.ganZhiYear}年` : '',
      lunarMonthDay: lunar ? `${lunar.monthText}${lunar.dayText}` : ''
    }

    // 来自分享链接时只信任 date / w / l / s，卦名、卦辞、爻辞、农历全部本地推导，防止伪造文案
    if (sharedWordChars.length === 2) {
      const lineString = this.safeDecode(options.l || '').replace(/[^01]/g, '')
      // l 为自上而下，查表需自下而上
      const hex = lineString.length === 6 ? getHexViewFromBits(lineString.split('').reverse().join('')) : null
      const sharedStyle = Object.prototype.hasOwnProperty.call(BG_MAP, options.s) ? options.s : this.data.bgStyle
      this.setData({
        dateKey,
        bgStyle: sharedStyle,
        bgClass: BG_MAP[sharedStyle] || '',
        isDark: sharedStyle === 'dark',
        ...lunarText,
        words: sharedWordChars.join(''),
        wordChars: [sharedWordChars[0] || '', sharedWordChars[1] || ''],
        hexagramName: hex ? hex.name : '',
        hexagramText: hex ? hex.ci : '',
        displayYaos: hex ? hex.yaoTexts : [],
        hexLines: hex ? hex.hexLines : []
      }, () => {
        this.prepareShareImage()
      })
    } else if (stored.words) {
      const storedWordChars = Array.from(stored.words || '').slice(0, 2)
      const hex = getHexView(stored)
      this.setData({
        dateKey,
        ...lunarText,
        words: storedWordChars.join(''),
        wordChars: [storedWordChars[0] || '', storedWordChars[1] || ''],
        hexagramName: hex ? hex.name : '',
        hexagramText: hex ? hex.ci : '',
        displayYaos: hex ? hex.yaoTexts : [],
        hexLines: hex ? hex.hexLines : []
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
      this.generateCover()
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
      const errno = error && error.errno
      // errno 112：隐私指引未声明相册权限；104：用户未同意隐私指引
      if (errno === 112) {
        wx.showToast({ title: '暂不支持保存到相册', icon: 'none' })
      } else if (errno === 104 || errMsg.includes('privacy')) {
        wx.showToast({ title: '需同意隐私保护指引后才能保存', icon: 'none' })
      } else if (errno === 103 || errMsg.includes('auth') || errMsg.includes('deny')) {
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
        words = (loadDiary()[dateKey] || {}).words || ''
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
        const { bgColor, cardBg, cardBorder } = this.getPalette()

        // 卡片尺寸
        const cardW = 670
        const padding = 60
        const contentW = cardW - padding * 2
        const yaoW = 500
        
        // 计算卡片高度（更宽松的间距）
        // 按绘制时的字号和宽度实际换行，避免估算偏差导致内容超出卡片
        ctx.font = '24px sans-serif'
        let cardH = padding + 30 + 50 + 36 + 160 + 50 // 标题 + 日期 + 米字格 + 间距
        if (this.data.hexLines && this.data.hexLines.length === 6) {
          const ciLines = this.wrapText(ctx, this.data.hexagramText || '', contentW * 0.9).length
          cardH += 6 * 18 + 30 + 36 + 12 + ciLines * 30 + 16
        }
        if (this.data.displayYaos && this.data.displayYaos.length) {
          const yaoLines = this.data.displayYaos.reduce((sum, text) => {
            return sum + this.wrapText(ctx, text || '', yaoW).length
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
        
        this.drawMiZi(ctx, box1X, y, boxSize, wordChars[0], isDark)
        this.drawMiZi(ctx, box2X, y, boxSize, wordChars[1], isDark)
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

  getPalette() {
    const style = this.data.bgStyle
    const bgColors = { xuan: '#f5f4ed', silk: '#f0e6d2', bamboo: '#dde6d6', dark: '#2a2a28' }
    const cardBgColors = { xuan: '#faf9f5', silk: '#faf6ee', bamboo: '#e8efe2', dark: '#333330' }
    const cardBorderColors = { xuan: '#D8D4CB', silk: '#e0d6c4', bamboo: '#c8d4c0', dark: '#444440' }
    return {
      bgColor: bgColors[style] || '#f5f4ed',
      cardBg: cardBgColors[style] || '#faf9f5',
      cardBorder: cardBorderColors[style] || '#D8D4CB'
    }
  },

  drawMiZi(ctx, x, y, size, char, isDark) {
    // 边框
    ctx.strokeStyle = isDark ? '#555550' : '#C8C3B8'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, size, size)

    // 横线、竖线
    ctx.strokeStyle = isDark ? '#444440' : '#E0DDD4'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y + size / 2)
    ctx.lineTo(x + size, y + size / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + size / 2, y)
    ctx.lineTo(x + size / 2, y + size)
    ctx.stroke()

    // 对角线
    ctx.strokeStyle = isDark ? '#3a3a38' : '#EAE7E0'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + size, y + size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + size, y)
    ctx.lineTo(x, y + size)
    ctx.stroke()

    // 字
    ctx.fillStyle = isDark ? '#d0d0c8' : '#1F1F1F'
    ctx.font = 'bold ' + (size * 0.75) + 'px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(char || '', x + size / 2, y + size / 2 + size / 4)
  },

  // 分享卡片封面：微信按 5:4 展示，单独画一张只含二字和卦名的图
  generateCover() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery().in(this)
      query.select('#coverCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res[0]) { reject(new Error('no canvas')); return }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Math.min(getWindowInfoSafe().pixelRatio || 1, 2)
        const isDark = this.data.isDark
        const { bgColor, cardBg, cardBorder } = this.getPalette()
        const w = 500
        const h = 400
        const cx = w / 2
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.scale(dpr, dpr)

        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, w, h)
        this.drawRoundRect(ctx, 24, 24, w - 48, h - 48, 10)
        ctx.fillStyle = cardBg
        ctx.fill()
        ctx.strokeStyle = cardBorder
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = isDark ? '#7a7a70' : '#8A8580'
        ctx.font = '22px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('二字爻记  ·  ' + (this.data.lunarMonthDay || ''), cx, 74)

        const wordChars = Array.from(this.data.words || '')
        const boxSize = 140
        const boxGap = 36
        this.drawMiZi(ctx, cx - boxSize - boxGap / 2, 100, boxSize, wordChars[0], isDark)
        this.drawMiZi(ctx, cx + boxGap / 2, 100, boxSize, wordChars[1], isDark)

        if (this.data.hexagramName) {
          ctx.fillStyle = isDark ? '#b0b0a8' : '#3A3A35'
          ctx.font = '28px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(this.data.hexagramName, cx, 300)
        }

        wx.canvasToTempFilePath({
          canvas, x: 0, y: 0, width: w, height: h,
          destWidth: w * dpr, destHeight: h * dpr,
          success: (r) => resolve(r.tempFilePath),
          fail: reject
        })
      })
    })
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

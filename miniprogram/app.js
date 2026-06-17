// app.js
App({
  onLaunch() {
    if (!wx.getStorageSync('diary_data')) {
      wx.setStorageSync('diary_data', {})
    }
    this.loadFont()
  },

  loadFont() {
    // 主字体：霞鹜文楷（支持 Canvas）
    wx.loadFontFace({
      family: 'LXGW WenKai GB',
      source: 'https://cdn.bootcdn.net/ajax/libs/lxgw-wenkai-webfont/1.7.0/style.css',
      scopes: ['webview', 'native'],
      success: () => { this.globalData.fontLoaded = true },
      fail: () => {
        this.globalData.fontLoaded = false
        this.loadFallbackFont()
      }
    })

    // 内置字体兜底：微信自研字体，离线可用
    if (wx.loadBuiltInFontFace) {
      wx.loadBuiltInFontFace({
        family: 'WeChatSansSS',
        source: 'WeChatSansSS',
        scopes: ['webview', 'native'],
        success: () => { this.globalData.fallbackFontLoaded = true },
        fail: () => {}
      })
    }
  },

  loadFallbackFont() {
    // 霞鹜文楷加载失败时，使用内置字体
    this.globalData.useFallbackFont = true
  },

  globalData: {
    fontLoaded: false,
    fallbackFontLoaded: false,
    useFallbackFont: false
  }
})

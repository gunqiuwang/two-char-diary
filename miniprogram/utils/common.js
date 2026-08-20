function getTodayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const BG_MAP = { xuan: '', silk: 'paper-texture-silk', bamboo: 'paper-texture-bamboo', dark: 'paper-texture-dark' }

function loadBgStyle() {
  const settings = wx.getStorageSync('settings') || {}
  const bgStyle = settings.bgStyle || 'xuan'
  const motionMode = settings.motionMode === 'reduced' ? 'reduced' : 'standard'
  return {
    bgStyle,
    bgClass: BG_MAP[bgStyle] || '',
    isDark: bgStyle === 'dark',
    motionMode,
    reduceMotion: motionMode === 'reduced'
  }
}

function getWindowInfoSafe() {
  if (typeof wx.getWindowInfo === 'function') {
    return wx.getWindowInfo()
  }
  return { statusBarHeight: 20, pixelRatio: 1 }
}

module.exports = { getTodayKey, loadBgStyle, BG_MAP, getWindowInfoSafe }

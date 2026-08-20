const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const { HEX_DATA } = require('./miniprogram/utils/hexdata')

const ROOT = path.join(__dirname, 'miniprogram')
const PAGES = ['index', 'share', 'calendar', 'settings']
const errors = []
const warnings = []

function walk(dir) {
  return fs.readdirSync(dir).flatMap(name => {
    const fullPath = path.join(dir, name)
    return fs.statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function relative(file) {
  return path.relative(__dirname, file).replace(/\\/g, '/')
}

function checkJavaScript(files) {
  for (const file of files.filter(file => file.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
    if (result.status !== 0) {
      errors.push(`JS 语法错误：${relative(file)}\n${result.stderr.trim()}`)
    }
  }
}

function checkJson(files) {
  for (const file of files.filter(file => file.endsWith('.json'))) {
    try {
      JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (error) {
      errors.push(`JSON 解析失败：${relative(file)} - ${error.message}`)
    }
  }
}

function checkRoutes() {
  const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'))
  for (const route of appConfig.pages || []) {
    for (const extension of ['js', 'json', 'wxml', 'wxss']) {
      const file = path.join(ROOT, `${route}.${extension}`)
      if (!fs.existsSync(file)) errors.push(`路由文件缺失：${relative(file)}`)
    }
  }
}

function checkWxmlStructure(files) {
  for (const file of files.filter(file => file.endsWith('.wxml'))) {
    const content = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
    const stack = []
    const tagPattern = /<\s*(\/?)\s*([A-Za-z][\w-]*)\b([^>]*)>/g
    for (const match of content.matchAll(tagPattern)) {
      const [, closing, tagName, rest] = match
      if (rest.trim().endsWith('/')) continue
      if (closing) {
        const expected = stack.pop()
        if (expected !== tagName) {
          errors.push(`WXML 标签不匹配：${relative(file)}，期望 </${expected || 'none'}>，实际 </${tagName}>`)
          break
        }
      } else {
        stack.push(tagName)
      }
    }
    if (stack.length) errors.push(`WXML 标签未闭合：${relative(file)} -> ${stack.join(', ')}`)
  }
}

function checkWxssStructure(files) {
  for (const file of files.filter(file => file.endsWith('.wxss'))) {
    const content = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    if (/(?:^|,)\s*[^{}]*\s\*(?=::|\s*[,\{])/m.test(content)) {
      errors.push(`WXSS 使用了不兼容的通配选择器：${relative(file)}`)
    }
    let balance = 0
    for (const char of content) {
      if (char === '{') balance++
      if (char === '}') balance--
      if (balance < 0) break
    }
    if (balance !== 0) errors.push(`WXSS 花括号不平衡：${relative(file)}，balance=${balance}`)
  }
}

function checkWxmlHandlers() {
  for (const page of PAGES) {
    const wxmlPath = path.join(ROOT, 'pages', page, `${page}.wxml`)
    const jsPath = path.join(ROOT, 'pages', page, `${page}.js`)
    const wxml = fs.readFileSync(wxmlPath, 'utf8')
    const js = fs.readFileSync(jsPath, 'utf8')
    const handlerPattern = /\b(?:bind|catch|capture-bind|capture-catch)(?:tap|input|focus|blur|change|confirm|longpress|touchstart|touchmove|touchend|submit|load|error)="([A-Za-z_$][\w$]*)"/g
    const handlers = [...wxml.matchAll(handlerPattern)].map(match => match[1])
    for (const handler of new Set(handlers)) {
      if (!js.includes(`${handler}(`)) {
        errors.push(`WXML 事件未实现：pages/${page}/${page}.wxml -> ${handler}`)
      }
    }
  }
}

function checkEncoding(files) {
  const mojibake = /浜|鐖|淇濆|鍒嗕|鐘舵|杩斿|鍗＄|鏍囬|鍐滃|绫冲|鍗﹁|鏃犳|椋庢|搴曢|锟斤拷|�/
  for (const file of files.filter(file => /\.(wxml|wxss|js|json|md)$/.test(file))) {
    const content = fs.readFileSync(file, 'utf8')
    if (mojibake.test(content)) errors.push(`疑似乱码：${relative(file)}`)
  }
}

function checkHexData() {
  const entries = Object.entries(HEX_DATA)
  if (entries.length !== 64) errors.push(`六十四卦数量异常：当前 ${entries.length} 条`)
  for (const [key, value] of entries) {
    if (!/^[01]{6}$/.test(key)) errors.push(`卦键格式错误：${key}`)
    if (!value.name || !value.ci) errors.push(`卦数据缺少名称或卦辞：${key}`)
    if (!Array.isArray(value.yaos) || value.yaos.length !== 6) {
      errors.push(`爻辞数量异常：${value.name || key}`)
    }
  }
}

function checkProjectSize(files) {
  const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0)
  console.log(`包体静态文件总大小：${(bytes / 1024).toFixed(1)} KB`)
  if (bytes > 1024 * 1024) warnings.push('包体已超过 1 MB，上传前建议再次检查资源和分包策略。')
}

function checkCandidateSelection() {
  const previousWx = global.wx
  const previousPage = global.Page
  const storage = { diary_data: {} }
  let pageDefinition

  global.wx = {
    getStorageSync(key) { return storage[key] },
    setStorageSync(key, value) { storage[key] = value },
    showToast() {},
    showShareMenu() {},
    getWindowInfo() { return { statusBarHeight: 20, pixelRatio: 1 } },
    nextTick(callback) { callback() }
  }
  global.Page = definition => { pageDefinition = definition }

  const modulePath = require.resolve('./miniprogram/pages/index/index.js')
  delete require.cache[modulePath]
  require(modulePath)

  const page = {
    ...pageDefinition,
    data: JSON.parse(JSON.stringify(pageDefinition.data)),
    setData(update, callback) {
      this.data = { ...this.data, ...update }
      if (callback) callback()
    }
  }
  page.data.lunarYear = '丙午年'
  page.data.lunarMonthDay = '五月廿六'
  page.onBoxTap({ currentTarget: { dataset: { idx: 0 } } })
  if (!page.data.showCandidates || !page.data.focus1 || page.data.focus2) {
    errors.push('点击米字格后未正确进入编辑状态。')
  }

  page.selectWord({ currentTarget: { dataset: { word: '盛夏' } } })

  const record = Object.values(storage.diary_data)[0]
  if (page.data.chars.join('') !== '盛夏' || page.data.char1 !== '盛' || page.data.char2 !== '夏') {
    errors.push('推荐词点击后未写入米字格状态。')
  }
  if (!page.data.isRecorded) {
    errors.push('推荐词点击后未进入已记录状态。')
  }
  if (!record || record.words !== '盛夏') {
    errors.push('推荐词点击后未写入本地存储。')
  }

  delete require.cache[modulePath]
  global.wx = previousWx
  global.Page = previousPage
}

const files = walk(ROOT)
checkJavaScript(files)
checkJson(files)
checkRoutes()
checkWxmlStructure(files)
checkWxssStructure(files)
checkWxmlHandlers()
checkEncoding(files)
checkHexData()
checkCandidateSelection()
checkProjectSize(files)

if (warnings.length) {
  console.log('\n警告：')
  warnings.forEach(item => console.log(`- ${item}`))
}

if (errors.length) {
  console.error('\n检查失败：')
  errors.forEach(item => console.error(`- ${item}`))
  process.exit(1)
}

console.log('\n项目静态检查通过。')

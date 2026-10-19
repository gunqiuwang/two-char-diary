// 回归测试：农历、节气、节日、卦象数据、本地存储迁移、备份、分享参数
// 用法：node test-regression.js
const fs = require('fs')
const path = require('path')
const { HEX_DATA } = require('./miniprogram/utils/hexdata')
const { solarToLunar } = require('./miniprogram/utils/lunar')
const { getSolarTerm, getLunarFestival, getSpecialDate } = require('./miniprogram/utils/solarterm')

const failures = []
let checks = 0
function check(name, ok, detail) {
  checks++
  if (!ok) failures.push(detail ? `${name}：${detail}` : name)
}

// ---------- 参考数据：香港天文台 1901–2050 ----------
const fixture = fs.readFileSync(path.join(__dirname, 'test-fixtures', 'hko-calendar-1901-2050.txt'), 'utf8').split('\n')
const termsByYear = {}
const monthStarts = []
for (const line of fixture) {
  const parts = line.trim().split(' ')
  if (parts[0] === 'T') termsByYear[parts[1]] = parts.slice(2)
  if (parts[0] === 'M') {
    for (const item of parts.slice(1)) {
      const [date, month] = item.split(':')
      const [y, m, d] = date.split('-').map(Number)
      monthStarts.push({ y, m, d, month: Number(month.replace('L', '')), leap: month.startsWith('L') })
    }
  }
}

function eachDay(fromYear, toYear, fn) {
  for (let t = Date.UTC(fromYear, 0, 1); t <= Date.UTC(toYear, 11, 31); t += 86400000) {
    const date = new Date(t)
    fn(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  }
}

// ---------- 1. 卦象数据 ----------
for (const [key, hex] of Object.entries(HEX_DATA)) {
  hex.yaos.forEach((text, i) => {
    const yang = /^(初九|九[二三四五]|上九)/.test(text)
    check('卦键与爻题一致', (key[i] === '1') === yang, `${hex.name} 第 ${i + 1} 爻`)
  })
}

// ---------- 2. 农历：每月初一及前一天与天文台一致 ----------
for (const s of monthStarts) {
  const lunar = solarToLunar(s.y, s.m, s.d)
  check('农历初一', lunar && lunar.lunarMonth === s.month && lunar.lunarDay === 1 && lunar.isLeap === s.leap,
    `${s.y}-${s.m}-${s.d} 期望 ${s.leap ? '闰' : ''}${s.month}月初一，实际 ${lunar && lunar.fullText}`)
  const prev = new Date(Date.UTC(s.y, s.m - 1, s.d - 1))
  if (prev.getUTCFullYear() >= 1901) {
    const before = solarToLunar(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate())
    check('农历月末', before && (before.lunarDay === 29 || before.lunarDay === 30), `${s.y}-${s.m}-${s.d} 前一天`)
  }
}

// ---------- 3. 农历范围 ----------
check('农历下界前返回 null', solarToLunar(1900, 1, 30) === null)
check('农历下界', solarToLunar(1900, 1, 31) !== null)
check('农历上界', solarToLunar(2050, 12, 31) !== null)
check('农历上界后返回 null', solarToLunar(2051, 1, 1) === null && solarToLunar(2051, 6, 1) === null)

// ---------- 4. 节气：每年 24 个，日期与天文台一致 ----------
for (let year = 1901; year <= 2050; year++) {
  const found = []
  eachDay(year, year, (y, m, d) => {
    const name = getSolarTerm(y, m, d)
    if (name) found.push({ date: `${m}-${d}`, name })
  })
  const expected = termsByYear[year] || []
  check('节气日期', found.map(t => t.date).join(' ') === expected.join(' '),
    `${year} 期望 ${expected.join(' ')}，实际 ${found.map(t => t.date).join(' ')}`)
}
check('节气名称顺序', getSolarTerm(2026, 2, 4) === '立春' && getSolarTerm(2026, 12, 22) === '冬至' && getSolarTerm(2026, 2, 5) === null)

// ---------- 5. 农历节日：闰月不过节，除夕判定正确 ----------
eachDay(1901, 2050, (y, m, d) => {
  const lunar = solarToLunar(y, m, d)
  if (lunar && lunar.isLeap) {
    check('闰月不过节', getLunarFestival(lunar.lunarMonth, lunar.lunarDay, lunar.lunarYear, lunar.isLeap) === null, `${y}-${m}-${d}`)
  }
})
for (const s of monthStarts.filter(s => s.month === 1 && !s.leap)) {
  const prev = new Date(Date.UTC(s.y, s.m - 1, s.d - 1))
  const [y, m, d] = [prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate()]
  if (y < 1901) continue
  check('除夕', getSpecialDate(y, m, d, solarToLunar(y, m, d)) === '除夕', `${y}-${m}-${d}`)
}
check('2028-06-27 闰五月初五不是端午', getSpecialDate(2028, 6, 27, solarToLunar(2028, 6, 27)) !== '端午节')

// ---------- 6. 本地存储：迁移、体积、写入失败 ----------
function createWx(storage, overrides = {}) {
  const calls = { modal: [], toast: [] }
  const wx = {
    getStorageSync(key) { return storage[key] },
    setStorageSync(key, value) { storage[key] = JSON.parse(JSON.stringify(value)) },
    showModal(options) { calls.modal.push(options) },
    showToast(options) { calls.toast.push(options) },
    showShareMenu() {},
    getWindowInfo() { return { statusBarHeight: 20, pixelRatio: 1 } },
    ...overrides
  }
  return { wx, calls }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath)
  delete require.cache[resolved]
  return require(resolved)
}

const v1Hex = HEX_DATA['100010']
const v1Record = {
  words: '平静',
  lunarYear: '丙午年',
  lunarMonthDay: '九月初九',
  timestamp: 1760000000000,
  yaos: [9, 8, 8, 8, 7, 6].map(value => ({ type: value % 2 ? 'yang' : 'yin', moving: value === 6 || value === 9, value })),
  yaoTexts: v1Hex.yaos.slice().reverse(),
  hexagramSymbol: v1Hex.symbol,
  hexagramName: v1Hex.name,
  hexagramText: v1Hex.ci
}

{
  const storage = { diary_data: { '2026-10-19': v1Record, '2026-10-18': { words: '晴朗' }, junk: null } }
  global.wx = createWx(storage).wx
  const diary = freshRequire('./miniprogram/utils/diary')
  diary.migrateDiary()
  const migrated = storage.diary_data['2026-10-19']
  check('迁移后结构精简', JSON.stringify(migrated) === JSON.stringify({ words: '平静', yao: '988876', timestamp: 1760000000000 }), JSON.stringify(migrated))
  check('迁移后单条体积 < 100 字节', Buffer.byteLength(JSON.stringify({ '2026-10-19': migrated })) < 100)
  check('迁移写入版本号', storage.diary_schema === 2)
  check('迁移丢弃无效记录', !('junk' in storage.diary_data) && storage.diary_data['2026-10-18'].words === '晴朗')
  const view = diary.getHexView(migrated)
  check('迁移后卦象可推导', view && view.name === v1Record.hexagramName && view.ci === v1Record.hexagramText &&
    JSON.stringify(view.yaoTexts) === JSON.stringify(v1Record.yaoTexts))
  const legacyView = diary.getHexView(v1Record)
  check('读取侧兼容 v1 记录', legacyView && legacyView.name === v1Record.hexagramName)

  const before = JSON.stringify(storage.diary_data)
  storage.diary_data['2026-10-17'] = v1Record
  diary.migrateDiary()
  check('迁移只执行一次', storage.diary_data['2026-10-17'] === v1Record && before !== JSON.stringify(storage.diary_data))
}

{
  const storage = {}
  const { wx, calls } = createWx(storage, { setStorageSync() { throw new Error('setStorageSync:fail exceed storage max size 1MB') } })
  global.wx = wx
  const diary = freshRequire('./miniprogram/utils/diary')
  check('写入失败返回 false', diary.saveDiary({ a: 1 }) === false)
  check('写入失败提示用户', calls.modal.length === 1)
}

// ---------- 7. 备份导出/导入 ----------
{
  global.wx = createWx({}).wx
  const diary = freshRequire('./miniprogram/utils/diary')
  const data = {
    '2026-10-19': { words: '平静', yao: '988876', timestamp: 1 },
    '2026-10-18': { yao: '777777' },
    '2026-10-17': { words: '晴朗' }
  }
  const text = diary.buildBackup(data)
  check('备份首行', text.split('\n')[0] === '# 二字爻记备份 v2')
  check('备份内容', text.includes('2026-10-19|平静|988876|水雷屯') && text.includes('2026-10-18||777777|乾为天') && text.includes('2026-10-17|晴朗||'))
  const outOfRange = diary.parseBackup('2099-01-01|未来|777777|x\n1900-01-30|太早|777777|x')
  check('导入拒绝范围外日期', Object.keys(outOfRange).length === 0, JSON.stringify(outOfRange))
  const parsed = diary.parseBackup(text + '\n2026-02-30|错误|777777|x\n2026-10-16|三个字|777777|x\nhello')
  check('备份解析', Object.keys(parsed).length === 4 && parsed['2026-10-19'].yao === '988876' && !parsed['2026-02-30'] &&
    parsed['2026-10-16'].yao === '777777' && !parsed['2026-10-16'].words, JSON.stringify(parsed))
  const local = { '2026-10-19': { words: '本机', timestamp: 2 } }
  const { data: merged, added } = diary.mergeDiary(local, parsed)
  check('导入不覆盖本机内容', merged['2026-10-19'].words === '本机' && merged['2026-10-19'].yao === '988876' && merged['2026-10-19'].timestamp === 2)
  check('导入补充缺失日期', merged['2026-10-17'].words === '晴朗' && added === 4)
  check('重复导入无新增', diary.mergeDiary(merged, parsed).added === 0)
}

// ---------- 8. 页面集成 ----------
function loadPage(pagePath, wx) {
  global.wx = wx
  let definition
  global.Page = def => { definition = def }
  freshRequire('./miniprogram/utils/diary')
  freshRequire(pagePath)
  return {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update, callback) {
      this.data = { ...this.data, ...update }
      if (callback) callback()
    }
  }
}

{
  const realSetTimeout = global.setTimeout
  global.setTimeout = fn => { fn(); return 0 }
  const storage = { diary_data: {} }
  const page = loadPage('./miniprogram/pages/index/index.js', createWx(storage).wx)
  page.startCasting()
  global.setTimeout = realSetTimeout
  const today = Object.keys(storage.diary_data)[0]
  const record = storage.diary_data[today] || {}
  check('起卦只存爻码', /^[6789]{6}$/.test(record.yao) && Object.keys(record).join() === 'yao', JSON.stringify(record))
  const bits = (record.yao || '').replace(/[79]/g, '1').replace(/[68]/g, '0')
  check('起卦显示与存储一致', page.data.castingState === 'result' && HEX_DATA[bits] && page.data.hexagramName === HEX_DATA[bits].name)
}

{
  const storage = { diary_data: {} }
  const { wx, calls } = createWx(storage, { setStorageSync() { throw new Error('exceed') } })
  const page = loadPage('./miniprogram/pages/index/index.js', wx)
  page.commitWords(['平', '静'])
  check('存储满时不显示已记下', page.data.isRecorded === false && calls.modal.length === 1 && calls.toast.length === 0)
}

{
  const storage = { diary_data: {} }
  const page = loadPage('./miniprogram/pages/share/share.js', createWx(storage).wx)
  page.prepareShareImage = () => {}
  page.onLoad({
    date: '2026-10-19',
    w: encodeURIComponent('平静'),
    l: '010001', // 自上而下：山水蒙
    hn: encodeURIComponent('伪造卦名'),
    ht: encodeURIComponent('伪造的一段文案'),
    ly: encodeURIComponent('伪造'),
    lm: encodeURIComponent('伪造')
  })
  const expected = HEX_DATA['100010']
  const lunar = solarToLunar(2026, 10, 19)
  check('分享链接忽略伪造卦名卦辞', page.data.hexagramName === expected.name && page.data.hexagramText === expected.ci, page.data.hexagramName)
  check('分享链接农历本地推导', page.data.lunarYear === `${lunar.ganZhiYear}年` && page.data.lunarMonthDay === `${lunar.monthText}${lunar.dayText}`)
  check('分享接收方可见爻辞', page.data.displayYaos.length === 6)
  const query = page.buildShareQuery()
  check('分享参数只含 date/w/l/s', query.split('&').map(pair => pair.split('=')[0]).join(',') === 'date,w,l,s', query)
  check('分享链接往返一致', query.includes('l=010001'))
}

{
  let clipboard = ''
  const source = { diary_data: { '2026-10-19': { words: '平静', yao: '988876' }, '2026-10-18': { yao: '777777' } } }
  const exporter = loadPage('./miniprogram/pages/settings/settings.js', createWx(source, {
    setClipboardData({ data, success }) { clipboard = data; success() }
  }).wx)
  exporter.exportData()

  const target = { diary_data: { '2026-10-19': { words: '本机' } } }
  const { wx, calls } = createWx(target, {
    getClipboardData({ success }) { success({ data: clipboard }) },
    showModal(options) { calls.modal.push(options); if (options.success) options.success({ confirm: true }) }
  })
  const importer = loadPage('./miniprogram/pages/settings/settings.js', wx)
  importer.importData()
  check('设置页导出后导入', target.diary_data['2026-10-19'].words === '本机' && target.diary_data['2026-10-19'].yao === '988876' &&
    target.diary_data['2026-10-18'].yao === '777777', JSON.stringify(target.diary_data))
  importer.refreshOverview()
  check('设置页起卦次数按新结构统计', importer.data.dataOverview.casts === 1 && importer.data.dataOverview.days === 1)
}

delete global.wx
delete global.Page

if (failures.length) {
  console.error(`回归测试失败：${failures.length} / ${checks}`)
  failures.slice(0, 30).forEach(item => console.error(`- ${item}`))
  process.exit(1)
}
console.log(`回归测试通过：${checks} 项检查`)

// 二十四节气 + 传统节日 + 每日推荐词

const { monthDays } = require('./lunar')

// 节气：按太阳视黄经计算（Meeus 低精度公式，约 0.01°），以北京时间判定日期。
// 每月两个节气，第 m 月对应黄经 285+30(m-1) 与再加 15 度。
const SOLAR_TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

// 交节时刻贴近午夜时公式会差一天。以下按香港天文台 1901–2050 历表校正：计算日期 -> 实际日期
const SOLAR_TERM_FIXES = {
  '1912-10-8': '1912-10-9', '1912-11-22': '1912-11-23', '1913-9-23': '1913-9-24',
  '1923-2-20': '1923-2-19', '1927-9-9': '1927-9-8', '1928-6-22': '1928-6-21',
  '1950-4-21': '1950-4-20', '1951-12-22': '1951-12-23', '1979-1-20': '1979-1-21',
  '2014-3-5': '2014-3-6', '2016-7-6': '2016-7-7', '2045-7-6': '2045-7-7',
  '2047-3-5': '2047-3-6'
}
const SOLAR_TERM_FIXED_TO = Object.keys(SOLAR_TERM_FIXES).reduce((map, from) => {
  map[SOLAR_TERM_FIXES[from]] = from
  return map
}, {})

const RAD = Math.PI / 180

function sunLongitude(ms) {
  const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)
  const omega = (125.04 - 1934.136 * T) * RAD
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega)
  return ((lambda % 360) + 360) % 360
}

// 北京时间当日 0 点到次日 0 点之间，太阳是否越过该月某个节气的黄经
function computeSolarTerm(year, month, day) {
  const start = sunLongitude(Date.UTC(year, month - 1, day) - 8 * 3600000)
  const end = sunLongitude(Date.UTC(year, month - 1, day + 1) - 8 * 3600000)
  for (let k = 0; k < 2; k++) {
    const target = (285 + 30 * (month - 1) + 15 * k) % 360
    const before = ((start - target + 540) % 360) - 180
    const after = ((end - target + 540) % 360) - 180
    if (before < 0 && after >= 0) return SOLAR_TERM_NAMES[(month - 1) * 2 + k]
  }
  return null
}

// 公历节日
const SOLAR_FESTIVALS = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '3-12': '植树节',
  '4-1': '愚人节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '12-25': '圣诞节'
}

// 农历节日（需要农历日期）
const LUNAR_FESTIVALS = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-8': '腊八节',
  '12-30': '除夕'
}

// 节气对应的推荐词
const SOLAR_TERM_WORDS = {
  '小寒': ['寒意', '围炉', '暖阳', '冬藏'],
  '大寒': ['岁末', '归家', '年味', '团圆'],
  '立春': ['初春', '萌芽', '希望', '新生'],
  '雨水': ['春雨', '润物', '细雨', '滋润'],
  '惊蛰': ['惊雷', '苏醒', '春雷', '生机'],
  '春分': ['春分', '平衡', '花开', '昼夜'],
  '清明': ['清明', '踏青', '思念', '缅怀'],
  '谷雨': ['谷雨', '播种', '春茶', '生长'],
  '立夏': ['初夏', '蝉鸣', '绿荫', '清风'],
  '小满': ['小满', '麦穗', '盈满', '知足'],
  '芒种': ['芒种', '收获', '播种', '忙碌'],
  '夏至': ['夏至', '长日', '荷花', '清凉'],
  '小暑': ['小暑', '纳凉', '西瓜', '晚风'],
  '大暑': ['大暑', '盛夏', '蝉声', '避暑'],
  '立秋': ['初秋', '凉风', '落叶', '秋意'],
  '处暑': ['处暑', '余热', '秋高', '气爽'],
  '白露': ['白露', '秋凉', '露珠', '晨雾'],
  '秋分': ['秋分', '丰收', '金秋', '月圆'],
  '寒露': ['寒露', '深秋', '枫红', '菊花'],
  '霜降': ['霜降', '初霜', '秋尽', '收藏'],
  '立冬': ['初冬', '寒意', '暖炉', '冬衣'],
  '小雪': ['小雪', '初雪', '银装', '温暖'],
  '大雪': ['大雪', '纷飞', '围炉', '热茶'],
  '冬至': ['冬至', '饺子', '团圆', '长夜']
}

// 节日对应的推荐词
const FESTIVAL_WORDS = {
  '元旦': ['新年', '开始', '希望', '祝福'],
  '情人节': ['甜蜜', '浪漫', '爱情', '陪伴'],
  '妇女节': ['绽放', '优雅', '自信', '美丽'],
  '植树节': ['绿色', '生机', '成长', '希望'],
  '愚人节': ['玩笑', '欢乐', '轻松', '有趣'],
  '劳动节': ['勤劳', '收获', '充实', '努力'],
  '青年节': ['青春', '热血', '梦想', '奋斗'],
  '儿童节': ['童真', '快乐', '纯真', '回忆'],
  '建党节': ['初心', '使命', '奋斗', '前行'],
  '建军节': ['守护', '坚强', '勇敢', '担当'],
  '教师节': ['感恩', '师恩', '传承', '智慧'],
  '国庆节': ['祖国', '繁荣', '自豪', '祝福'],
  '圣诞节': ['平安', '祝福', '温暖', '分享'],
  '春节': ['团圆', '喜庆', '新年', '祝福'],
  '元宵节': ['花灯', '团圆', '甜蜜', '圆满'],
  '龙抬头': ['龙腾', '生机', '希望', '抬头'],
  '端午节': ['端午', '安康', '粽子', '龙舟'],
  '七夕': ['浪漫', '星河', '相守', '约定'],
  '中元节': ['思念', '缅怀', '传承', '敬畏'],
  '中秋节': ['月圆', '团圆', '思念', '月饼'],
  '重阳节': ['登高', '敬老', '菊花', '思念'],
  '腊八节': ['腊八', '温暖', '粥香', '年味'],
  '除夕': ['守岁', '团圆', '新年', '辞旧']
}

// 获取今日节气
function getSolarTerm(year, month, day) {
  const key = `${year}-${month}-${day}`
  if (SOLAR_TERM_FIXES[key]) return null
  if (SOLAR_TERM_FIXED_TO[key]) {
    const [y, m, d] = SOLAR_TERM_FIXED_TO[key].split('-').map(Number)
    return computeSolarTerm(y, m, d)
  }
  return computeSolarTerm(year, month, day)
}

// 获取今日节日（公历）
function getSolarFestival(month, day) {
  return SOLAR_FESTIVALS[`${month}-${day}`] || null
}

// 获取农历某年腊月的天数
function getLunar12MonthDays(year) {
  if (!year) return 30
  return monthDays(year, 12)
}

// 获取今日节日（农历）。闰月不过节。
function getLunarFestival(lunarMonth, lunarDay, lunarYear, isLeap) {
  if (isLeap || !lunarMonth) return null
  // 处理除夕：腊月最后一天
  if (lunarMonth === 12 && lunarDay === 29) {
    // 如果腊月只有29天，这一天也是除夕
    const daysInMonth = getLunar12MonthDays(lunarYear)
    if (daysInMonth === 29) {
      return '除夕'
    }
  }
  return LUNAR_FESTIVALS[`${lunarMonth}-${lunarDay}`] || null
}

function getLunarFestivalOf(lunar) {
  return lunar ? getLunarFestival(lunar.lunarMonth, lunar.lunarDay, lunar.lunarYear, lunar.isLeap) : null
}

// 获取每日推荐词。lunar 为 solarToLunar 的结果，超出农历范围时为 null
function getDailyWords(year, month, day, lunar) {
  // 优先使用节日推荐词
  const solarFestival = getSolarFestival(month, day)
  if (solarFestival && FESTIVAL_WORDS[solarFestival]) {
    return FESTIVAL_WORDS[solarFestival]
  }

  const lunarFestival = getLunarFestivalOf(lunar)
  if (lunarFestival && FESTIVAL_WORDS[lunarFestival]) {
    return FESTIVAL_WORDS[lunarFestival]
  }

  // 使用节气推荐词
  const solarTerm = getSolarTerm(year, month, day)
  if (solarTerm && SOLAR_TERM_WORDS[solarTerm]) {
    return SOLAR_TERM_WORDS[solarTerm]
  }
  
  return null
}

// 获取今日特殊日期描述（节气/节日）
function getSpecialDate(year, month, day, lunar) {
  const solarFestival = getSolarFestival(month, day)
  const lunarFestival = getLunarFestivalOf(lunar)
  const solarTerm = getSolarTerm(year, month, day)
  
  // 优先级：农历节日 > 公历节日 > 节气
  return lunarFestival || solarFestival || solarTerm || null
}

module.exports = {
  getSolarTerm,
  getSolarFestival,
  getLunarFestival,
  getDailyWords,
  getSpecialDate
}

// 二十四节气 + 传统节日 + 每日推荐词

// 节气数据（基于太阳黄经，简化算法）
// 节气日期在公历中基本固定，少数年份有1天偏差
const SOLAR_TERMS = {
  1: [{ day: 5, name: '小寒' }, { day: 20, name: '大寒' }],
  2: [{ day: 4, name: '立春' }, { day: 19, name: '雨水' }],
  3: [{ day: 6, name: '惊蛰' }, { day: 21, name: '春分' }],
  4: [{ day: 5, name: '清明' }, { day: 20, name: '谷雨' }],
  5: [{ day: 6, name: '立夏' }, { day: 21, name: '小满' }],
  6: [{ day: 6, name: '芒种' }, { day: 21, name: '夏至' }],
  7: [{ day: 7, name: '小暑' }, { day: 23, name: '大暑' }],
  8: [{ day: 7, name: '立秋' }, { day: 23, name: '处暑' }],
  9: [{ day: 8, name: '白露' }, { day: 23, name: '秋分' }],
  10: [{ day: 8, name: '寒露' }, { day: 23, name: '霜降' }],
  11: [{ day: 7, name: '立冬' }, { day: 22, name: '小雪' }],
  12: [{ day: 7, name: '大雪' }, { day: 22, name: '冬至' }]
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
function getSolarTerm(month, day) {
  const terms = SOLAR_TERMS[month]
  if (!terms) return null
  for (const term of terms) {
    if (day === term.day) return term.name
    // 节气前后1天也算
    if (Math.abs(day - term.day) === 1) return term.name
  }
  return null
}

// 获取今日节日（公历）
function getSolarFestival(month, day) {
  return SOLAR_FESTIVALS[`${month}-${day}`] || null
}

// 获取今日节日（农历）
function getLunarFestival(lunarMonth, lunarDay) {
  return LUNAR_FESTIVALS[`${lunarMonth}-${lunarDay}`] || null
}

// 获取每日推荐词
function getDailyWords(month, day, lunarMonth, lunarDay) {
  // 优先使用节日推荐词
  const solarFestival = getSolarFestival(month, day)
  if (solarFestival && FESTIVAL_WORDS[solarFestival]) {
    return FESTIVAL_WORDS[solarFestival]
  }
  
  const lunarFestival = getLunarFestival(lunarMonth, lunarDay)
  if (lunarFestival && FESTIVAL_WORDS[lunarFestival]) {
    return FESTIVAL_WORDS[lunarFestival]
  }
  
  // 使用节气推荐词
  const solarTerm = getSolarTerm(month, day)
  if (solarTerm && SOLAR_TERM_WORDS[solarTerm]) {
    return SOLAR_TERM_WORDS[solarTerm]
  }
  
  return null
}

// 获取今日特殊日期描述（节气/节日）
function getSpecialDate(month, day, lunarMonth, lunarDay) {
  const solarFestival = getSolarFestival(month, day)
  const lunarFestival = getLunarFestival(lunarMonth, lunarDay)
  const solarTerm = getSolarTerm(month, day)
  
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

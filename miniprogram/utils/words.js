// 备选词库 - 适合日记记录的二字词语
// 按情感/场景分类

const WORD_CATEGORIES = {
  // 天气/自然
  weather: [
    '晴朗', '多云', '微风', '细雨', '薄雾',
    '晚霞', '朝露', '月光', '星辰', '彩虹'
  ],

  // 心情/情绪
  mood: [
    '平静', '欢喜', '忧伤', '思念', '期待',
    '释然', '感动', '孤独', '温暖', '满足',
    '迷茫', '坚定', '淡然', '欣喜', '安宁'
  ],

  // 日常/生活
  daily: [
    '早安', '晚安', '午后', '黄昏', '深夜',
    '读书', '散步', '烹饪', '整理', '小憩',
    '发呆', '远眺', '听雨', '品茶', '冥想'
  ],

  // 季节/时间
  season: [
    '春分', '夏至', '秋分', '冬至', '初春',
    '盛夏', '深秋', '寒冬', '岁末', '年初'
  ],

  // 人际关系
  people: [
    '相聚', '离别', '重逢', '思念', '陪伴',
    '独处', '畅谈', '默契', '牵挂', '感恩'
  ],

  // 成长/感悟
  growth: [
    '领悟', '坚持', '放下', '前行', '沉淀',
    '突破', '接纳', '勇气', '希望', '蜕变'
  ],

  // 风景/意境
  scene: [
    '山间', '海边', '林中', '溪畔', '花前',
    '月下', '窗前', '檐下', '桥上', '路上'
  ],

  // 简单词语
  simple: [
    '今天', '明天', '昨日', '此刻', '当下',
    '日常', '平凡', '简单', '真实', '自在'
  ]
}

// 获取随机备选词
function getRandomWords(count = 8) {
  const allWords = []
  Object.values(WORD_CATEGORIES).forEach(words => {
    allWords.push(...words)
  })

  // 随机打乱并取指定数量
  const shuffled = allWords.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 获取指定分类的备选词
function getWordsByCategory(category) {
  return WORD_CATEGORIES[category] || []
}

// 获取所有分类
function getCategories() {
  return Object.keys(WORD_CATEGORIES)
}

module.exports = {
  WORD_CATEGORIES,
  getRandomWords,
  getWordsByCategory,
  getCategories
}

// app.js
App({
  onLaunch() {
    // 初始化本地存储
    if (!wx.getStorageSync('diary_data')) {
      wx.setStorageSync('diary_data', {})
    }

    // 加载霞鹜文楷字体
    this.loadFont()
  },

  loadFont() {
    wx.loadFontFace({
      family: 'LXGW WenKai GB',
      source: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css',
      success: () => { this.globalData.fontLoaded = true },
      fail: () => { this.globalData.fontLoaded = false }
    })
    wx.loadFontFace({
      family: 'Noto Serif SC',
      source: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap',
      success: () => { this.globalData.serifFontLoaded = true },
      fail: () => { this.globalData.serifFontLoaded = false }
    })
  },

  globalData: {
    fontLoaded: false,
    serifFontLoaded: false,

    // 六十四卦数据（含Unicode卦符）
    hexagrams: {
      '111111': { symbol: '䷀', name: '乾为天', text: '元亨利贞。' },
      '000000': { symbol: '䷁', name: '坤为地', text: '元亨，利牝马之贞。' },
      '100010': { symbol: '䷂', name: '水雷屯', text: '元亨利贞，勿用有攸往，利建侯。' },
      '010001': { symbol: '䷃', name: '山水蒙', text: '亨。匪我求童蒙，童蒙求我。' },
      '111010': { symbol: '䷄', name: '水天需', text: '有孚，光亨，贞吉，利涉大川。' },
      '010111': { symbol: '䷅', name: '天水讼', text: '有孚窒惕，中吉，终凶。利见大人，不利涉大川。' },
      '010000': { symbol: '䷆', name: '地水师', text: '贞，丈人吉，无咎。' },
      '000010': { symbol: '䷇', name: '水地比', text: '吉。原筮元永贞，无咎。' },
      '111011': { symbol: '䷈', name: '风天小畜', text: '亨。密云不雨，自我西郊。' },
      '110111': { symbol: '䷉', name: '天泽履', text: '履虎尾，不咥人，亨。' },
      '111000': { symbol: '䷊', name: '地天泰', text: '小往大来，吉亨。' },
      '000111': { symbol: '䷋', name: '天地否', text: '否之匪人，不利君子贞，大往小来。' },
      '101111': { symbol: '䷌', name: '天火同人', text: '同人于野，亨，利涉大川，利君子贞。' },
      '111101': { symbol: '䷍', name: '火天大有', text: '元亨。' },
      '001000': { symbol: '䷎', name: '地山谦', text: '亨，君子有终。' },
      '000100': { symbol: '䷏', name: '雷地豫', text: '利建侯行师。' },
      '100110': { symbol: '䷐', name: '泽雷随', text: '元亨利贞，无咎。' },
      '011001': { symbol: '䷑', name: '山风蛊', text: '元亨，利涉大川。先甲三日，后甲三日。' },
      '110000': { symbol: '䷒', name: '地泽临', text: '元亨利贞。至于八月有凶。' },
      '000011': { symbol: '䷓', name: '风地观', text: '盥而不荐，有孚颙若。' },
      '100101': { symbol: '䷔', name: '火雷噬嗑', text: '亨，利用狱。' },
      '101001': { symbol: '䷕', name: '山火贲', text: '亨，小利有攸往。' },
      '000001': { symbol: '䷖', name: '山地剥', text: '不利有攸往。' },
      '100000': { symbol: '䷗', name: '地雷复', text: '亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。' },
      '111001': { symbol: '䷘', name: '天雷无妄', text: '元亨利贞。其匪正有眚，不利有攸往。' },
      '100111': { symbol: '䷙', name: '山天大畜', text: '利贞，不家食吉，利涉大川。' },
      '100001': { symbol: '䷚', name: '山雷颐', text: '贞吉。观颐，自求口实。' },
      '011110': { symbol: '䷛', name: '泽风大过', text: '栋桡，利有攸往，亨。' },
      '010010': { symbol: '䷜', name: '坎为水', text: '习坎，有孚，维心亨，行有尚。' },
      '101101': { symbol: '䷝', name: '离为火', text: '利贞，亨。畜牝牛，吉。' },
      '001110': { symbol: '䷞', name: '泽山咸', text: '亨，利贞，取女吉。' },
      '011100': { symbol: '䷟', name: '雷风恒', text: '亨，无咎，利贞，利有攸往。' },
      '001111': { symbol: '䷠', name: '天山遁', text: '亨，小利贞。' },
      '111100': { symbol: '䷡', name: '雷天大壮', text: '利贞。' },
      '000101': { symbol: '䷢', name: '火地晋', text: '康侯用锡马蕃庶，昼日三接。' },
      '101000': { symbol: '䷣', name: '地火明夷', text: '利艰贞。' },
      '101011': { symbol: '䷤', name: '风火家人', text: '利女贞。' },
      '110101': { symbol: '䷥', name: '火泽睽', text: '小事吉。' },
      '001010': { symbol: '䷦', name: '水山蹇', text: '利西南，不利东北。利见大人，贞吉。' },
      '010100': { symbol: '䷧', name: '雷水解', text: '利西南，无所往，其来复吉。有攸往，夙吉。' },
      '100011': { symbol: '䷨', name: '山泽损', text: '有孚，元吉，无咎可贞，利有攸往。' },
      '110001': { symbol: '䷩', name: '风雷益', text: '利有攸往，利涉大川。' },
      '111110': { symbol: '䷪', name: '泽天夬', text: '扬于王庭，孚号有厉，告自邑，不利即戎，利有攸往。' },
      '011111': { symbol: '䷫', name: '天风姤', text: '女壮，勿用取女。' },
      '000110': { symbol: '䷬', name: '泽地萃', text: '亨。王假有庙，利见大人，亨，利贞。用大牲吉，利有攸往。' },
      '011000': { symbol: '䷭', name: '地风升', text: '元亨，用见大人，勿恤，南征吉。' },
      '010110': { symbol: '䷮', name: '泽水困', text: '亨，贞，大人吉，无咎，有言不信。' },
      '011010': { symbol: '䷯', name: '水风井', text: '改邑不改井，无丧无得，往来井井。' },
      '101110': { symbol: '䷰', name: '泽火革', text: '己日乃孚，元亨利贞，悔亡。' },
      '011101': { symbol: '䷱', name: '火风鼎', text: '元吉，亨。' },
      '100100': { symbol: '䷲', name: '震为雷', text: '亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。' },
      '001001': { symbol: '䷳', name: '艮为山', text: '艮其背，不获其身，行其庭，不见其人，无咎。' },
      '001011': { symbol: '䷴', name: '风山渐', text: '女归吉，利贞。' },
      '110100': { symbol: '䷵', name: '雷泽归妹', text: '征凶，无攸利。' },
      '101100': { symbol: '䷶', name: '雷火丰', text: '亨。王假之，勿忧，宜日中。' },
      '001101': { symbol: '䷷', name: '火山旅', text: '小亨，旅贞吉。' },
      '110110': { symbol: '䷸', name: '巽为风', text: '小亨，利有攸往，利见大人。' },
      '011011': { symbol: '䷹', name: '兑为泽', text: '亨，利贞。' },
      '110010': { symbol: '䷺', name: '风水涣', text: '亨。王假有庙，利涉大川，利贞。' },
      '010011': { symbol: '䷻', name: '水泽节', text: '亨。苦节不可贞。' },
      '110011': { symbol: '䷼', name: '风泽中孚', text: '豚鱼吉，利涉大川，利贞。' },
      '001100': { symbol: '䷽', name: '雷山小过', text: '亨，利贞，可小事，不可大事。飞鸟遗之音，不宜上宜下，大吉。' },
      '101010': { symbol: '䷾', name: '水火既济', text: '亨小，利贞。初吉终乱。' },
      '010101': { symbol: '䷿', name: '火水未济', text: '亨。小狐汔济，濡其尾，无攸利。' }
    },

    // 农历月份名称
    lunarMonths: ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'],

    // 农历日期名称
    lunarDays: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
  }
})

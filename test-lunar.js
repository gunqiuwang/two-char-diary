const { solarToLunar } = require('./miniprogram/utils/lunar.js');

const tests = [
  { args: [2024, 2, 10], expected: '甲辰年 正月初一', desc: 'Chinese New Year 2024' },
  { args: [2024, 1, 1], expected: '癸卯年 冬月二十', desc: '2024-01-01' },
  { args: [2025, 1, 29], expected: '乙巳年 正月初一', desc: 'Chinese New Year 2025' },
  { args: [2026, 7, 10], expected: null, desc: 'Audit date 2026-07-10' },
  { args: [2000, 1, 1], expected: '己卯年 冬月廿五', desc: 'Millennium 2000-01-01' },
  { args: [1990, 1, 1], expected: '己巳年 腊月初五', desc: '1990-01-01' },
  { args: [1900, 1, 31], expected: '庚子年 正月初一', desc: 'Base date 1900-01-31' },
  { args: [2050, 12, 31], expected: null, desc: 'Upper limit 2050-12-31' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = solarToLunar(...t.args);
  const [y, m, d] = t.args;
  const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const status = t.expected
    ? (result.fullText === t.expected ? 'PASS' : 'FAIL')
    : 'INFO';

  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;

  console.log(`[${status}] ${dateStr} (${t.desc})`);
  console.log(`  Result:   ${result.fullText}`);
  if (t.expected) console.log(`  Expected: ${t.expected}`);
  console.log(`  Detail: year=${result.lunarYear} month=${result.lunarMonth} day=${result.lunarDay} leap=${result.isLeap} animal=${result.animal}`);
  console.log();
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${tests.length - passed - failed} info`);
process.exit(failed > 0 ? 1 : 0);

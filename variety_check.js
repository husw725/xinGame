// variety_check.js — 章节多样性检查
// 防止"新章节=旧章节换皮"：逐项对比各章的结构，雷同项过多就报警
const { CHAPTERS, CH2_RIDDLE } = require('./js/data.js');
const fs = require('fs');
const game = fs.readFileSync('./js/game.js', 'utf8');

let warn = 0;
const same = (label, a, b) => {
  const eq = JSON.stringify(a) === JSON.stringify(b);
  console.log(`  ${eq ? '⚠ 雷同' : '✓ 不同'}  ${label}`);
  if (eq) warn++;
  return eq;
};

console.log('=== 第1章 vs 第2章 结构对比 ===\n');
const [c1, c2] = CHAPTERS;

// 地图拓扑：用"每行可走格数"的形状指纹比较
const shape = c => c.map.map(r => (r.match(/[^WTrwdfkCP~]/g) || []).length);
const corr = (a, b) => {
  const n = Math.min(a.length, b.length);
  const ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return num / Math.sqrt(da * db);
};
const r = corr(shape(c1), shape(c2));
console.log(`  ${r > 0.8 ? '⚠ 雷同' : '✓ 不同'}  地图拓扑（形状相关系数 ${r.toFixed(2)}，>0.8 视为换皮）`);
if (r > 0.8) warn++;

same('房屋布局', Object.values(c1.houses).map(h => h.rows), Object.values(c2.houses).map(h => h.rows));
same('宝箱锁类型', c1.locks.map(l => l.kind), c2.locks.map(l => l.kind));
same('谜题机制', c1.puzzle.kind, c2.puzzle.kind);
same('NPC角色分布', Object.values(c1.npcs).map(n => n.role), Object.values(c2.npcs).map(n => n.role));

// 委托类型：取物 vs 传话
const fetch1 = /GS\.quest\.dodo/.test(game);
const relay2 = /questRelay/.test(game);
console.log(`  ${fetch1 && relay2 ? '✓ 不同' : '⚠ 雷同'}  委托类型（第1章取物 / 第2章传话）`);
if (!(fetch1 && relay2)) warn++;

// 线索机制：数字口令 vs 逻辑推理
const hasCode = c1.locks.some(l => l.kind === 'code');
const hasRiddle = c2.locks.some(l => l.kind === 'riddle');
console.log(`  ${hasCode && hasRiddle ? '✓ 不同' : '⚠ 雷同'}  线索机制（第1章凑数字 / 第2章逻辑推理）`);
if (!(hasCode && hasRiddle)) warn++;

// 推理题必须有唯一解
const stmts = [n => n === 3, n => n !== 6, n => n !== 3];
const sol = CH2_RIDDLE.candidates.filter(n => stmts.filter(f => f(n)).length === 1);
if (sol.length !== 1 || sol[0] !== CH2_RIDDLE.answer) {
  console.log(`  ✗ 推理题解不唯一或答案不符: ${sol}`); process.exit(1);
}
console.log(`  ✓ 推理题唯一解 = ${sol[0]}`);

console.log(`\n共 ${warn} 项雷同。`);
if (warn >= 3) { console.log('✗ 雷同项过多，新章节读起来会像换皮'); process.exit(1); }
console.log('✅ 章节差异度合格');

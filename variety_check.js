// variety_check.js — 章节多样性检查
// 防止"新章节=旧章节换皮"：逐项对比各章的结构，雷同项过多就报警。
// 原来只比第1章 vs 第2章，加第3章时它照样通过 —— 现在改成所有章两两比。
const { CHAPTERS, CH2_RIDDLE, CH3_CLOCKLOCK } = require('./js/data.js');
const fs = require('fs');
const game = fs.readFileSync('./js/game.js', 'utf8');

// 地图拓扑：用"每行可走格数"的形状指纹比较
const shape = c => c.map.map(r => (r.match(/[^WTrwdfkCP~]/g) || []).length);
const corr = (a, b) => {
  const n = Math.min(a.length, b.length);
  const ma = a.slice(0, n).reduce((s, v) => s + v, 0) / n, mb = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return num / Math.sqrt(da * db);
};

let fail = 0;
// 每一对章节独立算雷同项，任何一对雷同 ≥3 项就算换皮
for (let i = 0; i < CHAPTERS.length; i++) {
  for (let j = i + 1; j < CHAPTERS.length; j++) {
    const a = CHAPTERS[i], b = CHAPTERS[j];
    console.log(`\n=== 第${a.n}章「${a.name}」 vs 第${b.n}章「${b.name}」 ===\n`);
    let warn = 0;
    const same = (label, x, y) => {
      const eq = JSON.stringify(x) === JSON.stringify(y);
      console.log(`  ${eq ? '⚠ 雷同' : '✓ 不同'}  ${label}`);
      if (eq) warn++;
    };

    const r = corr(shape(a), shape(b));
    console.log(`  ${r > 0.8 ? '⚠ 雷同' : '✓ 不同'}  地图拓扑（相关系数 ${r.toFixed(2)}，>0.8 视为换皮）`);
    if (r > 0.8) warn++;

    same('房屋布局', Object.values(a.houses).map(h => h.rows), Object.values(b.houses).map(h => h.rows));
    same('宝箱锁类型', a.locks.map(l => l.kind), b.locks.map(l => l.kind));
    same('谜题机制', a.puzzle.kind, b.puzzle.kind);
    same('NPC角色分布', Object.values(a.npcs).map(n => n.role).sort(), Object.values(b.npcs).map(n => n.role).sort());
    same('商店货单', a.shop, b.shop);
    same('怪物图鉴', a.dex, b.dex);

    console.log(`  → 雷同 ${warn} 项`);
    if (warn >= 3) { console.log(`  ✗ 第${a.n}章和第${b.n}章太像了`); fail++; }
  }
}

// ---- 每章的招牌机制必须各不相同 ----
console.log('\n=== 招牌机制必须各章不同 ===\n');
const uniq = (label, list) => {
  const dup = list.filter((v, k) => list.indexOf(v) !== k);
  console.log(`  ${dup.length ? '✗' : '✓'} ${label}：${list.join(' / ')}`);
  if (dup.length) fail++;
};
uniq('谜题', CHAPTERS.map(c => c.puzzle.kind));
uniq('探索工具', CHAPTERS.map(c => c.tool));
// 每章至少有一种"别章没有"的锁
CHAPTERS.forEach((c, i) => {
  const others = CHAPTERS.filter((_, k) => k !== i).flatMap(x => x.locks.map(l => l.kind));
  const own = c.locks.map(l => l.kind).filter(k => !others.includes(k));
  console.log(`  ${own.length ? '✓' : '✗'} 第${c.n}章独有的锁：${own.join(' ') || '（没有，全和别章重复）'}`);
  if (!own.length) fail++;
});

// ---- 委托类型：每章一种，不许复用 ----
console.log('\n=== 委托类型 ===\n');
const quests = [
  ['第1章 取物', /GS\.quest\.dodo/],
  ['第2章 传话', /questRelay/],
  ['第3章 换物链', /questTick[\s\S]*?quest\.trade/],
];
quests.forEach(([label, re]) => {
  const ok = re.test(game);
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) fail++;
});

// ---- 线索机制：每章一种 ----
console.log('\n=== 线索机制 ===\n');
[['第1章 凑数字口令', 'code'], ['第2章 真假话推理', 'riddle'], ['第3章 时刻互相印证', 'clock']]
  .forEach(([label, kind]) => {
    const ch = CHAPTERS.findIndex(c => c.locks.some(l => l.kind === kind));
    console.log(`  ${ch >= 0 ? '✓' : '✗'} ${label}（在第${ch + 1}章）`);
    if (ch < 0) fail++;
  });

// ---- 推理题必须有唯一解 ----
console.log('\n=== 谜题答案唯一性 ===\n');
const stmts = [n => n === 3, n => n !== 6, n => n !== 3];
const sol = CH2_RIDDLE.candidates.filter(n => stmts.filter(f => f(n)).length === 1);
if (sol.length !== 1 || sol[0] !== CH2_RIDDLE.answer) {
  console.log(`  ✗ 第2章推理题解不唯一或答案不符: ${sol}`); fail++;
} else console.log(`  ✓ 第2章推理题唯一解 = ${sol[0]}`);

// 第3章钟面锁：三条线索里恰好两条指向同一时刻，那个才是答案
const key = t => t.h * 60 + t.m;
const votes = {};
// c3a: 时针指 16:00   c3b: 15:40 之后 5 分钟 = 15:45   c3c: 三点三刻 = 3:45 → 下午 15:45
[{ h: 16, m: 0 }, { h: 15, m: 45 }, { h: 15, m: 45 }].forEach(t => { votes[key(t)] = (votes[key(t)] || 0) + 1; });
const top = Object.entries(votes).sort((x, y) => y[1] - x[1]);
const winner = Number(top[0][0]);
if (top[0][1] !== 2 || top.filter(v => v[1] === top[0][1]).length !== 1) {
  console.log(`  ✗ 第3章钟面锁不是"恰好两票"：${JSON.stringify(votes)}`); fail++;
} else if (winner !== key(CH3_CLOCKLOCK.answer)) {
  console.log(`  ✗ 第3章钟面锁答案不符：两票指向 ${winner}，数据写的是 ${key(CH3_CLOCKLOCK.answer)}`); fail++;
} else console.log(`  ✓ 第3章钟面锁：恰好两票指向 ${CH3_CLOCKLOCK.answer.h}:${CH3_CLOCKLOCK.answer.m}`);
if (!CH3_CLOCKLOCK.candidates.some(t => key(t) === key(CH3_CLOCKLOCK.answer))) {
  console.log('  ✗ 第3章钟面锁：候选里没有正确答案'); fail++;
} else console.log('  ✓ 候选里包含正确答案');

if (fail) { console.log(`\n✗ ${fail} 处问题`); process.exit(1); }
console.log('\n✅ 各章结构差异度合格，招牌机制互不重复');

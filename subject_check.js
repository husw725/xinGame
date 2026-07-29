// subject_check.js — 学科覆盖检查
// 起因：第3章做完，三个怪全是时间题（纯数学），第4章刚写的克与千克也一样。
// 标题写着"数学+语文"，却连着好几章一个语文都没有。这里把它钉住。
const D = require('./js/data.js');

let bad = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };

// 题型 → 学科。和 data.js 里的 QSUBJ 一致，但这里独立列一份用来交叉核对：
// 两边不一致就说明有题型忘了登记
const CHINESE = ['chinese', 'liangci', 'antonym', 'duoyin'];

console.log('=== 每一章都要有语文题 ===\n');
D.CHAPTERS.forEach(C => {
  const mobs = C.dex.filter(k => k !== 'revenge').map(k => D.ENEMIES[k]).filter(Boolean);
  const kinds = mobs.map(e => ({ name: e.name, q: e.qtype }));
  // 小怪（非 Boss）里必须至少有一只考语文
  const nonBoss = kinds.filter(k => !D.ENEMIES[C.dex.find(x => D.ENEMIES[x] && D.ENEMIES[x].name === k.name)].boss);
  const zh = nonBoss.filter(k => CHINESE.includes(k.q));
  const math = nonBoss.filter(k => !CHINESE.includes(k.q));
  console.log(`  第${C.n}章「${C.name}」`);
  kinds.forEach(k => console.log(`      ${k.name.padEnd(7)} ${k.q}`));
  ok(zh.length >= 1, `    有 ${zh.length} 只语文怪（至少 1 只）`);
  ok(math.length >= 1, `    有 ${math.length} 只数学怪（至少 1 只）`);
});

console.log('\n=== Boss 的混合题型要同时含数学和语文 ===\n');
// Boss 是一章的总检验，只考一科等于漏掉一半
D.CHAPTERS.forEach(C => {
  const boss = D.ENEMIES[C.dex.find(k => D.ENEMIES[k] && D.ENEMIES[k].boss)];
  if (!boss) { console.log(`  ✗ 第${C.n}章找不到 Boss`); bad++; return; }
  // 抽 300 道，看实际出到的学科
  const subs = new Set();
  for (let i = 0; i < 300; i++) subs.add(D.getQuestion(boss.qtype).subj);
  const has = [...subs].sort().join('+');
  const okk = subs.has('math') && subs.has('chinese');
  console.log(`  ${okk ? '✓' : '✗'} 第${C.n}章 ${boss.name}（${boss.qtype}）实际出到：${has}`);
  if (!okk) bad++;
});

console.log('\n=== 每个题型都要登记学科（不能靠猜题面）===\n');
// 曾经的 bug：战斗里用 /[+−×]/ 猜题面，时间题"3 时 = ? 分"没有运算符被判成语文，
// 字典护符会错误加成。现在题目自带 subj —— 这里逐个题型验一遍
const ALL_QTYPES = [...new Set(Object.values(D.ENEMIES).map(e => e.qtype))];
ALL_QTYPES.forEach(t => {
  const subs = new Set();
  for (let i = 0; i < 200; i++) {
    const q = D.getQuestion(t);
    if (!q.subj) { console.log(`  ✗ ${t} 出的题没有 subj 标记`); bad++; return; }
    subs.add(q.subj);
  }
  const bogus = [...subs].filter(x => x !== 'math' && x !== 'chinese');
  console.log(`  ${bogus.length ? '✗' : '✓'} ${t.padEnd(10)} → ${[...subs].sort().join('+')}`);
  if (bogus.length) bad++;
});

// 护符加成必须落到对的学科上
console.log('\n=== 护符的学科加成 ===\n');
const boosts = Object.entries(D.GEAR).filter(([, g]) => g.boost).map(([k, g]) => ({ k, n: g.name, b: g.boost }));
boosts.forEach(g => {
  const okk = g.b === 'math' || g.b === 'chinese';
  console.log(`  ${okk ? '✓' : '✗'} ${g.n} 加成 ${g.b}`);
  if (!okk) bad++;
});
ok(boosts.some(g => g.b === 'math'), '有数学护符');
ok(boosts.some(g => g.b === 'chinese'), '有语文护符');

// game.js 里不许再出现"猜题面"的写法
const src = require('fs').readFileSync('js/game.js', 'utf8');
ok(!/\/\[\+−×\]\/\.test\(this\.q\.text\)/.test(src),
  'game.js 已不再用运算符猜学科');
ok(/const subject = this\.q\.subj/.test(src), 'game.js 用题目自带的 subj');

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ 每章都有语文和数学，Boss 两科都考，学科判定不靠猜');

// subject_check.js — 学科覆盖检查
// 起因：第3章做完，三个怪全是时间题（纯数学），第4章刚写的克与千克也一样。
// 标题写着"数学+语文"，却连着好几章一个语文都没有。这里把它钉住。
const D = require('./js/data.js');

let bad = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };

// 从 data.js 导入 QSUBJ —— 这里原来自己列了一份语文题型清单，
// 加了 xingjin 之后没跟上，第5章的语文怪被当成数学怪。抄一份就会漂。
const CHINESE = Object.entries(D.QSUBJ).filter(([, v]) => v === 'chinese').map(([k]) => k);
console.log('语文题型：' + CHINESE.join(' ') + '\n');

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

// ---- 语文题的干扰项不许送分 ----
// 曾经写过一条：答案是「关」，干扰项里放了「关心」—— 一眼就能排除，白给
console.log('\n=== 语文题干扰项合法性 ===\n');
let dbad = 0;
const ZH_TYPES = CHINESE;
ZH_TYPES.forEach(t => {
  const seen = new Set();
  let n = 0;
  for (let i = 0; i < 600; i++) {
    const q = D.getQuestion(t);
    const k = q.text + '|' + q.answer;
    if (seen.has(k)) continue;
    seen.add(k); n++;
    const wrong = q.options.filter(o => o !== q.answer);
    // 干扰项不能包含正确答案（也不能被正确答案包含）—— 那等于直接指出来。
    // 只对汉字选项生效：拼音里 cháng 天然包含 háng，那正是要孩子分辨的地方，不算送分。
    const cjk = t => /^[一-龥]+$/.test(t);
    const leak = cjk(q.answer)
      ? wrong.filter(o => cjk(o) && (o.includes(q.answer) || q.answer.includes(o)))
      : [];
    if (leak.length) {
      console.log(`  ✗ ${t}：「${q.text.replace(/\n/g, ' ')}」答案「${q.answer}」，干扰项 ${JSON.stringify(leak)} 和答案互相包含`);
      dbad++;
    }
    // 拼音题的选项长度差太多也是送分（"zhòng" vs "山"）
    if (t === 'duoyin' && wrong.some(o => /[一-龥]/.test(o))) {
      console.log(`  ✗ ${t}：拼音题里混进了汉字选项 ${JSON.stringify(wrong)}`); dbad++;
    }
  }
  console.log(`  ${dbad ? ' ' : '✓'} ${t.padEnd(9)} 查了 ${n} 种不同题面`);
});
if (dbad) { console.log(`\n✗ 干扰项 ${dbad} 处送分`); process.exit(1); }
console.log('  ✓ 所有语文题的干扰项都不泄露答案');

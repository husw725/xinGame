// mark_check.js — 头顶标记正确性检查
// 传话委托要来回跑三趟，标记必须每一步都指对人，否则孩子不知道该找谁。
// 早先这里自己复刻了一份 npcMark，结果加了 role:'info' 的 NPC 之后复刻件
// 走 default 返回 null，新 NPC 一个都没测到 —— 现在直接调 game.js 里的真函数。
const { makeCtx } = require('./stub.js');

const ctx = makeCtx();
const World = ctx.__get('World');
const CHAPTERS = ctx.__get('CHAPTERS');
const loadChapter = ctx.__get('loadChapter');
const w = new World();

let bad = 0;

// 用真的 npcMark 算出本章所有 NPC 的标记
function marksOf(ch, state) {
  loadChapter(ch);
  Object.assign(ctx.GS, { chapter: ch }, state);
  const NPCS = ctx.__get('NPCS');
  const got = {};
  Object.keys(NPCS).forEach(id => {
    const m = w.npcMark(id);
    if (m) got[NPCS[id].name] = m;
  });
  return got;
}

// 比对时按名字排序：NPCS 里的键顺序不该影响正确性
const sortKeys = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
const check = (label, ch, state, want) => {
  const got = marksOf(ch, state);
  const g = sortKeys(got), wt = sortKeys(want);
  const ok = g === wt;
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) { console.log(`      期望 ${wt}`); console.log(`      实际 ${g}`); bad++; }
};

// 各章"所有该挂 ! 的人都聊过了"的 talked 列表
function allTalked(ch) {
  loadChapter(ch);
  const NPCS = ctx.__get('NPCS');
  const out = [];
  Object.keys(NPCS).forEach(id => { out.push(ch + ':' + id); out.push(ch + ':' + id + ':b'); });
  return out;
}

const base = ch => ({ clues: [], quest: {}, talked: [], flags: {}, frags: [], chSave: {} });

console.log('=== 第2章 传话委托：标记要一步步指对人 ===\n');
const T2 = allTalked(1);
const allClues2 = ['c2a', 'c2b', 'c2c', 'c2d'];

check('刚到镇上（谁都没聊过）', 1, base(1),
  { 账房总管: '!', 账房先生: '!', 卖糖的姐姐: '!', 小满: '!', 扫地的老人: '!', 阿力: '!', 迷路的货郎: '!',
    摆石子的女孩: '!', 靠墙的守卫: '!', 修门板的木匠: '!' });
check('接了委托 → 该去找阿力', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'ask_boy' } }, { 小满: '?', 阿力: '!' });
check('阿力说完 → 该回去找小满', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'back_girl' } }, { 小满: '!', 阿力: '?' });
check('小满托话 → 再去找阿力', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'back_boy' } }, { 小满: '?', 阿力: '!' });
check('和好了 → 都不用管', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'done' } }, {});

console.log('\n=== 线索 NPC：问过就不再标 ===\n');
check('只问了账房先生', 1,
  { ...base(1), talked: T2, clues: ['c2a'], quest: { step: 'done' } },
  { 卖糖的姐姐: '!', 扫地的老人: '!', 迷路的货郎: '!' });
check('三句话都问齐', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'done' } }, {});

console.log('\n=== 第1章 ===\n');
const T1 = allTalked(0);
const c1 = ['code1', 'code2', 'bridge'];
check('刚开局', 0, base(0),
  { 村长: '!', 铁匠老王: '!', 卖水的婶婶: '!', 朵朵: '!', 守林的爷爷: '!', 石头: '!', 沙漠旅人: '!',
    '巡逻的大哥': '!', '抱课本的妹妹': '!', '圆盘旁的奶奶': '!' });
check('接了朵朵的委托 → 等你去找', 0,
  { ...base(0), talked: T1, clues: c1, quest: { dodo: 'taken' } }, { 朵朵: '?' });
check('捡到作业本 → 回去交', 0,
  { ...base(0), talked: T1, clues: c1, quest: { dodo: 'found' } }, { 朵朵: '!' });
check('打完Boss → 长老指路下一章', 0,
  { ...base(0), talked: T1, clues: [...c1, 'code3'], quest: { dodo: 'done' }, flags: { boss: true } },
  { 村长: '!' });

console.log('\n=== 第3章 换物链：五个状态要一步步指对人 ===\n');
const T3 = allTalked(2);
const allClues3 = ['c3a', 'c3b', 'c3c', 'c3d'];
// errand:'done' 把跨章委托摘掉，专注看换物链
const b3 = st => ({ ...base(2), talked: T3, clues: allClues3, quest: { trade: st },
                    errand: 'done', parts: ['gear', 'wire', 'glass'] });

check('刚到钟楼（谁都没聊过）', 2, base(2),
  { 守钟人: '!', 钟表匠: '!', 送奶的婶婶: '!', 迷路的报时人: '!', 滴答: '!',
    修钟的老人: '!', 小铃: '!', 塔下的更夫: '!', 背书包的男孩: '!', 圆盘旁的奶奶: '!',
    大钟守夜人: '!' });
check('接了委托 → 该去问小铃', 2, b3('want_bell'), { 滴答: '?', 小铃: '!' });
check('小铃要钢丝 → 该去找拾荒小子', 2, b3('need_wire'), { 滴答: '?', 小铃: '?', 拾荒的小子: '!' });
check('钢丝到手 → 回去找小铃换', 2, b3('has_wire'), { 滴答: '?', 小铃: '!' });
check('铃舌到手 → 交给滴答', 2, b3('has_bell'), { 滴答: '!' });
check('委托完成 → 都不用管', 2, b3('done'), {});

console.log('\n=== 跨章委托：零件在哪一章，那一章就得挂 ! ===\n');
// 这是"回去"的唯一提示。少挂一个，玩家踩了传送阵也不知道该找谁
const er = (st, parts) => ({ ...base(2), talked: T3, clues: allClues3,
                             quest: { trade: 'done' }, errand: st, parts });
check('还没接：守夜人挂 !', 2, er(null, []), { 大钟守夜人: '!' });
check('接了、零件全没拿：守夜人转 ?', 2, er('given', []),
  { 大钟守夜人: '?', 拾荒的小子: '!' });
check('三样齐了：守夜人转回 !', 2, er('given', ['gear', 'wire', 'glass']), { 大钟守夜人: '!' });
check('交完了：不再标', 2, er('done', ['gear', 'wire', 'glass']), {});
// 回到第1章：铁匠身上压着铜齿轮
check('回第1章，铁匠要挂 !（有铜齿轮）', 0,
  { ...base(0), talked: T1, clues: c1, quest: { dodo: 'done' }, flags: { boss: true },
    errand: 'given', parts: [] },
  { 村长: '!', 铁匠老王: '!' });
check('铜齿轮拿过了，铁匠不再标', 0,
  { ...base(0), talked: T1, clues: c1, quest: { dodo: 'done' }, flags: { boss: true },
    errand: 'given', parts: ['gear'] },
  { 村长: '!' });
// 回到第2章：扫地的老人收着铜丝
check('回第2章，扫地老人要挂 !（有铜丝）', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'done' },
    errand: 'given', parts: ['gear'] },
  { 扫地的老人: '!' });
check('铜丝拿过了，扫地老人不再标', 1,
  { ...base(1), talked: T2, clues: allClues2, quest: { step: 'done' },
    errand: 'given', parts: ['gear', 'wire'] }, {});

console.log('\n=== 开场说明分给的 NPC（role:info）===\n');
// 这几位承接了原来开场一口气念完的说明，必须一开局就挂 !，否则孩子不知道该问谁
// 每一章都要有至少3位承接说明的 NPC
[0, 1, 2].forEach(ch => {
  loadChapter(ch);
  const n = Object.values(ctx.__get('NPCS')).filter(x => x.role === 'info').length;
  console.log(`  ${n >= 3 ? '✓' : '✗'} 第${ch + 1}章有 ${n} 位 info NPC`);
  if (n < 3) { console.log('  ✗ 开场说明至少要拆给3位，否则等于没拆'); bad++; }
});
loadChapter(0);
const info1 = Object.entries(ctx.__get('NPCS')).filter(([, n]) => n.role === 'info');
info1.forEach(([id, n]) => {
  Object.assign(ctx.GS, { chapter: 0, talked: [], flags: {}, clues: [], quest: {} });
  const m1 = w.npcMark(id);
  Object.assign(ctx.GS, { chapter: 0, talked: ['0:' + id], flags: {}, clues: [], quest: {} });
  const m2 = w.npcMark(id);
  const okk = m1 === '!' && m2 === null;
  console.log(`  ${okk ? '✓' : '✗'} ${n.name}：没聊过=${m1} 聊过=${m2}`);
  if (!okk) bad++;
  if (!n.lines || !n.lines.length) { console.log(`  ✗ ${n.name} 没有台词`); bad++; }
});

// 打完魔王换台词的，! 要重新亮一次
console.log('\n  打完魔王后有新台词的，标记要重新亮起来：');
info1.filter(([, n]) => n.lines2).forEach(([id, n]) => {
  Object.assign(ctx.GS, { chapter: 0, talked: ['0:' + id], flags: { boss: true }, clues: [], quest: {} });
  const m = w.npcMark(id);
  console.log(`  ${m === '!' ? '✓' : '✗'} ${n.name}：通关后重新挂 ${m}`);
  if (m !== '!') bad++;
  Object.assign(ctx.GS, { chapter: 0, talked: ['0:' + id, '0:' + id + ':b'], flags: { boss: true }, clues: [], quest: {} });
  const m2 = w.npcMark(id);
  console.log(`  ${m2 === null ? '✓' : '✗'} ${n.name}：新台词也听过 → ${m2}`);
  if (m2 !== null) bad++;
});

// 纯服务 NPC 永远不标
console.log('');
[0, 1, 2].forEach(ch => {
  loadChapter(ch);
  Object.assign(ctx.GS, { chapter: ch, clues: [], quest: {}, talked: [], flags: {} });
  const NPCS = ctx.__get('NPCS');
  Object.entries(NPCS).forEach(([id, npc]) => {
    if (npc.role === 'shop' || npc.role === 'teacher') {
      const m = w.npcMark(id);
      if (m) { console.log(`✗ ${npc.name}（纯服务）不该有标记，却是 ${m}`); bad++; }
    }
  });
});

if (bad) { console.log(`\n✗ ${bad} 处标记不对`); process.exit(1); }
console.log('\n✅ 两章所有 NPC 的标记在各进度下都指对了人（用的是 game.js 里的真 npcMark）');

// ---- 开场不许再堆信息 ----
// 原来一口气念5页，孩子记不住。约束住页数，防止以后又往回加。
const fs = require('fs');
const src = fs.readFileSync('js/game.js', 'utf8');
console.log('\n=== 开场页数 ===\n');
let ibad = 0;
const introBlock = src.slice(src.indexOf('// --- 开场剧情 ---'), src.indexOf('banner(txt)'));
[['第2章', /'（回廊的镇子很安静。）',([\s\S]*?)\], \(\)/], ['第1章', /'暑假第一天([\s\S]*?)\], \(\)/]]
  .forEach(([label, re]) => {
    const m = introBlock.match(re);
    if (!m) { console.log(`  ✗ ${label} 开场文案没找到`); ibad++; return; }
    const pages = (m[0].match(/'/g) || []).length / 2;
    const ok = pages <= 3;
    console.log(`  ${ok ? '✓' : '✗'} ${label} 开场 ${pages} 页（上限 3 页，其余交给 NPC）`);
    if (!ok) ibad++;
  });

// 台词不能长到印出框外：对话框每页约 3 行 × 每行约 14 个全角字
console.log('\n=== info NPC 台词长度（框内放得下）===\n');
[0, 1, 2].forEach(ch => {
  loadChapter(ch);
  Object.entries(ctx.__get('NPCS')).filter(([, n]) => n.role === 'info').forEach(([, n]) => {
    [].concat(n.lines || [], n.lines2 || []).forEach(line => {
      const worst = Math.max(...line.split('\n').map(s => s.length));
      const rows = line.split('\n').length;
      if (rows > 3 || worst > 22) {
        console.log(`  ✗ ${n.name}：${rows}行/最长${worst}字 —— ${line.replace(/\n/g, '⏎')}`);
        ibad++;
      }
    });
  });
});
if (!ibad) console.log('  ✓ 全部台词都在 3 行 / 22 字以内');
if (ibad) { console.log(`\n✗ 开场/台词 ${ibad} 处问题`); process.exit(1); }
console.log('\n✅ 开场已精简，说明分散到 NPC，台词长度都放得下');

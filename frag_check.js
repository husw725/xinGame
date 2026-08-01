// frag_check.js — 记忆碎片可收集性校验
// 起因：实测第2章只找得到 6 张。查下来是三个 bug：
//   1) 隐藏点编号写死成 5+n，第2章有 4 个隐藏点 → 第4个算出 8，
//      而 fragGlobal(1,8)=16 正好是第3章的第0页 —— 本章永远差一张，还污染下一章
//   2) 第3章同样溢出
//   3) 第4、5章反过来：编号 2 没有任何来源，也永远差一张
// 日记是整条暗线，少一页就断了。这里逐章把每一页的来源都列出来。
const D = require('./js/data.js');
const { makeCtx } = require('./stub.js');

let bad = 0;
const ok = (cond, msg, extra) => {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) { bad++; if (extra !== undefined) console.log(`      ${extra}`); }
};

console.log('=== 每章 8 页都要有出处，且不重不漏 ===\n');
D.CHAPTERS.forEach(C => {
  D.loadChapter(D.CHAPTERS.indexOf(C));
  const slots = D.fragSlots(C);
  const src = {};                       // 本地编号 → 出处
  slots.p.forEach(i => { src[i] = '地上'; });
  slots.h.forEach(i => { src[i] = '隐藏处(需工具)'; });
  (C.chests || []).forEach(t => { if (t.kind === 'frag') src[t.idx] = (src[t.idx] ? '★冲突/' : '') + '宝箱'; });
  ((C.puzzle && C.puzzle.rooms) || []).forEach(r => {
    if (r.reward && r.reward.kind === 'frag') src[r.reward.idx] = (src[r.reward.idx] ? '★冲突/' : '') + '谜题';
  });

  console.log(`  第${C.n}章「${C.name}」`);
  const miss = [], conflict = [];
  for (let i = 0; i < 8; i++) {
    const s = src[i];
    if (!s) miss.push(i);
    if (s && s.startsWith('★冲突')) conflict.push(i);
    console.log(`      第${i + 1}页  ${s || '★★ 没有任何出处'}`);
  }
  ok(!miss.length, `    8 页都有出处`, miss.length ? `缺：第 ${miss.map(i => i + 1).join('、')} 页` : '');
  ok(!conflict.length, `    没有两个来源抢同一页`, conflict.length ? `冲突：${conflict}` : '');

  // 地图上的 p/h 格数必须正好等于空出来的编号数，多了就发不出去，少了就有页没人发
  const tiles = slots.np + slots.nh;
  ok(tiles === slots.free.length,
    `    地图上 ${slots.np} 个地上点 + ${slots.nh} 个隐藏点 = ${tiles}，空编号 ${slots.free.length} 个`,
    tiles !== slots.free.length ? '两边对不上，一定有页拿不到或发重复' : '');

  // 编号绝不能越界到下一章
  const over = [...slots.p, ...slots.h].filter(i => i === undefined || i < 0 || i > 7);
  ok(!over.length, `    编号都在 0-7 之内（不会串到下一章）`, over.length ? `越界：${over}` : '');

  // 文案也要有 8 条
  ok((C.frags || []).length === 8, `    日记文案有 ${(C.frags || []).length} 条`);
});

// ---- 全书连号：56 页（或 8×章数）不能有洞 ----
console.log('\n=== 全书页码连续 ===\n');
const total = D.CHAPTERS.length * 8;
const allG = [];
D.CHAPTERS.forEach((C, ci) => {
  const slots = D.fragSlots(C);
  const idx = [...slots.p, ...slots.h,
    ...(C.chests || []).filter(t => t.kind === 'frag').map(t => t.idx),
    ...((C.puzzle && C.puzzle.rooms) || []).filter(r => r.reward && r.reward.kind === 'frag').map(r => r.reward.idx)];
  idx.forEach(i => allG.push(D.fragGlobal(ci, i)));
});
allG.sort((a, b) => a - b);
const dup = allG.filter((v, i) => allG.indexOf(v) !== i);
ok(allG.length === total, `一共 ${allG.length} 处出处（应为 ${total}）`);
ok(!dup.length, '没有两章抢同一个全局页码', dup.length ? `重复：${dup}` : '');
for (let g = 0; g < total; g++) {
  if (!allG.includes(g)) { console.log(`  ✗ 全局第 ${g + 1} 页（第${Math.floor(g / 8) + 1}章第${g % 8 + 1}页）没有出处`); bad++; }
}
// fragText 每一页都要读得出来
for (let g = 0; g < total; g++) {
  if (!D.fragText(g)) { console.log(`  ✗ 全局第 ${g + 1} 页没有文案`); bad++; }
}
if (!bad) console.log(`  ✓ ${total} 页全部有出处、有文案、不重号`);

// ---- 打完 Boss 前拿得到多少？----
// 隐藏点要本章工具（Boss 掉落），所以通关前拿不到。这本身是设计，
// 但要保证"通关前能拿到的"不至于太少，否则孩子会以为自己漏了
console.log('\n=== 打 Boss 前能拿到几页 ===\n');
D.CHAPTERS.forEach(C => {
  const slots = D.fragSlots(C);
  const before = slots.p.length
    + (C.chests || []).filter(t => t.kind === 'frag').length
    + ((C.puzzle && C.puzzle.rooms) || []).filter(r => r.reward && r.reward.kind === 'frag').length;
  console.log(`  第${C.n}章：通关前 ${before}/8，剩 ${8 - before} 页要用${C.hiddenToolName}回头找`);
  if (before < 3) { console.log('    ✗ 通关前能拿的太少，孩子会以为日记坏了'); bad++; }
  if (8 - before > 5) { console.log('    ✗ 要回头找的太多'); bad++; }
});

// ---- game.js 不许再写死编号 ----
const src2 = require('fs').readFileSync('js/game.js', 'utf8');
console.log('');
ok(!/fragGlobal\(GS\.chapter, 5 \+ hidN/.test(src2), 'game.js 不再把隐藏点编号写死成 5+n');
ok(/SLOTS\.p\[fragN\+\+\]/.test(src2) && /SLOTS\.h\[hidN\+\+\]/.test(src2), 'game.js 用 fragSlots 分配编号');

// ---- 真跑一遍 World.create，确认每章实际生成的编号 ----
console.log('\n=== 实跑 World.create，看真实发出去的编号 ===\n');
const ctx = makeCtx();
const World = ctx.__get('World');
const w = new World();
D.CHAPTERS.forEach((C, ci) => {
  ctx.__get('loadChapter')(ci);
  Object.assign(ctx.GS, {
    chapter: ci, flags: { intro: true, boss: false, puzzle: false },
    chests: [], locks: [], rooms: [], clues: [], quest: {}, talked: [], searched: {},
    frags: [], tools: [C.hiddenTool], pos: null, indoor: null, pool: [],
  });
  w.create();
  ctx.__flush(100);
  const got = [...Object.values(w.frags), ...Object.values(w.hidden)]
    .filter(v => typeof v === 'number').sort((a, b) => a - b);
  const want = [...D.fragSlots(C).p, ...D.fragSlots(C).h].map(i => D.fragGlobal(ci, i)).sort((a, b) => a - b);
  const same = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${same ? '✓' : '✗'} 第${C.n}章 地图上实际生成 ${JSON.stringify(got)}`);
  if (!same) { console.log(`      应该是 ${JSON.stringify(want)}`); bad++; }
  const outside = got.filter(g => Math.floor(g / 8) !== ci);
  if (outside.length) { console.log(`      ✗ 有编号跑到别章去了：${outside}`); bad++; }
  ctx.__shutdown();
});

console.log(bad ? `\n（前面已有 ${bad} 处问题）` : '\n✓ 每章 8 页都拿得到，编号不重不漏不串章');

// ---- 集齐之后要能读成一个故事 ----
// 目标不是"能列出40页"，是连起来读像一本书：页码抬头要去掉、章与章之间要有过渡、
// 每屏行数放得下、结尾要收得住。
console.log('\n=== 连起来读 ===\n');
const c2 = makeCtx();
const W2 = c2.__get('World');
const w2 = new W2();

function renderStory(frags) {
  c2.GS.frags = frags.slice();
  c2.GS.chapter = 0;
  c2.__get('loadChapter')(0);
  const out = [];
  w2.dialog = { say: l => out.push(...l), choice: () => {}, open: false };
  w2.handbook = () => {}; w2.readDiary = () => {};
  w2.diaryStory();
  return out;
}

const ALL = [];
for (let i = 0; i < D.TOTAL_FRAGS; i++) ALL.push(i);
const full = renderStory(ALL);

// 1) 正文里不许再出现"第X页："这种收集用的抬头
const heads = full.filter(s => /第[一二三四五六七八九十百]+页：/.test(s));
ok(!heads.length, '连读时去掉了「第X页：」的抬头', heads[0]);
// 2) 也不该整屏都裹在「」里
const quoted = full.filter(s => /^「/.test(s) && /」$/.test(s));
ok(!quoted.length, '连读时去掉了外层「」', quoted[0]);
// 3) 每一章之间要有过渡句，否则五章拼一起还是五叠纸。
// 直接比对 FRAG_BRIDGE 本身，别用"含某个字"这种脆判据
// 第1章之后，每一章都必须有过渡句。不能先 filter(Boolean) —— 那等于
// 数据里写了 null 就自动豁免，少一句反而查不出来
let bridgeMiss = 0;
for (let ch = 1; ch < D.CHAPTERS.length; ch++) {
  const b = D.FRAG_BRIDGE[ch];
  if (!b) { console.log(`  ✗ 第${ch + 1}章没有过渡句（FRAG_BRIDGE[${ch}] 是空的）`); bridgeMiss++; }
  else if (!full.includes(b)) { console.log(`  ✗ 第${ch + 1}章的过渡句没出现在连读里`); bridgeMiss++; }
}
ok(!bridgeMiss, `第2~${D.CHAPTERS.length}章每章都有过渡句`);
// 4) 每屏行数放得下（对话框约 4 行，超了会缩字号断在奇怪的地方）
const tall = full.filter(s => s.split('\n').length > 4);
ok(!tall.length, '每屏都不超过 4 行', tall.length ? JSON.stringify(tall[0]) : '');
// 5) 首尾要立住
ok(/从第一张开始读/.test(full[0] || ''), '有开头的引子');
const tail = full.slice(-6).join('\n');
ok(/断了|更远的地方/.test(tail), '集齐后有收尾，而不是干巴巴一句"齐了"');
ok(!/整本都拼齐了。$/.test(tail), '收尾不是原来那句敷衍的「整本都拼齐了」');
// 6) 40 页的正文一句都不能漏
const body = full.join('\n');
let lost = 0;
for (let g = 0; g < D.TOTAL_FRAGS; g++) {
  const b = D.fragBody(g);
  if (!b) { console.log(`  ✗ 第${g + 1}页取不到正文`); bad++; continue; }
  const firstLine = b.split('\n')[0];
  if (!body.includes(firstLine)) { console.log(`  ✗ 第${g + 1}页没出现在连读里：${firstLine}`); lost++; }
}
ok(!lost, `40 页正文一句不漏`);

// 7) 缺页时要说清缺在哪、缺几页 —— 这是唯一的找页提示
const gappy = renderStory(ALL.filter(g => ![3, 4, 20].includes(g)));
const gapMarks = gappy.filter(s => /缺了 \d+ 页/.test(s));
ok(gapMarks.length >= 2, `缺页处标出了 ${gapMarks.length} 段空缺`, JSON.stringify(gapMarks));
ok(gappy.some(s => /还差 3 页/.test(s)), '结尾告诉你还差几页');
ok(!gappy.some(s => /断了|更远的地方/.test(s)), '没集齐就不给收尾（收尾是集齐的奖励）');

// 8) 一页都没有的章节要整章跳过，不能只剩一句过渡句
const onlyCh1 = renderStory([0, 1, 2, 3, 4, 5, 6, 7]);
ok(!onlyCh1.some(s => /纸最薄/.test(s)), '完全没捡到的章节不会只留一句过渡');

// 9) 全书页数必须跟得上章数
ok(D.TOTAL_FRAGS === D.CHAPTERS.length * 8,
  `全书 ${D.TOTAL_FRAGS} 页 = ${D.CHAPTERS.length} 章 × 8`);
const gsrc = require('fs').readFileSync('js/game.js', 'utf8');
ok(!/const TOTAL_FRAGS = \d+;/.test(require('fs').readFileSync('js/data.js', 'utf8')),
  'TOTAL_FRAGS 不是写死的数字（写死过 56，实际只有 40，永远集不齐）');
ok(/diaryStory\(\)/.test(gsrc) && /diaryPages\(\)/.test(gsrc), '日记有「连起来读」和「一页一页翻」两种读法');

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ 40 页连起来是一个故事：无页码抬头、有章节过渡、缺页标得出、集齐有收尾');

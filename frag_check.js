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

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ 每章 8 页都拿得到，编号不重不漏不串章');

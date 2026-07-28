// chapter_check.js — 章节往返 + Boss 格子 的正确性校验
// 三个曾经出错的地方：
//   1) Boss 和水晶挨着，从某些方向按 A 打不着
//   2) Boss 死了那两格还是看不见的墙
//   3) 章节之间来回走会清空宝箱/机关进度（能无限刷金币，或者第二章从头开始）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const D = require('./js/data.js');
const BLOCK_CHARS = 'TrwdfkCXBGDWP~';
const src = fs.readFileSync(path.join(__dirname, 'js/game.js'), 'utf8');

let bad = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };

// ---------- 1. Boss 四面都打得着 ----------
console.log('=== Boss 触发点：四面走过来都要能打 ===\n');
// 不复刻逻辑 —— 直接把 game.js 里的 isBossFront 抠出来跑，
// 否则改了真代码而校验还在测自己写的那份副本，等于没测。
const body = (src.match(/isBossFront\(x, y\) \{\n([\s\S]*?)\n  \}/) || [])[1];
ok(!!body, 'game.js 里找得到 isBossFront');
if (!body) process.exit(1);
const realIsBossFront = new Function('x', 'y', 'CHAPTER', 'self',
  body.replace(/\bthis\./g, 'self.'));
ok(/if \(!GS\.flags\.boss && this\.isBossFront\(nx, ny\)\)/.test(src),
  'interactFront 用的是 isBossFront，不是写死的坐标比较');

D.CHAPTERS.forEach((c, ci) => {
  D.loadChapter(ci);
  const M = D.MAP, bt = c.bossTile, ct = c.crystalTile;
  const isBossFront = (x, y) => realIsBossFront(x, y, c, { bossTile: bt });

  // 站得上去的邻格（含斜对面绕过来的），每一格都要能面朝某个触发点
  const stand = [];
  for (let y = 0; y < D.MAPH; y++) for (let x = 0; x < D.MAPW; x++) {
    if (BLOCK_CHARS.includes(M[y][x])) continue;
    if (Math.abs(x - bt.x) + Math.abs(y - bt.y) === 1 ||
        Math.abs(x - ct.x) + Math.abs(y - ct.y) === 1) stand.push({ x, y });
  }
  const reach = stand.filter(s =>
    [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => isBossFront(s.x + dx, s.y + dy)));

  console.log(`  第${ci + 1}章 ${c.name}  Boss(${bt.x},${bt.y}) 水晶(${ct.x},${ct.y})`);
  ok(stand.length >= 3, `Boss 周围有 ${stand.length} 格站得上去（至少3格，别只能从一个方向来）`);
  ok(reach.length === stand.length,
    `站得上去的 ${stand.length} 格全都能触发（能触发 ${reach.length} 格）`);

  // 背面（Boss 远离水晶的那一侧）必须站得上去且能触发
  const back = { x: bt.x * 2 - ct.x, y: bt.y * 2 - ct.y };
  const backFree = !BLOCK_CHARS.includes(M[back.y][back.x]);
  ok(backFree, `背面 (${back.x},${back.y}) 站得上去`);
  if (backFree) ok(isBossFront(bt.x, bt.y), `从背面面朝 Boss 能触发`);
});

// ---------- 2. Boss 死后不留隐形墙 ----------
console.log('\n=== Boss 死后那两格要变成可走的地面 ===\n');
ok(/freeBossTiles\(\)\s*\{[\s\S]*?blocked\.delete[\s\S]*?blocked\.delete/.test(src),
  'freeBossTiles 把 Boss 格和水晶格都从 blocked 里删掉');
ok(/GS\.flags\.boss[\s\S]{0,400}?else if \(!this\.indoor\) this\.freeBossTiles\(\)/.test(src),
  '重建地图时：Boss 已死就立刻解锁（BLOCK_CHARS 每次都会把它加回来）');
ok(/bossSprite\.destroy\(\);\s*\n\s*this\.freeBossTiles\(\)/.test(src),
  '打赢的当场也解锁一次，不用等下次进场景');
// TILE_TEX 是 World.create 里的局部量，从源码里取。'B'/'X' 不能有专属贴图，
// 否则解锁后地上还留着一块看着像墙的图。
const texKeys = (src.match(/const TILE_TEX = \{[^}]*\}/) || [''])[0];
ok(texKeys.length > 20, '找到 TILE_TEX 定义');
["'B'", "'X'"].forEach(k => ok(!texKeys.includes(k + ':'),
  `${k} 没有专属贴图，解锁后就是普通地面`));

// ---------- 3. 章节往返不丢进度 ----------
console.log('\n=== 章节来回走：进度要各自留着 ===\n');
// 只跑 stash/unstash 这两个纯函数，不用起 Phaser
const sandbox = { GS: null, SOKOBAN: [{}, {}, {}], console };
const fns = src.match(/function stashChapter\(\)[\s\S]*?\n}\n\nfunction unstashChapter\(idx\)[\s\S]*?\n}\n/);
if (!fns) { console.log('  ✗ 找不到 stashChapter/unstashChapter'); process.exit(1); }
vm.createContext(sandbox);
vm.runInContext(fns[0], sandbox);

const fresh = () => ({
  chapter: 0, flags: { intro: false, boss: false, puzzle: false },
  chests: [], locks: [], rooms: [], clues: [], quest: {}, searched: {}, pos: null,
});

// 第1章：开了3个箱子、通了关
sandbox.GS = fresh();
let G = sandbox.GS;
G.chests.push(0, 1, 2); G.locks.push(0, 1, 2); G.rooms.push(0, 1, 2);
G.flags = { intro: true, boss: true, puzzle: true };
G.quest = { dodo: 'done' }; G.clues = ['code1', 'code2', 'bridge'];

// → 去第2章
sandbox.stashChapter();
G.chapter = 1;
sandbox.unstashChapter(1);   // 第2章没记录 → 走"没有记录"分支
ok(G.chests.length === 0, '刚到第2章：箱子是没开过的（不该继承第1章的编号）');
ok(G.flags.boss === true, '（老存档回溯分支：门算开着，魔王不复活）');

// 第2章开2个箱子
G.chests = []; G.locks = []; G.rooms = [];
G.flags = { intro: true, boss: false, puzzle: false };
G.chests.push(0, 1); G.clues = ['c2a'];

// → 回第1章
sandbox.stashChapter();
G.chapter = 0;
sandbox.unstashChapter(0);
ok(JSON.stringify(G.chests) === '[0,1,2]', '回第1章：3个箱子还是开过的（不能无限刷金币）');
ok(G.quest.dodo === 'done', '回第1章：朵朵的委托还是做完的状态');
ok(G.flags.boss === true, '回第1章：魔王没有复活');
ok(JSON.stringify(G.clues) === '["code1","code2","bridge"]', '回第1章：线索还在');

// → 再去第2章
sandbox.stashChapter();
G.chapter = 1;
ok(!!(G.chSave || {})[1], '第2章有存档记录，该走恢复分支');
sandbox.unstashChapter(1);
ok(JSON.stringify(G.chests) === '[0,1]', '再回第2章：那2个箱子还是开过的（第2章没从头开始）');
ok(JSON.stringify(G.clues) === '["c2a"]', '再回第2章：第2章的线索还在，没被第1章的覆盖');
ok(G.flags.intro === true, '再回第2章：开场剧情不重播');

// 进章的两条路径（长老带路 enterChapter、通关后 nextChapter）都必须先存旧章、
// 再看目标章有没有记录 —— 少了这一步，回头补完碎片再往前走，第二章就从头开始
['enterChapter(idx) {', 'nextChapter() {'].forEach(sig => {
  const b = src.slice(src.indexOf(sig), src.indexOf(sig) + 700);
  ok(b.includes('stashChapter()'), `${sig.split('(')[0]} 离开时存下本章进度`);
  ok(/GS\.chSave \|\| \{\}\)\[[^\]]+\]\) unstashChapter/.test(b),
    `${sig.split('(')[0]} 目标章有记录就恢复，没有才当新章`);
});

// 两章的记录必须是分开的两份
ok(G.chSave[0].chests !== G.chSave[1].chests, '两章的箱子记录是各自独立的数组');
ok(JSON.stringify(G.chSave[0].chests) === '[0,1,2]' && JSON.stringify(G.chSave[1].chests) === '[0,1]',
  '两章互不干扰');

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ Boss 四面可打、死后不挡路、章节往返进度各自保留');

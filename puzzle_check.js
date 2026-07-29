// puzzle_check.js — 推箱子关卡可解性验证（BFS 穷举）
// 关卡不可解 = 孩子永久卡在迷宫里，所以必须自动验证
// 跑法: node puzzle_check.js
const { SOKOBAN } = require('./js/data.js');

function solve(level) {
  const rows = level.rows;
  const H = rows.length, W = rows[0].length;
  const wall = (x, y) => x < 0 || y < 0 || x >= W || y >= H || rows[y][x] === '#';

  // 找玩家起点
  let start = null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rows[y][x] === '@') start = { x, y };
  if (!start) return { ok: false, why: '没有玩家起点 @' };

  // 校验：箱子/凹槽坐标必须和 rows 里的标记一致
  const mism = [];
  level.boxes.forEach((b, i) => { if (rows[b.y][b.x] !== 'O') mism.push(`箱子${i}(${b.x},${b.y})处是'${rows[b.y][b.x]}'不是O`); });
  level.goals.forEach((g, i) => { if (rows[g.y][g.x] !== 'P') mism.push(`凹槽${i}(${g.x},${g.y})处是'${rows[g.y][g.x]}'不是P`); });
  if (mism.length) return { ok: false, why: mism.join('; ') };

  // 每个凹槽要求的得数
  const goalNeed = level.goals.map(g => ({ x: g.x, y: g.y, need: g.a * g.b }));
  // 检查每个凹槽至少有一个箱子数值匹配
  for (const g of goalNeed) {
    if (!level.boxes.some(b => b.val === g.need)) {
      return { ok: false, why: `凹槽(${g.x},${g.y})需要${g.need}，但没有这个数值的箱子` };
    }
  }

  const boxKey = bs => bs.map(b => b.x + ',' + b.y + ':' + b.val).sort().join('|');
  const win = bs => goalNeed.every(g => bs.some(b => b.x === g.x && b.y === g.y && b.val === g.need));

  const seen = new Set();
  const q = [{ p: start, boxes: level.boxes.map(b => ({ ...b })), d: 0 }];
  seen.add(start.x + ',' + start.y + '#' + boxKey(level.boxes));
  let explored = 0;

  while (q.length) {
    const s = q.shift();
    explored++;
    if (explored > 400000) return { ok: false, why: '搜索空间过大（>40万状态）' };
    if (win(s.boxes)) return { ok: true, steps: s.d, explored };

    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = s.p.x + dx, ny = s.p.y + dy;
      if (wall(nx, ny)) continue;
      const bi = s.boxes.findIndex(b => b.x === nx && b.y === ny);
      let boxes = s.boxes;
      if (bi >= 0) {
        const bx = nx + dx, by = ny + dy;
        if (wall(bx, by)) continue;
        if (s.boxes.some(b => b.x === bx && b.y === by)) continue;   // 箱子顶箱子
        boxes = s.boxes.map((b, i) => (i === bi ? { ...b, x: bx, y: by } : b));
      }
      const k = nx + ',' + ny + '#' + boxKey(boxes);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ p: { x: nx, y: ny }, boxes, d: s.d + 1 });
    }
  }
  return { ok: false, why: '穷举完毕，无解' };
}

let fail = 0;
console.log('=== 推箱子迷宫可解性验证 ===\n');
SOKOBAN.forEach((lv, i) => {
  const r = solve(lv);
  if (r.ok) {
    console.log(`✓ 第${i + 1}关「${lv.name}」有解，最少 ${r.steps} 步（搜索 ${r.explored} 状态）`);
    lv.goals.forEach(g => console.log(`    凹槽 ${g.a}×${g.b} → 需要推数值 ${g.a * g.b} 的箱子`));
  } else {
    console.log(`✗ 第${i + 1}关「${lv.name}」无解：${r.why}`);
    fail++;
  }
});

// 难度应递增
const steps = SOKOBAN.map(lv => { const r = solve(lv); return r.ok ? r.steps : -1; });
console.log('\n最少步数：', steps.join(' → '));
console.assert(steps.every(s => s > 0), '有关卡无解');

if (fail) { console.log(`\n✗ ${fail} 关有问题，必须修`); process.exit(1); }
console.log('\n✅ 三关全部可解，孩子不会被永久卡住');

// ---- 分糖机关（第2章）----
const { CH2_CANDY } = require('./js/data.js');
console.log('\n=== 分糖机关可解性验证 ===\n');
let cbad = 0;
CH2_CANDY.forEach((lv, i) => {
  const q = Math.floor(lv.total / lv.plates), r = lv.total % lv.plates;
  const ok = lv.plates >= 2 && lv.total > 0 && q >= 1 && r < lv.plates && q * lv.plates + r === lv.total;
  console.log(`${ok ? '✓' : '✗'} 第${i + 1}间「${lv.name}」 ${lv.total} ÷ ${lv.plates} = ${q} …… ${r}`);
  if (!ok) { console.log(`    ✗ 数值不合法`); cbad++; }
  if (q < 1)  { console.log('    ✗ 每盘不足1颗，孩子会困惑'); cbad++; }
  if (q > 9)  { console.log('    ✗ 每盘超过9颗，超出表内除法范围'); cbad++; }
  if (lv.plates > 6) { console.log('    ✗ 盘子太多，屏幕摆不下'); cbad++; }
  if (lv.total > 30) { console.log('    ✗ 糖太多，一颗颗点太累'); cbad++; }
});
// 难度应递增：余数从0开始教
if (CH2_CANDY[0].total % CH2_CANDY[0].plates !== 0) {
  console.log('✗ 第一间应该正好分完（先教平均分，再教余数）'); cbad++;
}
if (CH2_CANDY.some((l, i) => i > 0 && l.total % l.plates === 0)) {
  console.log('⚠ 后面几间最好都有余数，才练得到余数概念');
}
if (cbad) { console.log(`\n✗ 分糖机关 ${cbad} 处问题`); process.exit(1); }
console.log('\n✅ 分糖机关三间全部可解，且难度递增（先整除，后余数）');

// ---- 钟面机关（第3章）----
// 拨针只能 ±1时 / ±5分，所以目标时刻的分钟数必须是 5 的倍数，否则永远拨不到
const { CH3_CLOCK } = require('./js/data.js');
console.log('\n=== 钟面机关可解性验证 ===\n');
let kbad = 0;
CH3_CLOCK.forEach((lv, i) => {
  const f = t => t.h + ':' + String(t.m).padStart(2, '0');
  // BFS：从 start 出发，四种操作能不能到 target
  const key = t => t.h * 60 + t.m;
  const seen = new Set([key(lv.start)]);
  const q = [{ t: key(lv.start), d: 0 }];
  let steps = -1;
  while (q.length) {
    const s = q.shift();
    if (s.t === key(lv.target)) { steps = s.d; break; }
    if (s.d > 40) break;
    for (const d of [60, -60, 5, -5]) {
      const n = ((s.t + d) % 1440 + 1440) % 1440;
      if (seen.has(n)) continue;
      seen.add(n); q.push({ t: n, d: s.d + 1 });
    }
  }
  const ok = steps >= 0;
  console.log(`${ok ? '✓' : '✗'} 第${i + 1}间「${lv.name}」 ${f(lv.start)} → ${f(lv.target)}`
    + (ok ? `，最少 ${steps} 下` : '，拨不到！'));
  if (!ok) kbad++;
  if (lv.target.m % 5 !== 0) { console.log(`    ✗ 目标分钟 ${lv.target.m} 不是 5 的倍数，按钮拨不出来`); kbad++; }
  if (ok && steps > 12) { console.log(`    ✗ 要按 ${steps} 下，太累了`); kbad++; }
  if (ok && steps < 2) { console.log(`    ✗ 只要 ${steps} 下，没有难度`); kbad++; }
  if (!lv.hint) { console.log('    ✗ 没有提示，孩子会卡住'); kbad++; }
  if (!lv.riddle) { console.log('    ✗ 没有石刻题面'); kbad++; }
  if (!lv.reward) { console.log('    ✗ 没有奖励'); kbad++; }
});
// 难度递增：第一间只动时针，后面要动分针，最后一间要跨小时
if (CH3_CLOCK[0].start.m !== CH3_CLOCK[0].target.m) { console.log('✗ 第一间应该只动时针（先教整点）'); kbad++; }
const last = CH3_CLOCK[CH3_CLOCK.length - 1];
if (last.start.h === last.target.h) { console.log('✗ 最后一间应该跨小时（练进位）'); kbad++; }
if (kbad) { console.log(`\n✗ 钟面机关 ${kbad} 处问题`); process.exit(1); }
console.log('\n✅ 钟面机关三间都拨得到，难度递增（整点 → 刻 → 跨小时）');

// ---- 每章地图连通性 ----
// 谜题可解不代表走得到。宝箱/碎片/NPC/机关入口/魔王只要有一个到不了，那一章就残废
const D = require('./js/data.js');
console.log('\n=== 各章地图连通性 ===\n');
let rbad = 0;
D.CHAPTERS.forEach((C, ci) => {
  D.loadChapter(ci);
  const M = D.MAP, MW = D.MAPW, MH = D.MAPH, BC = 'TrwdfkCXBGDWP~';
  const walk = gateOpen => {
    const blk = (x, y) => (M[y][x] === 'G' ? !gateOpen : BC.includes(M[y][x]));
    const st = D.PLAYER_START, seen = new Set([st.x + ',' + st.y]), q = [st];
    while (q.length) {
      const p = q.shift();
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const x = p.x + dx, y = p.y + dy;
        if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const k = x + ',' + y;
        if (seen.has(k) || blk(x, y)) continue;
        seen.add(k); q.push({ x, y });
      }
    }
    return seen;
  };
  const open = walk(true), closed = walk(false);
  const nb = (t, s) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => s.has((t.x + dx) + ',' + (t.y + dy)));
  let bad = 0;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = M[y][x];
    if (!('cpDhO'.includes(c) || D.NPCS[c])) continue;
    // 挡路的（宝箱/NPC/机关入口）要邻格可达；可走的（碎片/隐藏点/圆盘）要本格可达
    const ok = ('cD'.includes(c) || D.NPCS[c]) ? nb({ x, y }, open) : open.has(x + ',' + y);
    if (!ok) { console.log(`  ✗ 第${C.n}章 到不了 '${c}' @(${x},${y})`); bad++; }
  }
  if (!nb(C.bossTile, open) && !nb(C.crystalTile, open)) { console.log(`  ✗ 第${C.n}章 魔王区到不了`); bad++; }
  if (nb(C.bossTile, closed)) { console.log(`  ✗ 第${C.n}章 不解机关就能打魔王，石门白设`); bad++; }
  D.SPAWNS.forEach(s => { if (!open.has(s.x + ',' + s.y)) { console.log(`  ✗ 第${C.n}章 小怪 ${s.k} 落在墙里 (${s.x},${s.y})`); bad++; } });
  Object.keys(D.HOUSES).forEach(k => {
    const [x, y] = k.split(',').map(Number);
    if (M[y][x] !== 'd') { console.log(`  ✗ 第${C.n}章 房门坐标 ${k} 不是门（是 '${M[y][x]}'）`); bad++; }
    else if (!nb({ x, y }, open)) { console.log(`  ✗ 第${C.n}章 房门 ${k} 走不到`); bad++; }
  });
  console.log(`  ${bad ? '✗' : '✓'} 第${C.n}章「${C.name}」 可走 ${open.size} 格${bad ? `，${bad} 处不可达` : '，全部可达'}`);
  rbad += bad;
});
if (rbad) { console.log(`\n✗ 连通性 ${rbad} 处问题`); process.exit(1); }
console.log('\n✅ 各章地图全部连通，没有拿不到的东西');

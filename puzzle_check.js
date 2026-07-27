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

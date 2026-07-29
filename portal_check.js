// portal_check.js — 无头驱动传送阵交互
// 浏览器里发现 dialog.open=true 但一个选项按钮都没有（提示在、选项没了 = 软卡死），
// 当时分不清是真 bug 还是后台标签页 update 循环冻结的假象。这里在 node 里真跑一遍定死它。
const { makeCtx } = require('./stub.js');

let bad = 0;
const ok = (cond, msg, extra) => {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) { bad++; if (extra !== undefined) console.log(`      实际：${JSON.stringify(extra)}`); }
};

// 造一个跑起来的 World：create() 走完，站在传送阵旁边
function world(mut) {
  const ctx = makeCtx();
  const World = ctx.__get('World');
  const w = new World();
  const GS = ctx.GS;
  GS.chapter = 0;
  GS.flags.intro = true;      // 跳过开场剧情：它的逐字打字定时器会盖掉我们要检查的提示文案
  ctx.__get('loadChapter')(0);
  if (mut) mut(GS, ctx);
  w.create();
  ctx.__flush(200);
  return { ctx, w, GS };
}

// 找地图上的传送阵，把玩家放到它右边一格、面朝左
function standBesidePortal(w, ctx) {
  const MAP = ctx.__get('MAP'), MAPW = ctx.__get('MAPW'), MAPH = ctx.__get('MAPH');
  for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
    if (MAP[y][x] === 'O') { w.px = x + 1; w.py = y; w.facing = 'left'; return { x, y }; }
  }
  return null;
}

console.log('=== 传送阵：撞上去要真的弹出可点的选项 ===\n');
{
  const { ctx, w, GS } = world(GS => { GS.flags.boss = true; });   // 第1章已通关
  const p = standBesidePortal(w, ctx);
  ok(!!p, '地图上找得到传送阵');
  ok(!!w.portal && w.portal.x === p.x && w.portal.y === p.y, 'World 记下了传送阵位置', w.portal);

  w.tryStep('left');                 // 撞上去
  ctx.__flush(500);
  const d = w.dialog;
  ok(d.open === true, '对话框打开了');
  ok(/去哪儿/.test(d.text.text) && /等级和装备/.test(d.text.text),
     '提示文案说清了去哪儿、以及等级装备会带走', d.text.text);
  // 这是关键的一条：浏览器里看到的是 0
  ok(d.choiceButtons.length > 0, `选项按钮建出来了（${d.choiceButtons.length} 个，0 就是软卡死）`);
  const labels = d.choiceButtons.map(b => b.txt.text);
  ok(labels.some(t => /除法回廊/.test(t)), '列出了第2章', labels);
  ok(labels.some(t => /返回/.test(t)), '有「返回」这条退路（没有就出不来）', labels);

  // 玩家不该真的踩上去 —— 否则走开时会再触发一次
  ok(w.px === p.x + 1 && w.py === p.y, '玩家停在传送阵旁边，没踩上去', { px: w.px, py: w.py });

  // 点「返回」要能干净退出
  const backBtn = d.choiceButtons.find(b => /返回/.test(b.txt.text));
  backBtn.bg.emit('pointerdown');
  ctx.__flush(500);
  ok(w.dialog.open === false, '点「返回」后对话框关掉了');
  ok(w.dialog.choiceButtons.length === 0, '按钮清干净了，没留幽灵按钮');
}

console.log('\n=== 没打魔王：传送阵是暗的，且不能把人卡住 ===\n');
{
  const { ctx, w } = world(GS => { GS.flags.boss = false; });
  standBesidePortal(w, ctx);
  w.tryStep('left');
  ctx.__flush(500);
  const d = w.dialog;
  ok(d.open === true, '给了提示');
  // say() 是逐字打出来的，text.text 只有已打出的部分；full 才是整句
  // say() 分多页，逐页找那句说明
  const all = (d.queue || []).concat([d.full || d.text.text]).join(' ');
  ok(/打败这一章的魔王/.test(all), '提示说明要先打魔王才会亮', all);
  ok(d.choiceButtons.length === 0, '这是纯消息，没有选项');
  // 纯消息必须能一路点完关掉，否则就是卡死
  for (let i = 0; i < 8 && d.open; i++) { d.lastTap = 0; d.tap(); ctx.__flush(300); }
  ok(d.open === false, '连点几下能把提示读完关掉（不会卡住）');
}

console.log('\n=== 面朝它按 A 也要能开 ===\n');
{
  const { ctx, w } = world(GS => { GS.flags.boss = true; });
  standBesidePortal(w, ctx);
  const hit = w.interactFront();
  ctx.__flush(500);
  ok(hit === true, 'interactFront 认领了这一格');
  ok(w.dialog.choiceButtons.length > 0, `按 A 也弹出了选项（${w.dialog.choiceButtons.length} 个）`);
}

console.log('\n=== 传送到去过的章节：进度要还在 ===\n');
{
  const { ctx, w, GS } = world(GS => {
    GS.flags.boss = true;
    GS.chSave = { 1: { flags: { intro: true, boss: false, puzzle: false },
                       chests: [0, 1], locks: [0], rooms: [], clues: ['c2a'], quest: {},
                       searched: {}, pos: { x: 11, y: 12 } } };
  });
  standBesidePortal(w, ctx);
  w.tryStep('left');
  ctx.__flush(500);
  const labels = w.dialog.choiceButtons.map(b => b.txt.text);
  ok(labels.some(t => /🔵/.test(t)), '去过的章节标成 🔵（不重播过场动画）', labels);

  const btn = w.dialog.choiceButtons.find(b => /除法回廊/.test(b.txt.text));
  ok(!!btn, '能点到第2章');
  btn.bg.emit('pointerdown');
  ctx.__flush(2000);
  ok(GS.chapter === 1, '真的切到第2章了', GS.chapter);
  ok(JSON.stringify(GS.chests) === '[0,1]', '第2章开过的箱子还在（没被清空）', GS.chests);
  ok(JSON.stringify(GS.clues) === '["c2a"]', '第2章的线索还在', GS.clues);
  ok(!!(GS.chSave || {})[0], '离开时把第1章的进度存下来了', Object.keys(GS.chSave || {}));
}

console.log('\n=== 连着开两次：Phaser 复用场景实例也不能出事 ===\n');
{
  const { ctx, w, GS } = world(GS => { GS.flags.boss = true; });
  standBesidePortal(w, ctx);
  w.tryStep('left');
  ctx.__flush(300);
  w.dialog.choiceButtons.find(b => /返回/.test(b.txt.text)).bg.emit('pointerdown');
  ctx.__flush(300);
  // 模拟场景重启：销毁全部显示对象，再 create 一遍
  ctx.__shutdown();
  let err = null;
  try {
    w.create();
    ctx.__flush(500);
    standBesidePortal(w, ctx);
    w.tryStep('left');
    ctx.__flush(500);
  } catch (e) { err = e.message; }
  ok(!err, '场景重启后再开传送阵不抛错', err);
  ok(!err && w.dialog.choiceButtons.length > 0, '重启后选项照样建得出来');
}


console.log('\n=== 跨章委托：状态要能跨传送活下来 ===\n');
{
  const { ctx, w, GS } = world(GS => {
    GS.chapter = 2;
    GS.flags.boss = false;                       // 第3章魔王还没打
    GS.chSave = {
      0: { flags: { intro: true, boss: true, puzzle: true }, chests: [0], locks: [0],
           rooms: [0, 1, 2], clues: ['code1'], quest: { dodo: 'done' }, searched: {}, pos: null },
      1: { flags: { intro: true, boss: true, puzzle: true }, chests: [1], locks: [1],
           rooms: [0, 1, 2], clues: ['c2a'], quest: { step: 'done' }, searched: {}, pos: null },
    };
    GS.errand = 'given'; GS.parts = ['glass']; GS.mats = { cog: 5 }; GS.upg = 1;
  });
  ctx.__get('loadChapter')(2);
  // 没打第3章魔王也必须能回前两章 —— 委托要求回去，回不去就是死结
  const dests = w.travelDests();
  ok(dests.length === 2 && dests.every(d => d.seen),
    '第3章没打魔王也能回第1、2章（否则跨章委托做不下去）', dests.map(d => d.i));

  standBesidePortal(w, ctx);
  w.tryStep('left');
  ctx.__flush(300);
  const btn = w.dialog.choiceButtons.find(b => /乘法口诀沙漠/.test(b.txt.text));
  ok(!!btn, '选单里有第1章');
  btn.bg.emit('pointerdown');
  ctx.__flush(2000);
  ok(GS.chapter === 0, '传送到第1章了', GS.chapter);
  // 这四个是全局进度，绝不能被章节存档覆盖
  ok(GS.errand === 'given', '委托状态活着', GS.errand);
  ok(JSON.stringify(GS.parts) === '["glass"]', '已收零件活着', GS.parts);
  ok(GS.mats && GS.mats.cog === 5, '齿轮碎片活着', GS.mats);
  ok(GS.upg === 1, '武器强化等级活着', GS.upg);
  // 第1章自己的进度也要按存档恢复
  ok(JSON.stringify(GS.chests) === '[0]', '第1章宝箱进度按存档恢复', GS.chests);
}

console.log('\n=== 强化材料只在钟楼掉 ===\n');
{
  const D = require('./js/data.js');
  D.CHAPTERS.forEach(C => {
    const want = C.n === 3;
    const got = !!C.dropCog;
    ok(want === got, `第${C.n}章「${C.name}」掉齿轮碎片=${got}（应为 ${want}）`);
  });
}

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ 传送阵可用可退，章节进度各自保留，跨章委托的状态能活过传送');

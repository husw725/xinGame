// battle_check.js — 无头驱动战斗流程
// 浏览器里求值延迟严重，战斗类 bug 很难复现。这里用一个会真正执行定时回调的
// Phaser 替身，把整场战斗跑完，任何异常当场抛出。
const { makeCtx } = require('./stub.js');

// ---- 跑一场完整战斗 ----
function fight(ctx, enemyKey, { answerRight = true, gm = false, wrongFirst = false } = {}) {
  let asked = 0;
  const Battle = ctx.__get('Battle'), ENEMIES = ctx.__get('ENEMIES');
  ctx.GS.gm = gm;
  // Phaser 复用同一个场景实例：第二场是在同一个对象上重跑 create()
  if (!ctx.__battle) ctx.__battle = new Battle();
  else ctx.__shutdown();
  const b = ctx.__battle;
  b.init({ def: ENEMIES[enemyKey], mid: 0 });
  b.create();
  ctx.__flush(1000);

  ctx.GS.lastBattle = null;
  let guard = 0;
  while (guard++ < 80) {
    if (ctx.GS.lastBattle) break;               // end() 已被调用 = 这场打完了
    if (b.state === 'msg') { b.lastTap = 0; b.tapMsg(); ctx.__flush(900); continue; }
    if (b.state === 'menu') {
      const atk = b.buttons.find(x => /攻击/.test(x.txt.text));
      if (!atk) throw new Error('菜单里没有攻击按钮：' + b.buttons.map(x => x.txt.text));
      atk.bg.emit('pointerdown');
      ctx.__flush(300);
      continue;
    }
    if (b.state === 'question') {
      asked++;
      const wrong = wrongFirst ? asked === 1 : !answerRight;
      const want = wrong ? b.q.options.find(o => o !== b.q.answer) : b.q.answer;
      const btn = b.buttons.find(x => x.txt.text === want);
      if (!btn) throw new Error('找不到选项按钮');
      btn.bg.emit('pointerdown');
      ctx.__flush(1600);
      continue;
    }
    if (b.state === 'anim' || b.state === 'intro' || b.state === 'idle') { ctx.__flush(1200); continue; }
    ctx.__flush(600);
  }
  if (!ctx.GS.lastBattle) throw new Error('战斗打不完（状态卡在 ' + b.state + '，敌HP ' + b.enemy.hp + '）');
  return { enemyHp: b.enemy.hp, result: ctx.GS.lastBattle.result,
           lv: ctx.GS.p.lv, dex: ctx.GS.dex.slice(), poolLen: ctx.GS.pool.length };
}

let bad = 0;
console.log('=== GM 模式连续战斗（用户报告：第二只错别字怪卡死）===\n');
try {
  const ctx = makeCtx();
  ctx.GS.p.lv = 6; ctx.GS.p.maxhp = 70; ctx.GS.p.hp = 70; ctx.GS.p.atk = 15;
  for (let n = 1; n <= 4; n++) {
    const r = fight(ctx, 'wraith', { gm: true, answerRight: true });
    console.log(`  ✓ 第${n}只错别字妖精：敌HP ${r.enemyHp}，等级 ${r.lv}，图鉴 ${r.dex.length}`);
  }
} catch (e) {
  console.log('  ✗ ' + e.message);
  if (e.stack) console.log('    ' + e.stack.split('\n').slice(1, 4).join('\n    '));
  bad++;
}

console.log('\n=== GM + 答错（走敌人回合分支）===\n');
try {
  const ctx = makeCtx();
  ctx.GS.p.lv = 6; ctx.GS.p.maxhp = 70; ctx.GS.p.hp = 70; ctx.GS.p.atk = 15;
  for (let n = 1; n <= 3; n++) {
    const r = fight(ctx, 'wraith', { gm: true, wrongFirst: true });
    console.log(`  ✓ 第${n}只（每场第1题故意答错）：敌HP ${r.enemyHp}，结果 ${r.result}，错题池 ${r.poolLen}`);
  }
} catch (e) { console.log('  ✗ ' + e.message); bad++; }

console.log('\n=== GM + 全程答错（原来会僵住：敌人不掉血、自己不死）===\n');
try {
  const ctx = makeCtx();
  ctx.GS.p.lv = 6; ctx.GS.p.maxhp = 70; ctx.GS.p.hp = 70; ctx.GS.p.atk = 15;
  for (let n = 1; n <= 3; n++) {
    const r = fight(ctx, 'wraith', { gm: true, answerRight: false });
    console.log(`  ✓ 第${n}只全答错也能打完：敌HP ${r.enemyHp}，结果 ${r.result}`);
  }
} catch (e) { console.log('  ✗ ' + e.message); bad++; }

console.log('\n=== GM + 怨念怪（错题池≥3 才会出现，造型和错别字妖精很像）===\n');
try {
  const ctx = makeCtx();
  ctx.GS.p.lv = 6; ctx.GS.p.maxhp = 70; ctx.GS.p.hp = 70; ctx.GS.p.atk = 15;
  // 先攒 5 条错题
  for (let n = 0; n < 5; n++) ctx.GS.pool.push({ text: '错题' + n + ' 2×3=?', options: ['6','7','8','9'], answer: '6', tip: 'x' });
  console.log('  错题池初始 ' + ctx.GS.pool.length + ' 条');
  for (let n = 1; n <= 4; n++) {
    const Battle = ctx.__get('Battle'), ENEMIES = ctx.__get('ENEMIES');
    ctx.GS.gm = true; ctx.GS.lastBattle = null;
    const b = new Battle();
    b.init({ def: ENEMIES.revenge, mid: undefined, revenge: true });
    b.create(); ctx.__flush(1000);
    let guard = 0;
    while (guard++ < 80 && !ctx.GS.lastBattle) {
      if (b.state === 'msg') { b.lastTap = 0; b.tapMsg(); ctx.__flush(900); continue; }
      if (b.state === 'menu') { const a = b.buttons.find(x => /攻击/.test(x.txt.text)); if (!a) throw new Error('无攻击按钮'); a.bg.emit('pointerdown'); ctx.__flush(300); continue; }
      if (b.state === 'question') { b.buttons.find(x => x.txt.text === b.q.answer).bg.emit('pointerdown'); ctx.__flush(1600); continue; }
      ctx.__flush(1000);
    }
    if (!ctx.GS.lastBattle) throw new Error('第' + n + '只怨念怪打不完（状态 ' + b.state + '，敌HP ' + b.enemy.hp + '）');
    console.log(`  ✓ 第${n}只怨念怪：敌HP ${b.enemy.hp}，错题池剩 ${ctx.GS.pool.length}`);
  }
  if (ctx.GS.pool.length >= 3) console.log('  ⚠ 错题池仍有 ' + ctx.GS.pool.length + ' 条 → 怨念怪会立刻再刷出来');
} catch (e) { console.log('  ✗ ' + e.message); bad++; }

console.log('\n=== 非GM 连续战斗（对照）===\n');
try {
  const ctx = makeCtx();
  ctx.GS.p.lv = 6; ctx.GS.p.maxhp = 70; ctx.GS.p.hp = 70; ctx.GS.p.atk = 15;
  for (let n = 1; n <= 2; n++) {
    const r = fight(ctx, 'slime', { gm: false, answerRight: true });
    console.log(`  ✓ 第${n}只史莱姆：敌HP ${r.enemyHp}，等级 ${r.lv}`);
  }
} catch (e) { console.log('  ✗ ' + e.message); bad++; }

if (bad) { console.log(`\n✗ ${bad} 处战斗流程异常`); process.exit(1); }
console.log('\n✅ 连续战斗流程正常，无卡死');

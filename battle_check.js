// battle_check.js — 无头驱动战斗流程
// 浏览器里求值延迟严重，战斗类 bug 很难复现。这里用一个会真正执行定时回调的
// Phaser 替身，把整场战斗跑完，任何异常当场抛出。
const fs = require('fs');
const vm = require('vm');

function makeCtx() {
  const clock = [];                       // [{at, cb}]
  let now = 0;
  const noop = () => {};

  // 会记录属性的假 GameObject：链式调用全部返回自己
  const created = [];
  function obj(extra = {}) {
    const o = {
      x: 0, y: 0, alpha: 1, visible: true, active: true, scene: {}, text: '',
      style: { fontSize: '22px', color: '#fff' }, height: 20, width: 100,
      fillColor: 0, displayWidth: 0,
      setText(t) { this._chk(); this.text = String(t); return this; },
      setOrigin() { return this; }, setScale() { this._chk(); return this; }, setDepth() { return this; },
      setScrollFactor() { return this; }, setStrokeStyle() { return this; },
      setFillStyle(c) { this.fillColor = c; return this; }, setTint() { this._chk(); return this; },
      clearTint() { return this; }, setVisible(v) { this._chk(); this.visible = v; return this; },
      setInteractive() { return this; }, setColor(c) { this.style.color = c; return this; },
      setFontSize(s) { this.style.fontSize = s + 'px'; return this; },
      setStyle(s) { Object.assign(this.style, s); return this; },
      setPosition() { return this; }, setFlipX() { return this; }, setDisplaySize() { return this; },
      setAlpha(a) { this.alpha = a; return this; },
      destroy() { this.active = false; this.scene = null; this._dead = true; },
      _chk() { if (this._dead) throw new Error('操作了已销毁的对象（场景复用残留）'); },
      on(ev, fn) { (this._h = this._h || {})[ev] = fn; return this; },
      once() { return this; },
      emit(ev, ...a) { if (this._h && this._h[ev]) this._h[ev](...a); return this; },
      listenerCount() { return 1; },
      ...extra,
    };
    created.push(o);
    return o;
  }

  const scene = {
    add: {
      rectangle: () => obj({ type: 'Rectangle' }),
      text: (x, y, label) => obj({ type: 'Text', text: String(label == null ? '' : label) }),
      image: () => obj({ type: 'Image' }), container: () => obj({ type: 'Container', add: noop }),
      circle: () => obj(), graphics: () => obj(),
    },
    tweens: { add: (c) => { if (c.onComplete) clock.push({ at: now + (c.duration || 0) + (c.hold || 0), cb: c.onComplete }); return obj(); } },
    time: {
      get now() { return now; },
      addEvent: (c) => { clock.push({ at: now + c.delay, cb: c.callback, loop: c.loop, delay: c.delay }); return obj({ remove: noop }); },
      delayedCall: (d, cb) => { clock.push({ at: now + d, cb }); return obj({ remove: noop }); },
    },
    cameras: { main: obj({ flash: noop, shake: noop, resetFX: noop, setBounds: noop, removeBounds: noop, startFollow: noop, centerOn: noop, fadeOut: noop, fadeIn: noop, flashEffect: { isRunning: false } }) },
    input: { keyboard: { on: noop, createCursorKeys: () => ({ up: {}, down: {}, left: {}, right: {} }) }, on: noop },
    children: { list: [] },
    make: { graphics: () => obj({ fillStyle: noop, fillRect: noop, fillCircle: noop, generateTexture: noop, lineStyle: noop, strokeCircle: noop }) },
    scene: { start: noop, stop: noop, launch: noop, sleep: noop, wake: noop, restart: noop, isActive: () => false, isSleeping: () => false, key: '' },
    sys: { settings: { status: 3 } },
    textures: { exists: () => true },
  };

  const Phaser = {
    VERSION: 'stub', AUTO: 0,
    Scale: { FIT: 0, CENTER_BOTH: 0 },
    Math: { Between: (a, b) => Math.floor((a + b) / 2), FloatBetween: (a) => a, Clamp: (v) => v },
    Utils: { Array: { Shuffle: a => a } },
    Scene: class { constructor(k) { Object.assign(this, scene); this.sceneKey = typeof k === 'string' ? k : k && k.key; } },
    Game: class { constructor(cfg) { this.cfg = cfg; this.scene = { scenes: [], getScene: () => ({}) }; this.loop = { actualFps: 60 }; } },
  };

  const ctx = {
    Phaser, console,
    document: { querySelector: () => null, querySelectorAll: () => [] },
    localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; }, clear() { this._d = {}; } },
    performance: { getEntriesByType: () => [] }, setTimeout, module: undefined,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  ['js/data.js', 'js/art.js', 'js/game.js'].forEach(f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }));

  // 把时钟推进到底，执行所有到期回调
  ctx.__flush = (ms = 8000) => {
    const end = now + ms;
    let guard = 0;
    while (now < end) {
      const due = clock.filter(e => e.at <= end).sort((a, b) => a.at - b.at);
      if (!due.length) break;
      const e = due[0];
      clock.splice(clock.indexOf(e), 1);
      now = Math.max(now, e.at);
      e.cb();
      if (e.loop) clock.push({ at: now + e.delay, cb: e.cb, loop: true, delay: e.delay });
      if (++guard > 4000) throw new Error('时钟回调死循环');
    }
    now = end;
  };
  ctx.__advance = ms => { now += ms; };
  // class / const 是词法声明，不在 globalThis 上，得用 runInContext 取出来
  ctx.__get = expr => vm.runInContext(expr, ctx);
  // 模拟 Phaser shutdown：销毁本场所有显示对象。
  // 这样"实例被复用但字段还指着死对象"的 bug 才会暴露出来
  ctx.__shutdown = () => { created.forEach(o => o.destroy && o.destroy()); created.length = 0; };
  return ctx;
}

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

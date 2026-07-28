// stub.js — 无头 Phaser 替身，battle_check / portal_check 共用
// 会真正执行定时回调，并在操作已销毁对象时抛错（专门抓场景复用残留的 bug）
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
      setTexture(t) { this._chk(); this.texture = t; return this; }, setAngle() { return this; },
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
    events: { on: noop, once: noop, off: noop, emit: noop },
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

module.exports = { makeCtx };

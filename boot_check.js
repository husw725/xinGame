// boot_check.js — 发布前启动自检
// 上一次事故：删一个类时误删了中间的另一个类，游戏黑屏才被发现。
// 这里在 node 里模拟一遍加载，任何未定义引用都当场暴露。
const fs = require('fs');
const vm = require('vm');

const src = ['js/data.js', 'js/art.js', 'js/game.js'].map(f => fs.readFileSync(f, 'utf8'));

// 极简 Phaser 替身：只要能跑到 new Phaser.Game(...) 并把场景类实例化就够
const noop = () => {};
const chain = new Proxy(function () {}, {
  get: (t, k) => (k === 'then' ? undefined : chain),
  apply: () => chain, construct: () => chain,
});
const Phaser = {
  VERSION: 'stub', AUTO: 0,
  Scale: { FIT: 0, CENTER_BOTH: 0 },
  Math: { Between: (a) => a, FloatBetween: (a) => a, Clamp: (v) => v },
  Utils: { Array: { Shuffle: a => a } },
  Scene: class { constructor(cfg) { this.sceneKey = typeof cfg === 'string' ? cfg : (cfg && cfg.key); } },
  Game: class {
    constructor(cfg) {
      this.cfg = cfg;
      // 场景列表里每一项都必须是真正的类
      cfg.scene.forEach((S, i) => {
        if (typeof S !== 'function') throw new Error(`scene[${i}] 不是类：${S}`);
        const inst = new S();
        if (!inst.sceneKey) throw new Error(`scene[${i}] 没有 key`);
      });
      this.scene = { scenes: [], getScene: () => ({}), start: noop };
      this.loop = { actualFps: 60 };
    }
  },
};

const ctx = {
  Phaser, window: {}, document: { querySelector: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop, clear: noop },
  console, performance: { getEntriesByType: () => [] },
  setTimeout, module: undefined,
};
ctx.window = ctx;
vm.createContext(ctx);

try {
  src.forEach((code, i) => vm.runInContext(code, ctx, { filename: ['data.js', 'art.js', 'game.js'][i] }));
} catch (e) {
  console.log('✗ 加载失败：' + e.message);
  if (e.stack) console.log(e.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}

const keys = ctx.game && ctx.game.cfg ? ctx.game.cfg.scene.map(S => new S().sceneKey) : [];
console.log('✓ 三个 js 全部加载成功，无未定义引用');
console.log('✓ 注册的场景：' + keys.join(', '));

const must = ['Boot', 'Title', 'World', 'Battle', 'Puzzle', 'Candy', 'Clear'];
const missing = must.filter(k => !keys.includes(k));
if (missing.length) { console.log('✗ 缺少场景：' + missing.join(', ')); process.exit(1); }
console.log('✅ 启动自检通过');

// game.js — 《知识大冒险：遗忘魔王》第一章
const W = 480, H = 854;
const FONT = '"PingFang SC","Microsoft YaHei",sans-serif';

// 答题速度加成（毫秒）：只奖励不惩罚，慢慢答仍是原伤害
const SPEED_TIERS = [
  { ms: 2000, mult: 1.5, color: 0x4fc14f, label: '×1.5' },
  { ms: 3000, mult: 1.2, color: 0xf4c542, label: '×1.2' },
];
const SPEED_BASE = { mult: 1.0, color: 0x7a7a88, label: '×1.0' };
function speedTier(ms) { return SPEED_TIERS.find(t => ms <= t.ms) || SPEED_BASE; }

// ============ 全局状态 ============
function defaultState() {
  return {
    p: {
      lv: 1, hp: 30, maxhp: 30, mp: 10, maxmp: 10, atk: 5, exp: 0, gold: 20,
      potion: 2, ether: 1, scroll: 1,
      // 五部位装备
      eq: { weapon: 'pencil', head: null, shield: null, boots: 'cloth_b', charm: null },
      bag: [], // 备用装备
    },
    chapter: 0,
    indoor: null,   // 在哪间屋里（门坐标），null=在外面
    outPos: null,   // 进屋前站在哪
    flags: { intro: false, boss: false, puzzle: false },
    clues: [],    // 已记下的线索 key
    talked: [],   // 聊过的 NPC（"章:id"），用来决定头上还要不要挂 !
    quest: {},    // 支线状态：dodo = null/'taken'/'found'/'done'
    locks: [],    // 已解开的宝箱锁编号
    searched: {}, // 各屋内翻过的家具
    pool: [],
    frags: [],    // 已收集的记忆碎片编号
    chests: [],   // 已开的宝箱编号
    dex: [],      // 已唤醒的怪物图鉴
    tools: [],    // 探索工具：lens=放大镜
    rooms: [],    // 已解开的迷宫房间
  };
}
let GS = defaultState();
const SAVE_KEY = 'xinGame_save_v4';
function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(GS)); } catch (e) {} }
function loadGame() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function expNeed(lv) { return 20 + lv * 20; }

// ---- 装备派生属性 ----
function gearList() { return SLOTS.map(s => GS.p.eq[s]).filter(Boolean).map(k => GEAR[k]); }
function sumGear(prop) { return gearList().reduce((s, g) => s + (g[prop] || 0), 0); }
function totalAtk() { return GS.p.atk + sumGear('atk'); }
function totalDef() { return sumGear('def'); }
function totalSpd() { return sumGear('spd'); }
// 智力：随等级长，护符加成为主。只影响魔法威力
function totalInt() { return 5 + (GS.p.lv - 1) * 2 + sumGear('int'); }
// 魔法威力 = 基础 × (1 + 智力/100)。
// 对 Boss 减半 —— 魔法无视防御，不减半的话孩子可以靠魔法绕过等级墙，
// 而整套练级设计正是建立在"等级不够就打不动"上的。
// 魔法威力 = 基础 + 智力。做成加法而不是百分比，
// 是为了让"换个护符多了8点智力"能直接变成"每发多8点伤害"，孩子看得见。
function spellPower(base, vsBoss) {
  const v = base + totalInt();
  if (!vsBoss) return v;
  // Boss 魔抗随章节递增。魔法无视防御又能吃答题×1.5，
  // 不压住的话孩子可以低5级纯靠魔法秒掉 Boss，整套练级设计就废了。
  const resist = Math.min(0.78, 0.30 + GS.chapter * 0.068);
  return Math.max(1, Math.round(v * (1 - resist)));
}
function hasGearFlag(flag) { return gearList().some(g => g[flag]); }
function gearBoost(subject) { return gearList().some(g => g.boost === subject) ? 1.3 : 1; }
function sellPrice(key) { return Math.floor(GEAR[key].buy * 0.75); }

// 和身上现有装备对比：涨=绿+▲，减=红+▼，一样=灰。颜色和箭头双重标示，不只靠颜色
function gearDelta(key, slot) {
  const g = GEAR[key];
  const prop = SLOT_PROP[slot];
  if (!prop) return { text: `  ${g.desc}`, tint: null };
  const cur = GS.p.eq[slot] ? GEAR[GS.p.eq[slot]] : null;
  const now = (cur && cur[prop]) || 0;
  const val = g[prop] || 0;
  if (val > now) return { text: `  ${now}→${val} ▲`, tint: '#7fe08a' };
  if (val < now) return { text: `  ${now}→${val} ▼`, tint: '#ff8f8f' };
  return { text: `  ${now}→${val} ＝`, tint: '#9aa2bd' };
}
function learned() { return spellsAt(GS.p.lv); }
function chapterFrags() { return fragsOfChapter(GS.chapter, GS.frags).length; }

// ============ 通用 UI ============
function makeButton(scene, x, y, w, h, label, cb, opts = {}) {
  const bg = scene.add.rectangle(x, y, w, h, opts.color ?? 0x2c3e6b)
    .setStrokeStyle(3, 0xf4e6c0).setInteractive({ useHandCursor: true });
  const txt = scene.add.text(x, y, label, {
    fontSize: opts.fontSize || '24px', fontFamily: FONT,
    color: opts.dim ? '#6a7290' : (opts.textColor || '#fff4d6'),
    align: 'center', wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
  }).setOrigin(0.5);
  bg.on('pointerdown', () => {
    // ponytail: 标记本次点击已被按钮消费，场景级 pointerdown 就不会再处理同一下
    scene.btnConsumed = true;
    bg.setFillStyle(0x4a5f9e);
    scene.time.delayedCall(80, () => { if (bg.active) bg.setFillStyle(opts.color ?? 0x2c3e6b); });
    cb();
  });
  const group = { bg, txt, destroy() { bg.destroy(); txt.destroy(); }, setVisible(v) { bg.setVisible(v); txt.setVisible(v); return group; } };
  return group;
}

// ============ Boot ============
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    makeTextures(this);
    loadChapter(GS.chapter || 0);
    this.scene.start('Title');
  }
}

// ============ 标题 ============
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1f3a);
    for (let i = 0; i < 40; i++) {
      this.add.image(Phaser.Math.Between(10, W - 10), Phaser.Math.Between(10, H / 2), 'px')
        .setScale(2).setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
    }
    this.add.image(W / 2, 250, 'crystal').setScale(6);
    this.add.text(W / 2, 380, '知识大冒险', { fontSize: '52px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 435, '— 遗忘魔王 —', { fontSize: '26px', fontFamily: FONT, color: '#9fb4e8' }).setOrigin(0.5);
    this.add.text(W / 2, 480, '第一章 · 乘法口诀沙漠', { fontSize: '20px', fontFamily: FONT, color: '#8090b8' }).setOrigin(0.5);

    const saved = loadGame();
    makeButton(this, W / 2, 590, 280, 64, '开始新冒险', () => {
      GS = defaultState(); saveGame();
      this.scene.start('World');
    });
    if (saved) {
      makeButton(this, W / 2, 680, 280, 64, `继续冒险 (Lv${saved.p.lv})`, () => {
        GS = saved;
        this.scene.start('World');
      }, { color: 0x3a6b45 });
    }
    this.add.text(W / 2, 800, '适合二升三小朋友 · 数学+语文', { fontSize: '16px', fontFamily: FONT, color: '#667' }).setOrigin(0.5);
  }
}

// ============ 对话框 ============
class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.container = scene.add.container(0, 0).setDepth(200).setScrollFactor(0).setVisible(false);
    const bg = scene.add.rectangle(W / 2, 530, 450, 170, 0x14182e, 0.95).setStrokeStyle(4, 0xf4e6c0);
    this.nameText = scene.add.text(45, 455, '', { fontSize: '20px', fontFamily: FONT, color: '#ffd76a', fontStyle: 'bold' });
    this.text = scene.add.text(45, 490, '', { fontSize: '22px', fontFamily: FONT, color: '#fff', wordWrap: { width: 410 }, lineSpacing: 8 });
    this.arrow = scene.add.text(W - 60, 590, '▼', { fontSize: '20px', color: '#ffd76a' });
    this.container.add([bg, this.nameText, this.text, this.arrow]);
    scene.tweens.add({ targets: this.arrow, y: 596, duration: 400, yoyo: true, repeat: -1 });
    this.choiceButtons = [];
    scene.input.on('pointerdown', () => this.tap());
    scene.input.keyboard.on('keydown-SPACE', () => this.tap());
    scene.input.keyboard.on('keydown-ENTER', () => this.tap());
  }
  // 文字框内高有限（框 445~615），长文案必须自动缩字号 + 自动分页，
  // 否则会印到框外面。修在这里，所有调用点一次性受益。
  availH() { return 605 - this.text.y; }

  fits(str, size) {
    const old = this.text.style.fontSize;
    this.text.setFontSize(size).setText(str);
    const h = this.text.height;
    this.text.setText('').setStyle({ fontSize: old });
    return h <= this.availH();
  }

  // 按换行把过长的一段拆成能装下的若干页。
  // 以 18 号字为分页基准（而不是最小的 15），页与页之间字号才不会忽大忽小。
  pushFitted(str) {
    const BASE = 18;
    const parts = [];
    // 先处理"单独一行就装不下"的超长句：按字数硬切
    for (const p of String(str).split('\n')) {
      if (this.fits(p, BASE) || !p.length) { parts.push(p); continue; }
      let cut = p;
      while (cut.length && !this.fits(cut, BASE)) {
        let n = cut.length;
        while (n > 1 && !this.fits(cut.slice(0, n), BASE)) n = Math.floor(n * 0.8);
        parts.push(cut.slice(0, n));
        cut = cut.slice(n);
      }
      if (cut.length) parts.push(cut);
    }
    let buf = [];
    const flush = () => { if (buf.length) { this.queue.push(buf.join('\n')); buf = []; } };
    for (const p of parts) {
      if (buf.length && !this.fits(buf.concat(p).join('\n'), BASE)) flush();
      buf.push(p);
    }
    flush();
  }

  say(lines, cb, speaker = '') {
    this.cb = cb || null;
    this.open = true;
    this.container.setVisible(true);
    this.nameText.setText(speaker);
    // 没有说话人时文字上移，多出一行的空间
    this.text.y = speaker ? 490 : 472;
    this.queue = [];
    lines.forEach(l => this.pushFitted(l));
    // 同一段对话统一用一个字号（取所有页里最小的那个），避免翻页时字忽大忽小
    this.pageSize = 22;
    for (const page of this.queue) {
      let s = 15;
      for (const t of [22, 20, 18, 16, 15]) { s = t; if (this.fits(page, t)) break; }
      this.pageSize = Math.min(this.pageSize, s);
    }
    this.next();
  }
  next() {
    if (this.queue.length === 0) { this.close(); return; }
    this.full = this.queue.shift();
    this.text.setFontSize(this.pageSize || 22);
    this.text.setText('');
    this.charIdx = 0;
    this.typing = true;
    this.arrow.setVisible(false);
    this.timer = this.scene.time.addEvent({
      delay: 35, repeat: this.full.length - 1,
      callback: () => {
        this.charIdx++;
        this.text.setText(this.full.slice(0, this.charIdx));
        if (this.charIdx >= this.full.length) { this.typing = false; this.arrow.setVisible(true); }
      },
    });
  }
  tap() {
    if (!this.open || this.choiceButtons.length) return;
    const now = this.scene.time.now;
    if (this.lastTap && now - this.lastTap < 250) return;
    this.lastTap = now;
    if (this.typing) {
      this.timer.remove();
      this.text.setText(this.full);
      this.typing = false;
      this.arrow.setVisible(true);
    } else {
      this.next();
    }
  }
  // ---- A/B 手柄支持 ----
  hasChoices() { return this.choiceButtons.length > 0; }

  moveSel(d) {
    if (!this.hasChoices()) return;
    this.sel = (this.sel + d + this.choiceButtons.length) % this.choiceButtons.length;
    this.paintSel();
  }
  paintSel() {
    this.choiceButtons.forEach((b, i) => {
      b.bg.setFillStyle(i === this.sel ? 0x4a6fbe : 0x2c3e6b);
      b.bg.setStrokeStyle(i === this.sel ? 4 : 3, i === this.sel ? 0xffe08a : 0xf4e6c0);
    });
  }
  confirmSel() {
    if (!this.hasChoices()) return false;
    this.choiceButtons[this.sel].bg.emit('pointerdown');
    return true;
  }
  // B 键：优先选"返回/取消/关闭"这类退出项，没有就选最后一项
  // B 键：一按跳过整段（tap() 第一次只会把字打完，不算跳过）
  skip() {
    if (!this.open || this.choiceButtons.length) return;
    if (this.timer) this.timer.remove();
    this.typing = false;
    this.queue = [];
    this.close();
  }

  cancelSel() {
    if (!this.hasChoices()) return false;
    const idx = this.choiceButtons.findIndex(b => /返回|取消|关闭|离开|算了|不用|再说|先撤退|不练/.test(b.txt.text));
    this.sel = idx >= 0 ? idx : this.choiceButtons.length - 1;
    this.paintSel();
    this.choiceButtons[this.sel].bg.emit('pointerdown');
    return true;
  }

  choice(prompt, options, cb) {
    this.clearChoices();   // 防止上一层菜单的按钮残留成"幽灵按钮"
    this.sel = 0;
    this.open = true;
    this.container.setVisible(true);
    this.text.setText(prompt);
    this.typing = false;
    this.arrow.setVisible(false);
    // 最后一个按钮压在 420，向上排；避免和 y=445 起的消息框重叠
    // 行高 58 逻辑像素 ≈ 手机上 47pt，小孩点得准。
    // 末行中心压在 412：底部 441 刚好不碰消息框（445 起）
    const gap = 62;
    const startY = 412 - (options.length - 1) * gap;
    options.forEach((opt, i) => {
      // 选项可以是纯字符串，也可以是 {label, tint} —— tint 用来标示装备属性涨还是减
      const label = typeof opt === 'string' ? opt : opt.label;
      const tint = typeof opt === 'string' ? null : opt.tint;
      const btn = makeButton(this.scene, W / 2, startY + i * gap, 448, 58, label, () => {
        this.clearChoices();
        this.close();
        cb(i);
      }, { fontSize: '18px', wrap: 430, textColor: tint });
      btn.bg.setScrollFactor(0).setDepth(201);
      btn.txt.setScrollFactor(0).setDepth(201);
      this.choiceButtons.push(btn);
    });
    this.paintSel();
  }
  clearChoices() {
    this.choiceButtons.forEach(b => b.destroy());
    this.choiceButtons = [];
  }
  close() {
    this.open = false;
    this.container.setVisible(false);
    this.nameText.setText('');
    const cb = this.cb; this.cb = null;
    if (cb) cb();
  }
}

// ============ 世界（村庄+沙漠） ============
class World extends Phaser.Scene {
  constructor() { super('World'); }

  create() {
    loadChapter(GS.chapter || 0);
    // 室内就是另一张地图，在同一个场景里切换 —— 这样对话/商店/战斗全都自然可用
    this.indoor = GS.indoor || null;
    const house = this.indoor ? HOUSES[this.indoor] : null;
    this.rows = house ? house.rows : MAP;
    this.gw = this.rows[0].length;
    this.gh = this.rows.length;
    this.houseName = house ? house.name : null;
    this.moving = false;
    this.inBattle = false;
    this.held = null;
    this.queued = null;
    this.facing = 'down';
    this.blocked = new Set();
    this.doors = new Set();
    this.npcs = {};   // "x,y" -> npc id
    this.mobs = [];

    // --- 地图 ---
    const TILE_TEX = { '.': 't_grass', ',': 't_sand', '-': 't_path', 'T': 't_tree', 'C': 't_cactus', 'k': 't_rock', 'f': 't_fence', 'r': 't_roof', 'w': 't_wall', 'd': 't_door',
                       's': 't_stone', 'W': 't_swall', 'P': 't_pillar', '~': 't_water' };
    this.chests = {};    // "x,y" -> 编号
    this.frags = {};     // "x,y" -> 碎片编号
    this.hidden = {};    // "x,y" -> 碎片编号（需放大镜）
    let chestN = 0, fragN = 0, hidN = 0;

    const IN_TEX = { W:'t_iwall', F:'t_floor', D:'t_exit', u:'t_cabinet', t:'t_table', p:'t_plant', B:'t_bed', N:'t_floor' };
    for (let y = 0; y < this.gh; y++) {
      for (let x = 0; x < this.gw; x++) {
        const ch = this.rows[y][x];
        const key = x + ',' + y;
        if (this.indoor) {
          this.add.image(x * TILE + 16, y * TILE + 16, 't_floor').setScale(2);
          this.add.image(x * TILE + 16, y * TILE + 16, IN_TEX[ch] || 't_floor').setScale(2);
          if (HOUSE_BLOCK.includes(ch)) this.blocked.add(key);
          if ('utp'.includes(ch)) { this.furn = this.furn || {}; this.furn[key] = true;
            if ((GS.searched[this.indoor] || []).includes(key))
              this.add.text(x * TILE + 16, y * TILE + 2, '·', { fontSize: '16px', color: '#8a7548' }).setOrigin(0.5).setDepth(6);
          }
          if (ch === 'N') {
            this.add.image(x * TILE + 16, y * TILE + 16, NPCS[house.owner].tex).setScale(2).setDepth(5);
            this.ownerTile = { x, y };
            this.makeMark(x, y, house.owner);
          }
          if (ch === 'D') this.exitTile = { x, y };
          continue;
        }
        let tex = TILE_TEX[ch];
        if (!tex) tex = GS.chapter === 0 ? (y < 15 ? 't_grass' : 't_sand') : 't_stone';
        this.add.image(x * TILE + 16, y * TILE + 16, tex).setScale(2);
        if (BLOCK_CHARS.includes(ch)) this.blocked.add(key);
        if (ch === 'd') this.doors.add(key);

        if (ch === 'c') {
          const n = chestN++;
          this.chests[key] = n;
          const opened = GS.chests.includes(n);
          const spr = this.add.image(x * TILE + 16, y * TILE + 16, opened ? 't_chest_open' : 't_chest').setScale(2).setDepth(4);
          this.chests[key + '_spr'] = spr;
          if (!opened) this.blocked.add(key);   // 未开的箱子挡路，撞它=开箱
        } else if (ch === 'p') {
          const n = fragGlobal(GS.chapter, fragN++);
          if (!GS.frags.includes(n)) {
            this.frags[key] = n;
            const spr = this.add.image(x * TILE + 16, y * TILE + 16, 'frag').setScale(2).setDepth(4);
            this.tweens.add({ targets: spr, y: spr.y - 5, duration: 800, yoyo: true, repeat: -1 });
            this.frags[key + '_spr'] = spr;
          }
        } else if (ch === 'h') {
          const n = fragGlobal(GS.chapter, 5 + hidN++);   // 隐藏处放的是本章第6~8页
          if (!GS.frags.includes(n)) {
            this.hidden[key] = n;
            if (GS.tools.includes(CHAPTER.hiddenTool)) {   // 有对应工具才看得见
              const spr = this.add.image(x * TILE + 16, y * TILE + 16, 'sparkle').setScale(2).setDepth(4);
              this.tweens.add({ targets: spr, alpha: 0.3, scale: 1.6, duration: 600, yoyo: true, repeat: -1 });
              this.hidden[key + '_spr'] = spr;
            }
          }
        } else if (ch === 'D') {
          this.add.image(x * TILE + 16, y * TILE + 16, 't_dungeon').setScale(2).setDepth(4);
        } else if (ch === 'G') {
          if (GS.flags.puzzle) {
            this.blocked.delete(key);   // 解开迷宫 → 石门打开
          } else {
            this.add.image(x * TILE + 16, y * TILE + 16, 't_gate').setScale(2).setDepth(4);
          }
        }
      }
    }

    // --- NPC ---
    if (!this.indoor) for (let y = 0; y < MAPH; y++) for (let x = 0; x < MAPW; x++) {
      const ch = MAP[y][x];
      if (NPCS[ch]) {
        this.add.image(x * TILE + 16, y * TILE + 16, NPCS[ch].tex).setScale(2).setDepth(5);
        this.blocked.add(x + ',' + y);
        this.npcs[x + ',' + y] = ch;
        this.makeMark(x, y, ch);
      } else if (ch === 'b' && GS.quest.dodo === 'taken') {
        // 朵朵的作业本（只在接了委托后出现）
        const spr = this.add.image(x * TILE + 16, y * TILE + 16, 'frag').setScale(2).setDepth(4).setTint(0x9fd8f0);
        this.tweens.add({ targets: spr, y: spr.y - 5, duration: 800, yoyo: true, repeat: -1 });
        this.book = { x, y, spr };
      }
    }

    // --- 水晶 & 魔王 ---
    this.bossTile = CHAPTER.bossTile;
    const ct = CHAPTER.crystalTile;
    if (!GS.flags.boss && !this.indoor) {
      this.crystal = this.add.image(ct.x * TILE + 16, ct.y * TILE + 16, 'crystal').setScale(2).setDepth(5);
      this.tweens.add({ targets: this.crystal, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
      this.bossSprite = this.add.image(this.bossTile.x * TILE + 16, this.bossTile.y * TILE + 10, ENEMIES[CHAPTER.boss].tex).setScale(2.5).setDepth(6);
    }

    // --- 小怪 ---
    if (!this.indoor) SPAWNS.forEach((s, i) => {
      const spr = this.add.image(s.x * TILE + 16, s.y * TILE + 16, ENEMIES[s.k].tex).setScale(2).setDepth(6);
      this.mobs.push({ id: i, k: s.k, x: s.x, y: s.y, home: { x: s.x, y: s.y }, sprite: spr, dead: false });
      this.time.addEvent({ delay: 900 + i * 173, loop: true, callback: () => this.mobStep(this.mobs[i]) });
    });

    // --- 怨念怪 ---
    this.revengeSprite = null;
    this.checkRevenge();

    // --- 玩家（位置持久化，从迷宫/战斗回来不会被传送回村） ---
    let st = GS.pos || PLAYER_START;
    if (this.indoor) {
      let ex = null;
      for (let y = 0; y < this.gh; y++) for (let x = 0; x < this.gw; x++) if (this.rows[y][x] === 'D') ex = { x, y };
      st = { x: ex.x, y: ex.y - 1 };
    }
    this.px = st.x; this.py = st.y;
    this.player = this.add.image(this.px * TILE + 16, this.py * TILE + 16, 'hero_d').setScale(2).setDepth(10);

    // --- 相机 ---
    if (this.indoor) {
      this.cameras.main.removeBounds();
      this.cameras.main.centerOn(this.gw * TILE / 2, this.gh * TILE / 2 - 40);
      this.add.text(W / 2, 60, this.houseName, { fontSize: '26px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(100);
      this.add.text(W / 2, 96, '面朝柜子按 A 就能翻一翻　·　走到门口出去',
        { fontSize: '15px', fontFamily: FONT, color: '#8090b8' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    } else {
      this.cameras.main.setBounds(0, 0, MAPW * TILE, MAPH * TILE);
      this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    }

    // --- HUD ---
    this.hudBg = this.add.rectangle(120, 36, 224, 56, 0x14182e, 0.85).setScrollFactor(0).setDepth(100).setStrokeStyle(2, 0xf4e6c0);
    this.hudText = this.add.text(20, 16, '', { fontSize: '17px', fontFamily: FONT, color: '#fff', lineSpacing: 4 }).setScrollFactor(0).setDepth(100);
    this.updateHUD();

    // --- 菜单按钮（装备 / 非战斗魔法） ---
    this.repelSteps = 0;
    makeButton(this, 398, 38, 132, 62, '☰ 菜单', () => {
      if (this.dialog.open || this.inBattle) return;
      this.openMenu();
    }, { fontSize: '20px' }).bg.setScrollFactor(0).setDepth(100);
    this.children.list.filter(o => o.type === 'Text' && o.text === '☰ 菜单')
      .forEach(o => o.setScrollFactor(0).setDepth(101));

    // --- 方向键 + A/B ---
    this.makeDpad();
    this.makeAB();
    this.cursors = this.input.keyboard.createCursorKeys();

    // --- 对话框 ---
    this.dialog = new DialogBox(this);

    // --- 头顶标记：定时刷新 ---
    this.refreshMarks();
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.refreshMarks() });

    // --- 唤醒（战斗结束回来） ---
    this.events.on('wake', () => this.onWake());

    // --- 开场剧情 ---
    if (!GS.flags.intro) {
      this.time.delayedCall(400, () => {
        if (GS.chapter === 1) {
          this.dialog.say([
            '（回廊的镇子很安静。）',
            '桌子只剩一半，锅被劈成了三份，\n门板整整齐齐码在墙边。',
            '一个女孩坐在台阶上，\n面前摆着两堆一样多的石子。',
            '「巨人说，什么都要分匀。」\n「分不匀的，他就拿走。」',
            '回廊绕一圈就是一整天。\n中间的天井里，水晶在发光。',
          ], () => { GS.flags.intro = true; saveGame(); this.banner('第二章 · 除法回廊'); });
          return;
        }
        this.dialog.say([
          '暑假第一天，你翻开课本——咦？\n字和数字正在一个个消失！',
          '一道白光闪过……\n你被吸进了课本里的【知识王国】。',
          '村长：勇者啊！遗忘魔王偷走了记忆水晶，\n知识精灵都变成了怪物！',
          '村长：去南边的沙漠打败【口诀骆驼王】，\n夺回第一颗水晶吧！',
          '提示：碰到怪物就会战斗。\n答对题目=攻击，连对3题触发暴击！',
        ], () => { GS.flags.intro = true; saveGame(); this.banner('第一章 · 乘法口诀沙漠'); });
      });
    }
  }

  banner(txt) {
    const t = this.add.text(W / 2, 300, txt, { fontSize: '30px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold', stroke: '#000', strokeThickness: 5 })
      .setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 600, hold: 1600, yoyo: true, onComplete: () => t.destroy() });
  }

  makeDpad() {
    // 小孩手指按的，方向键要够大：62 逻辑像素在手机上约 50pt（Apple 建议最小 44pt）
    const cx = 100, cy = 726, sz = 62, gap = 66;
    const dirs = [ ['up', cx, cy - gap, '▲'], ['down', cx, cy + gap, '▼'], ['left', cx - gap, cy, '◀'], ['right', cx + gap, cy, '▶'] ];
    dirs.forEach(([d, x, y, ch]) => {
      const r = this.add.rectangle(x, y, sz, sz, 0x14182e, 0.45).setScrollFactor(0).setDepth(90)
        .setStrokeStyle(2, 0xf4e6c0, 0.6).setInteractive();
      this.add.text(x, y, ch, { fontSize: '22px', color: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(90).setAlpha(0.7);
      // ponytail: queued 让"轻点一下"也能走一格 —— pointerup 会在 update() 读到 held 之前就清空它
      r.on('pointerdown', () => {
        // 对话选项开着时，上下键改成移动光标
        if (this.dialog.hasChoices()) {
          if (d === 'up') this.dialog.moveSel(-1);
          else if (d === 'down') this.dialog.moveSel(1);
          return;
        }
        if (this.dialog.open) return;
        this.held = d; this.queued = d;
      });
      r.on('pointerover', p => { if (p.isDown) this.held = d; });
    });
    this.input.on('pointerup', () => { this.held = null; });
  }

  // A = 确认 / 对话 / 打开菜单；B = 取消 / 返回 / 关闭
  makeAB() {
    const A = makeButton(this, 392, 690, 80, 80, 'A', () => this.pressA(), { fontSize: '30px', color: 0x3a6b45 });
    const B = makeButton(this, 306, 756, 68, 68, 'B', () => this.pressB(), { fontSize: '26px', color: 0x8a3a3a });
    [A, B].forEach(b => { b.bg.setScrollFactor(0).setDepth(90); b.txt.setScrollFactor(0).setDepth(91); });
    this.input.keyboard.on('keydown-Z', () => this.pressA());
    this.input.keyboard.on('keydown-X', () => this.pressB());
  }

  pressA() {
    if (this.inBattle) return;
    if (this.dialog.hasChoices()) { this.dialog.confirmSel(); return; }
    if (this.dialog.open) { this.dialog.lastTap = 0; this.dialog.tap(); return; }
    if (this.interactFront()) return;
    this.openMenu();
  }

  pressB() {
    if (this.inBattle) return;
    if (this.dialog.hasChoices()) { this.dialog.cancelSel(); return; }
    if (this.dialog.open) { this.dialog.skip(); return; }
  }

  // 面朝方向的那一格有东西就交互（不用再撞上去）
  interactFront() {
    if (this.moving) return false;
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.facing || 'down'];
    const nx = this.px + dx, ny = this.py + dy;
    if (nx < 0 || ny < 0 || nx >= this.gw || ny >= this.gh) return false;
    const key = nx + ',' + ny;
    if (this.indoor) {
      const c = this.rows[ny][nx];
      if (c === 'N') { this.talkNpc(HOUSES[this.indoor].owner); return true; }
      if (this.furn && this.furn[key]) { this.searchFurn(key, nx, ny); return true; }
      if (c === 'D') { this.leaveHouse(); return true; }
      return false;
    }
    const ch = MAP[ny][nx];

    if (this.npcs[key]) { this.talkNpc(this.npcs[key]); return true; }
    if (this.chests[key] !== undefined && !GS.chests.includes(this.chests[key])) {
      this.tryChest(key, this.chests[key]); return true;
    }
    if (this.frags[key] !== undefined) { this.pickFrag(key, this.frags[key], false); return true; }
    if (this.hidden[key] !== undefined) {
      if (!GS.tools.includes(CHAPTER.hiddenTool)) { this.dialog.say([GS.chapter === 0 ? '这里的沙子好像有点不一样……\n可是什么也看不出来。' : '墙缝里好像卡着什么……\n可是手伸不进去。']); return true; }
      this.pickFrag(key, this.hidden[key], true); return true;
    }
    if (ch === 'd') {
      if (HOUSES[key]) this.enterHouse(key);
      else this.dialog.say(['门锁着……里面好像没有人。']);
      return true;
    }
    if (ch === 'D') { this.enterDungeon(); return true; }
    if (ch === 'G' && !GS.flags.puzzle) {
      this.dialog.say([
        '一扇巨大的石门，上面刻着乘法口诀。',
        '门缝里透出光，可是推不开——\n旁边那个石室里好像有机关。',
      ]);
      return true;
    }
    if (!GS.flags.boss && nx === this.bossTile.x && ny === this.bossTile.y) {
      const bn = ENEMIES[CHAPTER.boss].name;
      this.dialog.say([GS.chapter === 0
        ? '哞——想要水晶？\n先把乘法口诀背熟再来吧，小豆丁！'
        : '想过去？先证明你会分东西。\n分不匀的人，我不放行。'], () => {
        this.dialog.choice(`要挑战${bn}吗？`, ['挑战！', '先撤退…'], i => {
          if (i === 0) this.startBattle(ENEMIES[CHAPTER.boss], { boss: true });
        });
      }, '口诀骆驼王');
      return true;
    }
    return false;
  }

  updateHUD() {
    const p = GS.p;
    this.hudText.setText(`勇者 Lv${p.lv}   💰${p.gold}\nHP ${p.hp}/${p.maxhp}  MP ${p.mp}/${p.maxmp}`);
  }

  update() {
    // 看门狗：inBattle 是给战斗/室内/迷宫用的输入锁，万一子场景没走正常出口就结束了要兜底解锁。
    // 但必须留宽限期 —— 开战有 260ms 转场，这段时间子场景还没起来，
    // 提前解锁会让玩家按住的方向继续生效，一步踏进下一只怪，战斗套战斗出不来。
    if (this.inBattle) {
      const running = ['Battle', 'Puzzle', 'Candy'].some(k => this.scene.isActive(k));
      if (running) this.lockedAt = 0;
      else {
        if (!this.lockedAt) this.lockedAt = this.time.now;
        else if (this.time.now - this.lockedAt > 2000) { this.inBattle = false; this.lockedAt = 0; }
      }
    } else this.lockedAt = 0;
    if (this.moving || this.inBattle || this.dialog.open) return;
    let d = this.queued;
    this.queued = null;
    if (d) { this.tryStep(d); return; }
    if (this.cursors.up.isDown || this.held === 'up') d = 'up';
    else if (this.cursors.down.isDown || this.held === 'down') d = 'down';
    else if (this.cursors.left.isDown || this.held === 'left') d = 'left';
    else if (this.cursors.right.isDown || this.held === 'right') d = 'right';
    if (d) this.tryStep(d);
  }

  tryStep(dir) {
    this.facing = dir;
    const delta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const tex = { up: 'hero_u', down: 'hero_d', left: 'hero_s', right: 'hero_s' }[dir];
    this.player.setTexture(tex).setFlipX(dir === 'left');
    const nx = this.px + delta[0], ny = this.py + delta[1];
    if (nx < 0 || ny < 0 || nx >= this.gw || ny >= this.gh) return;
    const key = nx + ',' + ny;

    // ---- 室内 ----
    if (this.indoor) {
      if (this.rows[ny][nx] === 'D') { this.leaveHouse(); return; }
      if (this.blocked.has(key)) return;                 // 家具/屋主挡住，按 A 才交互
      this.moving = true; this.px = nx; this.py = ny;
      this.tweens.add({ targets: this.player, x: nx * TILE + 16, y: ny * TILE + 16,
        duration: Math.max(70, 150 - totalSpd() * 12), onComplete: () => { this.moving = false; } });
      return;
    }

    // 怪物
    const mob = this.mobs.find(m => !m.dead && m.x === nx && m.y === ny);
    if (mob) { this.startBattle(ENEMIES[mob.k], { mid: mob.id }); return; }
    if (this.revengeSprite && this.revengeSprite.gx === nx && this.revengeSprite.gy === ny) {
      this.startBattle(ENEMIES.revenge, { revenge: true }); return;
    }
    // 地上捡的东西：走过去自动拿（这类不挡路）
    if (this.book && this.book.x === nx && this.book.y === ny) {
      this.book.spr.destroy(); this.book = null;
      GS.quest.dodo = 'found'; saveGame();
      this.dialog.say(['捡到了一本浅蓝色封面的作业本。', '是朵朵丢的那本吧？\n拿回村里还给她。']);
      return;
    }
    if (this.frags[key] !== undefined) { this.pickFrag(key, this.frags[key], false); return; }
    if (this.hidden[key] !== undefined) {
      if (!GS.tools.includes(CHAPTER.hiddenTool)) { this.dialog.say([GS.chapter === 0 ? '这里的沙子好像有点不一样……\n可是什么也看不出来。' : '墙缝里好像卡着什么……\n可是手伸不进去。']); return; }
      this.pickFrag(key, this.hidden[key], true); return;
    }
    // 门：走进去就进屋，不用按 A
    if (this.doors.has(key)) {
      if (HOUSES[key]) this.enterHouse(key);
      else this.dialog.say(['门锁着……里面好像没有人。']);
      return;
    }
    // 其余挡路的东西（NPC / 宝箱 / 石门 / 魔王 / 迷宫）撞上去只是挡住，
    // 要面朝它按 A 才交互 —— 经典 DQ 规则
    if (this.blocked.has(key)) return;

    // 移动（鞋子加速：孩子唯一能用眼睛立刻看出来的属性）
    this.moving = true;
    this.px = nx; this.py = ny;
    GS.pos = { x: nx, y: ny };
    if (this.repelSteps > 0) this.repelSteps--;
    this.tweens.add({
      targets: this.player, x: nx * TILE + 16, y: ny * TILE + 16,
      duration: Math.max(70, 150 - totalSpd() * 12),
      onComplete: () => { this.moving = false; },
    });
  }

  mobStep(mob) {
    if (mob.dead || this.inBattle || this.dialog.open) return;
    if (this.repelSteps > 0) return;   // 避敌术生效中，小怪不动
    const dirs = Phaser.Utils.Array.Shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
    for (const [dx, dy] of dirs) {
      const nx = mob.x + dx, ny = mob.y + dy;
      if (ny < 16 || ny > 47 || nx < 1 || nx > 13) continue;
      if (this.blocked.has(nx + ',' + ny)) continue;
      if (nx === this.px && ny === this.py) continue;
      if (this.mobs.some(m => !m.dead && m !== mob && m.x === nx && m.y === ny)) continue;
      if (Math.abs(nx - mob.home.x) > 3 || Math.abs(ny - mob.home.y) > 3) continue;
      mob.x = nx; mob.y = ny;
      this.tweens.add({ targets: mob.sprite, x: nx * TILE + 16, y: ny * TILE + 16, duration: 250 });
      return;
    }
  }

  // 头顶标记：! = 有新话/任务可推进，? = 任务进行中还没到时候，null = 不用管
  // 传话委托要来回跑，所以标记必须跟着进度实时变
  npcMark(id) {
    const npc = NPCS[id];
    if (!npc) return null;
    const talked = (GS.talked || []).includes(GS.chapter + ':' + id);
    switch (npc.role) {
      case 'clue': return GS.clues.includes(npc.clue) ? null : '!';
      case 'lore': return GS.chapter === 1
        ? (GS.clues.includes('c2d') ? null : '!')
        : (talked ? null : '!');
      case 'quest': {
        if (GS.chapter === 1) {                    // 小满：传话
          const st = GS.quest.step;
          if (!st) return '!';                     // 还没接
          if (st === 'back_girl') return '!';       // 该把阿力的话带回来
          if (st === 'done') return null;
          return '?';
        }
        const st = GS.quest.dodo;                  // 朵朵：取物
        if (!st) return '!';
        if (st === 'found') return '!';            // 捡到了，回去交
        if (st === 'done') return null;
        return '?';
      }
      case 'chat': {
        if (GS.chapter === 1) {                    // 阿力兼传话对象
          const st = GS.quest.step;
          if (st === 'ask_boy' || st === 'back_boy') return '!';
          if (st === 'back_girl') return '?';
        }
        return talked ? null : '!';
      }
      case 'elder':
        if (GS.flags.boss && GS.chapter + 1 < CHAPTERS.length) return '!';   // 可以出发去下一章
        return talked ? null : '!';
      default: return null;                        // 商人/老师是服务，不标
    }
  }

  // 每半秒刷一遍：比在每处状态变更里手动挂钩可靠得多
  refreshMarks() {
    (this.marks || []).forEach(m => {
      const t = this.npcMark(m.id);
      m.txt.setText(t || '').setColor(t === '!' ? '#ffe14d' : '#a8b0c8');
      m.txt.setVisible(!!t);
    });
  }

  makeMark(x, y, id) {
    const txt = this.add.text(x * TILE + 16, y * TILE - 8, '', {
      fontSize: '26px', fontFamily: FONT, fontStyle: 'bold',
      stroke: '#1a1a22', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: txt, y: txt.y - 6, duration: 600, yoyo: true, repeat: -1 });
    (this.marks = this.marks || []).push({ id, txt });
  }

  // 记下线索：屏幕闪一下，孩子才知道"这句话被存起来了"
  addClue(key) {
    if (GS.clues.includes(key)) return false;
    GS.clues.push(key);
    saveGame();
    const t = this.add.text(W / 2, 150, '📓 记到线索本里了', {
      fontSize: '22px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: t, y: 110, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
    return true;
  }

  talkNpc(id) {
    GS.talked = GS.talked || [];
    const tk = GS.chapter + ':' + id;
    if (!GS.talked.includes(tk)) { GS.talked.push(tk); saveGame(); }
    const npc = NPCS[id];
    if (npc && npc.role === 'clue')   { this.npcClue(id, npc); return; }
    if (npc && npc.role === 'quest')  { this.npcQuest(id, npc); return; }
    if (npc && npc.role === 'lore')   { this.npcLore(npc); return; }
    if (npc && npc.role === 'chat')   { this.npcChat(npc); return; }
    if (id === '1') { // 村长
      if (GS.flags.boss && GS.chapter + 1 < CHAPTERS.length) { this.elderTravel(); return; }
      const lines = GS.flags.boss
        ? ['你夺回了记忆水晶，太了不起了！',
           GS.frags.length < 8
             ? `不过你手上那些发黄的纸……\n本章还差 ${8 - chapterFrags()} 页呢。\n用${CHAPTER.toolName}再找找看。`
             : '这一章的八页你都拼齐了。\n可日记明显还没写完——\n后面的页数，大概散在别的地方。']
        : [GS.chapter === 0 ? '南边沙漠里的口诀骆驼王守着记忆水晶。' : '回廊尽头的分糖巨人守着第二颗水晶。',
           '路上有一扇大石门，推不开的。\n旁边石室里有会动的石箱，\n那是开门的机关。',
           '沙漠两边的岔路你也去看看，\n听说藏着别人丢下的东西。',
           '答错的题会变成【怨念怪】出现在村口，\n打败它才算真正学会哦！'];
      this.dialog.say(lines, () => {
        this.dialog.choice('要在村长家休息一下吗？（免费恢复）', ['休息（恢复HP/MP）', '不用了'], i => {
          if (i === 0) {
            GS.p.hp = GS.p.maxhp; GS.p.mp = GS.p.maxmp; saveGame();
            this.updateHUD();
            this.dialog.say(['你美美地睡了一觉，\nHP 和 MP 全部恢复了！']);
          }
        });
      }, '村长');
    } else if (id === '2') { // 商人
      this.openShop();
    } else if (id === '3') { // 老师
      this.dialog.say(['想练习吗？在我这里答题不会受伤，\n也没有奖励，放心练！'], () => {
        this.dialog.choice('练习什么？', ['数学（乘法+加减）', '语文（生字+古诗）', '不练了'], i => {
          if (i === 2) return;
          const def = Object.assign({}, ENEMIES.dummy, { qtype: i === 0 ? 'mixedmath' : 'chinese' });
          this.startBattle(def, {});
        });
      }, '老师');
    }
  }

  openMenu() {
    const p = GS.p;
    this.dialog.choice(
      `勇者 Lv${p.lv}　💰${p.gold}\nHP ${p.hp}/${p.maxhp}　MP ${p.mp}/${p.maxmp}\n⚔️${totalAtk()} 🛡️${totalDef()} 👟${totalSpd()} 🧠${totalInt()}`,
      ['🎽 装备栏', '✨ 魔法（野外）', `📖 冒险手册（本章 ${chapterFrags()}/8）`,
       ...(GS.chapter > 0 ? ['🚪 回到上一章'] : []), '关闭'], i => {
        if (i === 0) this.equipMenu(() => this.openMenu());
        else if (i === 1) this.fieldSpells();
        else if (i === 2) this.handbook();
        else if (i === 3 && GS.chapter > 0) this.gotoChapter(GS.chapter - 1);
      });
  }

  // 章节跳转：可以回上一章补没拿到的碎片（放大镜/钩爪是打完 Boss 才有的）
  gotoChapter(idx) {
    const c = CHAPTERS[idx];
    const left = 8 - fragsOfChapter(idx, GS.frags).length;
    this.dialog.choice(
      `回到${c.name}？\n那边还有 ${left} 页日记没找到。\n（等级、装备、日记都会带着）`,
      ['回去看看', '不用了'], i => {
        if (i !== 0) return;
        GS.chapter = idx;
        GS.flags = { intro: true, boss: true, puzzle: true };   // 旧章节的门都已开
        GS.chests = []; GS.locks = []; GS.rooms = [0, 1, 2];
        GS.clues = []; GS.quest = {}; GS.pos = null;
        loadChapter(idx);
        saveGame();
        this.scene.start('World');
      });
  }

  handbook() {
    const toolTxt = GS.tools.length ? GS.tools.map(t => t === 'lens' ? '🔍放大镜' : t).join(' ') : '（还没有）';
    this.dialog.choice(
      `冒险手册　${CHAPTER.name}\n本章碎片 ${chapterFrags()}/8　全书 ${GS.frags.length}/${TOTAL_FRAGS}\n图鉴 ${GS.dex.length}　线索 ${GS.clues.length}　${toolTxt}`,
      ['📓 线索本', '📜 捡到的日记', '👾 怪物图鉴', '↩️ 返回'], i => {
        if (i === 0) this.showClues();
        else if (i === 1) this.readDiary();
        else if (i === 2) this.showDex();
        else this.openMenu();
      });
  }

  // 线索本：按"服务于哪个锁"分组。孩子不需要"想起来"，只需要"看得到"
  showClues() {
    const groups = {};
    Object.entries(CLUES).forEach(([k, c]) => {
      (groups[c.lock] = groups[c.lock] || []).push({ k, c });
    });
    const lines = [];
    const codeLock = CHEST_LOCKS.findIndex(l => l.kind === 'code');
    const solved = GS.locks.includes(codeLock);

    if (!GS.clues.length) {
      this.dialog.say(['线索本还是空的。',
        '去和村里的人聊聊吧——\n他们知道的比看上去多。'], () => this.handbook());
      return;
    }

    const chest = groups.chest3 || [];
    const left = chest.filter(x => !GS.clues.includes(x.k)).length;
    lines.push(`${solved ? '✅' : '🔒'} 沙漠尽头的宝箱口令` + (solved ? '（已开）' : `（差${left}条）`));
    chest.forEach(({ k, c }) => {
      // 一行一条，短到不会折行
      lines.push(GS.clues.includes(k) ? `✓ ${c.from}：${c.note}` : '✗ ？？？还没问到');
    });

    const lore = (groups.lore || []).filter(x => GS.clues.includes(x.k));
    if (lore.length) {
      lines.push('📌 其他消息');
      lore.forEach(({ c }) => lines.push(`· ${c.from}：${c.note}`));
    }
    // 分页交给对话框自己算（它知道自己装得下几行）
    this.dialog.say([lines.join('\n')], () => this.handbook());
  }

  readDiary() {
    if (!GS.frags.length) {
      this.dialog.say(['你还没有找到任何记忆碎片。\n沙漠的支路里好像藏着什么……'], () => this.handbook());
      return;
    }
    const sorted = GS.frags.slice().sort((a, b) => a - b);
    const lines = ['这是一本日记，字迹很小心。'];
    let lastCh = -1;
    sorted.forEach(n => {
      const ch = Math.floor(n / 8);
      if (ch !== lastCh) { lines.push(`—— 在${CHAPTERS[ch].name}捡到的 ——`); lastCh = ch; }
      const f = fragText(n);
      if (f) lines.push(f.text);
    });
    const total = TOTAL_FRAGS;
    if (GS.frags.length < total) {
      lines.push(`已拼出 ${GS.frags.length}/${total} 页。\n断掉的地方，读不下去。`);
    } else {
      lines.push('整本都拼齐了。');
    }
    this.dialog.say(lines, () => this.handbook());
  }

  showDex() {
    const all = GS.chapter === 0 ? ['slime','imp','wraith','revenge','boss'] : ['spider','imp2','owl','revenge','boss2'];
    const lines = [`图鉴 ${GS.dex.length}/${all.length}`];
    all.forEach(k => {
      const e = ENEMIES[k];
      lines.push(GS.dex.includes(k)
        ? `✨ ${e.name}\nHP${e.hp} 防御${e.def} 攻击${e.atk}\n已唤醒，最终战能召唤它`
        : `？？？\n还没有唤醒过`);
    });
    lines.push('唤醒的精灵越多，\n最后越有用。');
    this.dialog.say(lines, () => this.handbook());
  }

  fieldSpells() {
    const keys = learned().filter(k => SPELLS[k].kind === 'field');
    if (!keys.length) {
      this.dialog.say(['你还没有学会野外魔法。\n升到 6 级就能学【归乡术】了！'], () => this.openMenu());
      return;
    }
    const labels = keys.map(k => `${SPELLS[k].name} (MP${SPELLS[k].mp}) - ${SPELLS[k].desc}`);
    labels.push('↩️ 返回');
    this.dialog.choice(`用什么魔法？  MP ${GS.p.mp}/${GS.p.maxmp}`, labels, i => {
      if (i >= keys.length) { this.openMenu(); return; }
      const key = keys[i], s = SPELLS[key];
      if (GS.p.mp < s.mp) { this.dialog.say([`MP 不够用【${s.name}】了。`], () => this.fieldSpells()); return; }
      GS.p.mp -= s.mp;
      saveGame(); this.updateHUD();

      if (key === 'gohome') {
        this.px = PLAYER_START.x; this.py = PLAYER_START.y;
        this.player.setPosition(this.px * TILE + 16, this.py * TILE + 16);
        this.cameras.main.flash(300, 255, 255, 255);
        this.dialog.say(['【归乡术】！\n一阵白光，你回到了村庄。']);
      } else if (key === 'seek') {
        const chestLeft = CHESTS.length - GS.chests.length;
        const fragLeft = FRAGMENTS.length - GS.frags.length;
        const hidLeft = Object.keys(this.hidden).filter(k => !k.endsWith('_spr')).length;
        const hasLens = GS.tools.includes('lens');
        const lines = ['【探宝术】！\n一阵微光扫过沙漠……'];
        lines.push(`还没开的宝箱：${chestLeft} 个\n还没找到的碎片：${fragLeft} 页`);
        if (hidLeft > 0) {
          lines.push(hasLens
            ? `沙子下面还埋着 ${hidLeft} 处东西。\n拿着放大镜走过去，会发光。`
            : `沙子下面还埋着 ${hidLeft} 处东西，\n可是你还没有能看见它们的宝物。\n（打败沙漠尽头的 Boss 就有了）`);
        } else if (fragLeft === 0 && chestLeft === 0) {
          lines.push('这张地图上的东西，\n你已经全部找到了。');
        }
        this.dialog.say(lines);
      } else if (key === 'repel') {
        this.repelSteps = 200;
        this.dialog.say(['【避敌术】！\n接下来 200 步，小怪不会靠近你。']);
      }
    });
  }

  // 打完 Boss 后，长老指路下一章 —— 让它是一段路，不是一个按钮
  elderTravel() {
    const nx = CHAPTERS[GS.chapter + 1];
    const left = 8 - chapterFrags();
    const intro = GS.chapter === 0
      ? ['你夺回了第一颗水晶！\n可水晶一直在抖……',
         '（长老捧起水晶，它慢慢转向北方。）',
         '它在指路。\n第二颗水晶在【除法回廊】。',
         '那地方原本热闹。\n直到一个巨人住了进去 ——',
         '他不抢东西，他"分"东西。\n什么都要分成一样多的几份。',
         '锅碗、粮食、连门板都拆了平分。\n分不完的零头堆在角落，谁也不敢动。']
      : ['水晶又开始指路了……'];
    if (left > 0) intro.push(`对了，你手上那本日记 ——\n本章还差 ${left} 页。\n（出发前可以再找找）`);
    this.dialog.say(intro, () => {
      this.dialog.choice('现在就出发去除法回廊吗？', ['出发', '再等等'], i => {
        if (i !== 0) { this.dialog.say(['不急，随时来找我。'], null, '长老'); return; }
        this.travelTo(GS.chapter + 1);
      });
    }, '长老');
  }

  // 旅行过场：黑屏 + 旁白，走完才落地
  travelTo(idx) {
    this.inBattle = true;
    const cam = this.cameras.main;
    cam.fadeOut(700, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      const veil = this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setScrollFactor(0).setDepth(400);
      const txt = this.add.text(W / 2, H / 2, '', { fontSize: '21px', fontFamily: FONT, color: '#ffe08a',
        align: 'center', wordWrap: { width: 400 }, lineSpacing: 10 }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
      cam.fadeIn(1, 0, 0, 0);
      const beats = [
        '你跟着水晶往北走。',
        '沙子渐渐变成石板。',
        '风声停了，脚步声开始有回音。',
        '一圈一圈的石廊立在眼前 ——\n【除法回廊】。',
      ];
      let k = 0;
      const step = () => {
        if (k >= beats.length) {
          veil.destroy(); txt.destroy();
          this.enterChapter(idx);
          return;
        }
        txt.setText(beats[k++]).setAlpha(0);
        this.tweens.add({ targets: txt, alpha: 1, duration: 500, hold: 1100, yoyo: true, onComplete: step });
      };
      step();
    });
  }

  enterChapter(idx) {
    GS.chapter = idx;
    GS.flags = { intro: false, boss: false, puzzle: false };
    GS.chests = []; GS.locks = []; GS.rooms = [];
    GS.clues = []; GS.quest = {}; GS.searched = {}; GS.pool = [];
    GS.pos = null; GS.lastBattle = null; GS.fromPuzzle = false; GS.indoor = null; GS.outPos = null;
    loadChapter(idx);
    GS.p.hp = GS.p.maxhp; GS.p.mp = GS.p.maxmp;
    saveGame();
    this.scene.start('World');
  }

  openShop() {
    this.dialog.choice(`欢迎光临！💰${GS.p.gold}`,
      ['🛒 买装备', '💰 卖装备（原价75%）', '🧪 买道具', '🎽 换装备', '离开'], i => {
        if (i === 0) this.shopBuy();
        else if (i === 1) this.shopSell();
        else if (i === 2) this.shopItems();
        else if (i === 3) this.equipMenu(() => this.openShop());
      });
  }

  // 分页选择菜单：每页 4 项，「返回」永远存在 —— 少了它就是死路（曾经买装备就出不来）
  pagedChoice(title, items, onPick, onBack, page = 0) {
    const PER = 4;
    const pages = Math.max(1, Math.ceil(items.length / PER));
    if (page >= pages) page = 0;
    const slice = items.slice(page * PER, page * PER + PER);
    const labels = slice.map(it => (it.tint ? { label: it.label, tint: it.tint } : it.label));
    const acts = slice.map((_, i) => () => onPick(page * PER + i));
    if (pages > 1) {
      labels.push(`▼ 下一页 (${page + 1}/${pages})`);
      acts.push(() => this.pagedChoice(title, items, onPick, onBack, page + 1));
    }
    labels.push('↩️ 返回');
    acts.push(onBack);
    this.dialog.choice(title, labels, i => acts[i]());
  }

  shopItems() {
    const p = GS.p;
    const items = [
      [`药水 15G（HP+40，现有${p.potion}）`, 15, () => p.potion++],
      [`魔法药水 25G（MP+30，现有${p.ether}）`, 25, () => p.ether++],
      [`提示卷轴 20G（现有${p.scroll}）`, 20, () => p.scroll++],
      ['↩️ 返回', 0, null],
    ];
    this.dialog.choice(`买什么道具？  💰${p.gold}`, items.map(x => x[0]), i => {
      const [, cost, act] = items[i];
      if (!act) { this.openShop(); return; }
      if (p.gold < cost) { this.dialog.say(['金币不够呀……去打怪赚点吧！'], () => this.shopItems(), '商人'); return; }
      p.gold -= cost; act();
      saveGame(); this.updateHUD();
      this.dialog.say(['买好了，谢谢惠顾！'], () => this.shopItems(), '商人');
    });
  }

  shopBuy() {
    const p = GS.p;
    const stock = SHOP_GEAR.filter(k => p.eq[GEAR[k].slot] !== k && !p.bag.includes(k));
    if (!stock.length) { this.dialog.say(['你把我的货都买光啦！'], () => this.openShop(), '商人'); return; }
    const items = stock.map(k => {
      const g = GEAR[k];
      // 买之前就看得出比现在的好还是差：绿色▲=涨，红色▼=减
      const d = gearDelta(k, g.slot);
      return { label: `${g.name} ${g.buy}G${d.text}`, key: k, tint: d.tint };
    });
    this.pagedChoice(`买什么装备？  💰${p.gold}`, items, idx => {
      const key = items[idx].key, g = GEAR[key];
      if (p.gold < g.buy) { this.dialog.say(['金币不够呀……去打怪赚点吧！'], () => this.shopBuy(), '商人'); return; }
      p.gold -= g.buy;
      const old = p.eq[g.slot];
      p.eq[g.slot] = key;
      if (old && GEAR[old].buy > 0) p.bag.push(old);   // 旧装备进背包，可以卖
      saveGame(); this.updateHUD();
      this.dialog.say([`装备上【${g.name}】了！\n${g.desc}`], () => this.shopBuy(), '商人');
    }, () => this.openShop());
  }

  shopSell() {
    const p = GS.p;
    if (!p.bag.length) { this.dialog.say(['你没有多余的装备可以卖。\n（换下来的旧装备会放进背包）'], () => this.openShop(), '商人'); return; }
    const items = p.bag.map(k => ({ label: `${GEAR[k].name} → 卖 ${sellPrice(k)}G`, key: k }));
    this.pagedChoice(`卖什么？（原价 75% 回收）  💰${p.gold}`, items, idx => {
      const key = items[idx].key;
      p.gold += sellPrice(key);
      p.bag.splice(p.bag.indexOf(key), 1);
      saveGame(); this.updateHUD();
      this.dialog.say([`收下了，给你 ${sellPrice(key)} 金币。`], () => this.shopSell(), '商人');
    }, () => this.openShop());
  }

  equipMenu(back) {
    const p = GS.p;
    const labels = SLOTS.map(s => {
      const g = p.eq[s] ? GEAR[p.eq[s]] : null;
      return `${SLOT_NAME[s]}：${g ? g.name : '（空）'}`;
    });
    labels.push('↩️ 返回');
    this.dialog.choice(`装备栏\n⚔️${totalAtk()} 🛡️${totalDef()} 👟${totalSpd()} 🧠${totalInt()}`, labels, i => {
      if (i >= SLOTS.length) { back(); return; }
      const slot = SLOTS[i];
      const choices = p.bag.filter(k => GEAR[k].slot === slot);
      if (!choices.length) { this.dialog.say(['背包里没有可以换的这个部位装备。'], () => this.equipMenu(back)); return; }
      const items = choices.map(k => {
        const d = gearDelta(k, slot);
        return { label: `${GEAR[k].name}${d.text}`, key: k, tint: d.tint };
      });
      this.pagedChoice(`${SLOT_NAME[slot]} 换成？`, items, idx => {
        const key = items[idx].key;
        const old = p.eq[slot];
        p.eq[slot] = key;
        p.bag.splice(p.bag.indexOf(key), 1);
        if (old && GEAR[old].buy > 0) p.bag.push(old);
        saveGame(); this.updateHUD();
        this.dialog.say([`换上了【${GEAR[p.eq[slot]].name}】！`], () => this.equipMenu(back));
      }, () => this.equipMenu(back));
    });
  }

  // ---- 线索 NPC：握着解谜必需的信息 ----
  npcClue(id, npc) {
    const c = CLUES[npc.clue];
    const first = !GS.clues.includes(npc.clue);
    if (GS.chapter === 1) {
      const said = {
        '4': first ? ['（账房先生噼里啪啦打着算盘。）', c.ask, '信不信由你。']
                   : ['我说过了：口令是 3。'],
        '5': first ? ['来块糖吧，甜的。', c.ask, '我可没骗你哦——大概吧。']
                   : ['我说的是：口令不是 6。'],
        '9': GS.tools.includes('hook')
               ? ['你有钩子了！\n那墙缝里的东西归你了。']
               : first ? ['（货郎放下担子。）', c.ask, '你自己想吧，小家伙。']
                       : ['我说：口令不是 3。\n只有一个人说真话，别忘了。'],
      }[id];
      this.dialog.say(said, () => { if (first) this.addClue(npc.clue); }, npc.name);
      return;
    }
    const lines = {
      '4': first
        ? ['（叮、叮——铁匠头也不抬。）', '沙漠尽头那个箱子？我知道口令。',
           c.ask, '算不出来就别问我了，我忙。']
        : ['第一个数，二三得几。我说过了。'],
      '5': first
        ? ['哎哟，来喝口水吧，沙漠里可干了。',
           '那个上锁的箱子啊，我家老头子当年也开过。', c.ask,
           '哎，人老了记性差，你自己算算。']
        : ['第二个数，二的四倍。别记错了。'],
      '9': GS.tools.includes('lens')
        ? ['你拿到那件宝物了！',
           '那就去吧——沙子会告诉你的。',
           '（旅人指了指沙漠深处。）']
        : first
          ? ['（一个风尘仆仆的旅人坐在石头上。）',
             '我走遍了这片沙漠。', c.ask,
             '现在去找也是白费力气。\n先去打败沙漠尽头那家伙吧。']
          : ['先拿到那件能放大的宝物。\n在那之前，沙子什么也不会告诉你。'],
    }[id];
    this.dialog.say(lines, () => { if (first) this.addClue(npc.clue); }, npc.name);
  }

  // ---- 第2章委托：传话（不是取物）。三趟来回，让两个 NPC 产生关系 ----
  questRelay(npc) {
    const q = GS.quest;
    if (!q.step) {
      this.dialog.say(['（小满背对着你。）', '我才不要先开口。',
        '阿力那天说我……说我笨。', '你去问问他，他敢不敢当面说。'], () => {
        q.step = 'ask_boy'; saveGame();
        this.dialog.say(['（去找阿力问问吧。）']);
      }, npc.name);
    } else if (q.step === 'ask_boy') {
      this.dialog.say(['你问他了吗？'], null, npc.name);
    } else if (q.step === 'back_girl') {
      this.dialog.say(['他说「笨手笨脚」？',
        '……那是我打翻糖罐那天。', '他不是说我笨。他是说我手笨。',
        '（小满小声说：）\n那我也有不对。',
        '你把这句带给他 —— \n就说糖罐我赔他一个。'], () => {
        q.step = 'back_boy'; saveGame();
      }, npc.name);
    } else if (q.step === 'done') {
      this.dialog.say(['我们和好啦！', '对了，那个上锁的箱子……\n我们俩一起想过口令，想不出来。',
        '你去问问镇上那三个人吧。'], null, npc.name);
    } else {
      this.dialog.say(['……他怎么说？'], null, npc.name);
    }
  }

  // 阿力（闲聊 NPC 在第2章兼任传话对象）
  questBoy(npc) {
    const q = GS.quest;
    if (q.step === 'ask_boy') {
      this.dialog.say(['小满让你来的？',
        '我没说她笨啊。', '我说的是「笨手笨脚」——\n她把糖罐打翻了嘛。',
        '……她生气了？'], () => { q.step = 'back_girl'; saveGame(); }, npc.name);
    } else if (q.step === 'back_boy') {
      this.dialog.say(['她说要赔我糖罐？',
        '不用啦！那罐子本来就有裂。',
        '（阿力挠头。）\n……我去找她说说。',
        '谢谢你跑这么多趟。\n这个给你 ——'], () => {
        q.step = 'done';
        GS.p.gold += 150;
        if (!GS.p.bag.includes('hookband')) GS.p.bag.push('hookband');
        saveGame(); this.updateHUD();
        this.dialog.say(['得到 💰150 金币\n和【钩爪腕带】！\n（背包里，可以换上）']);
      }, npc.name);
    } else if (q.step === 'done') {
      this.dialog.say(['我跟小满和好了。', '下次她再打翻糖罐，\n我帮她捡。'], null, npc.name);
    } else {
      this.dialog.say(['我叫阿力。', '回廊里那些蜘蛛，\n最喜欢考除法了。',
        '……小满最近不理我，\n不知道为什么。'], null, npc.name);
    }
  }

  // ---- 委托 NPC：线索要靠帮忙换 ----
  npcQuest(id, npc) {
    if (GS.chapter === 1) { this.questRelay(npc); return; }
    const st = GS.quest.dodo;
    if (!st) {
      this.dialog.say(['呜……我把作业本弄丢了。',
        '我记得是在沙漠里，一个左边的岔路上。', '你能帮我找回来吗？'], () => {
        this.dialog.choice('要接下这个委托吗？', ['好，我去找', '再说吧'], i => {
          if (i === 0) {
            GS.quest.dodo = 'taken'; saveGame();
            this.dialog.say(['太好了！\n它是浅蓝色封面的，很好认。'], null, npc.name);
          }
        });
      }, npc.name);
    } else if (st === 'taken') {
      this.dialog.say(['找到了吗？\n在沙漠左边的岔路上，我记得的。'], null, npc.name);
    } else if (st === 'found') {
      GS.quest.dodo = 'done';
      const c = CLUES.code3;
      this.dialog.say(['啊！就是它！谢谢你！',
        '我告诉你一个秘密——\n沙漠尽头那个箱子的口令，\n我偷偷看见过第三个数。',
        c.ask], () => { this.addClue('code3'); }, npc.name);
    } else {
      this.dialog.say(['第三个数是五五二十五里的五！\n我不会记错的。'], null, npc.name);
    }
  }

  // ---- 暗线 NPC：让主线谜团从环境里渗出来 ----
  npcLore(npc) {
    if (GS.chapter === 1) {
      const c = CLUES.c2d;
      const first = !GS.clues.includes('c2d');
      const lines = GS.flags.boss
        ? ['（老人还在扫地。）',
           '巨人走了，东西还是散的。',
           '很多年前也有个孩子，\n把算错的纸一张张扔进回廊。',
           '风每次都吹回来。\n他就一张张再扔。',
           '……你捡的那些纸，\n是不是他扔的？']
        : ['（老人慢慢地扫着地。）',
           '这条回廊，我扫了三十年。',
           c.ask,
           '早年有个孩子常来这儿。\n一个人绕着走，一圈又一圈。'];
      this.dialog.say(lines, () => { if (first) this.addClue('c2d'); }, npc.name);
      return;
    }
    const lines = GS.flags.boss
      ? ['沙漠安静下来了。',
         '以前有个孩子，总一个人坐在沙丘上。\n一坐就是一下午。',
         '我问他怎么了，他不说。\n后来他就不来了。',
         '……你捡到的那些纸，\n是不是他写的？']
      : ['我在这儿守了四十年林子。',
         '知识村刚建起来那会儿，\n只有一个学生。',
         '那孩子来得最早，走得最晚。\n可是……唉。',
         '算了，都过去了。'];
    this.dialog.say(lines, null, npc.name);
  }

  // ---- 闲聊 NPC：世界要活，台词随进度变 ----
  npcChat(npc) {
    if (GS.chapter === 1) { this.questBoy(npc); return; }
    const lines = GS.flags.boss
      ? ['你把骆驼王打败啦？！',
         '我长大也要当勇者！\n……不过我得先学会九九表。']
      : GS.frags.length > 0
        ? ['你捡的那些黄纸片是什么呀？',
           '看起来好旧哦。\n是谁写的呀？']
        : ['我叫石头！',
           '沙漠里有怪物，我娘不让我去。',
           '你要是去的话……\n能帮我看看有没有宝箱吗？'];
    this.dialog.say(lines, null, npc.name);
  }

  // ---- 宝箱锁：短、杂、无惩罚。答错随便重来，唯一代价是时间 ----
  tryChest(key, n) {
    if (GS.locks.includes(n)) { this.openChest(key, n); return; }
    const lock = CHEST_LOCKS[n];
    if (!lock) { this.openChest(key, n); return; }
    this.dialog.say([`箱子锁着。${lock.icon}\n${lock.hint}`], () => {
      if (lock.kind === 'calc')    this.lockCalc(key, n, 'mult');
      else if (lock.kind === 'balance') this.lockCalc(key, n, 'balance');
      else if (lock.kind === 'code')    this.lockCode(key, n, lock);
      else if (lock.kind === 'riddle')  this.lockRiddle(key, n, lock);
    });
  }

  // 算式锁 / 天平锁：都是四选一，共用一套
  lockCalc(key, n, qtype, tries = 0) {
    const q = getQuestion(qtype);
    // 连错3次自动降难度：选项从4个减到2个
    let opts = q.options;
    if (tries >= 3) {
      const wrong = opts.filter(o => o !== q.answer);
      opts = Phaser.Utils.Array.Shuffle([q.answer, wrong[0]]);
    }
    this.dialog.choice(q.text + (tries >= 3 ? '\n（提示：只剩两个了）' : ''), opts, i => {
      if (opts[i] === q.answer) {
        GS.locks.push(n); saveGame();
        this.dialog.say(['咔哒——锁开了！'], () => this.openChest(key, n));
      } else {
        this.dialog.say([`不对哦。\n💡 ${q.tip}`, '再试一次吧，不会有惩罚的。'],
          () => this.lockCalc(key, n, qtype, tries + 1));
      }
    });
  }

  // 推理锁：三个人各说一句，只有一个说真话 —— 人教版二下「数学广角·推理」
  lockRiddle(key, n, lock) {
    const known = lock.clues.filter(k => GS.clues.includes(k));
    if (known.length < lock.clues.length) {
      this.dialog.say([
        `箱盖上刻着：「三个人只有一个说真话。」`,
        `你只听到了 ${known.length}/3 句话。`,
        '先去把三个人的话都问齐。\n（记在冒险手册的线索本里）',
      ]);
      return;
    }
    const R = CH2_RIDDLE;
    this.dialog.say(
      lock.clues.map(k => `${CLUES[k].from}：「${CLUES[k].note.replace(/^.*?说/, '')}」`)
        .concat(['三个人里只有一个说了真话。\n口令是几？']),
      () => {
        this.dialog.choice('口令是……', R.candidates.map(v => `${v}`).concat('再想想'), i => {
          if (i >= R.candidates.length) return;
          if (R.candidates[i] === R.answer) {
            GS.locks.push(n); saveGame();
            this.dialog.say(['咔哒——箱子开了！', `想对了：\n${R.explain}`], () => this.openChest(key, n));
          } else {
            this.dialog.say([`如果是 ${R.candidates[i]}，\n数数看会有几个人说真话？`,
                             '不对哦，再想想。\n（不会有惩罚的）'], () => this.lockRiddle(key, n, lock));
          }
        });
      });
  }

  // 口令锁：三个数字轮盘，答案在三个 NPC 嘴里
  lockCode(key, n, lock) {
    const known = lock.clues.filter(k => GS.clues.includes(k));
    if (known.length < lock.clues.length) {
      this.dialog.say([
        `三个轮盘，你只知道 ${known.length}/3 个数。`,
        '村里有人知道口令。\n先去问问吧。',
        known.length ? '（已知的记在冒险手册的线索本里）' : '（铁匠、卖水的婶婶……都可以问问）',
      ]);
      return;
    }
    const answer = lock.clues.map(k => CLUES[k].answer);
    const dial = [0, 0, 0];
    const ui = [];
    const clear = () => { ui.forEach(o => o.destroy()); ui.length = 0; };

    const draw = () => {
      clear();
      const bg = this.add.rectangle(W / 2, 300, 440, 300, 0x14182e, 0.97)
        .setStrokeStyle(4, 0xf4e6c0).setScrollFactor(0).setDepth(250);
      const title = this.add.text(W / 2, 190, '转到正确的三个数', {
        fontSize: '22px', fontFamily: FONT, color: '#ffe08a' }).setOrigin(0.5).setScrollFactor(0).setDepth(251);
      ui.push(bg, title);
      dial.forEach((v, i) => {
        const x = W / 2 - 120 + i * 120;
        const num = this.add.text(x, 290, String(v), {
          fontSize: '52px', fontFamily: FONT, color: '#fff', fontStyle: 'bold' })
          .setOrigin(0.5).setScrollFactor(0).setDepth(251);
        ui.push(num);
        [['▲', 240, 1], ['▼', 350, -1]].forEach(([ch, y, d]) => {
          const b = makeButton(this, x, y, 76, 56, ch, () => {
            dial[i] = (dial[i] + d + 10) % 10;
            num.setText(String(dial[i]));
          }, { fontSize: '24px' });
          b.bg.setScrollFactor(0).setDepth(251); b.txt.setScrollFactor(0).setDepth(252);
          ui.push(b.bg, b.txt);
        });
      });
      const ok = makeButton(this, W / 2 - 110, 420, 190, 56, '✓ 试试看', () => {
        if (dial.every((v, i) => v === answer[i])) {
          clear();
          GS.locks.push(n); saveGame();
          this.dialog.say(['咔哒、咔哒、咔哒——\n三个轮盘同时停住了！'], () => this.openChest(key, n));
        } else {
          const t = this.add.text(W / 2, 470, '不对，再想想…', { fontSize: '20px', fontFamily: FONT, color: '#ff9a9a' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(252);
          this.time.delayedCall(1200, () => t.destroy());
        }
      }, { fontSize: '20px', color: 0x3a6b45 });
      const no = makeButton(this, W / 2 + 110, 420, 190, 56, '↩️ 算了', () => { clear(); }, { fontSize: '20px' });
      [ok, no].forEach(b => { b.bg.setScrollFactor(0).setDepth(251); b.txt.setScrollFactor(0).setDepth(252); ui.push(b.bg, b.txt); });
    };
    draw();
  }

  openChest(key, n) {
    GS.chests.push(n);
    this.blocked.delete(key);
    const spr = this.chests[key + '_spr'];
    if (spr) spr.setTexture('t_chest_open');
    const item = CHESTS[n];
    const lines = ['宝箱打开了！'];
    if (item.kind === 'gear') {
      const g = GEAR[item.key];
      lines.push(item.msg);
      // 直接换上，旧的进背包
      const old = GS.p.eq[g.slot];
      GS.p.eq[g.slot] = item.key;
      if (old && GEAR[old].buy > 0) GS.p.bag.push(old);
      lines.push(`装备上了！${g.desc}`);
    } else if (item.kind === 'frag') {
      lines.push(item.msg);
      const g = fragGlobal(GS.chapter, item.idx);
      if (!GS.frags.includes(g)) {
        GS.frags.push(g);
        lines.push(fragText(g).text, `（本章记忆碎片 ${chapterFrags()}/8）`);
      }
    } else if (item.kind === 'gold') {
      GS.p.gold += item.val;
      lines.push(`得到 💰${item.val} 金币！`);
    }
    saveGame(); this.updateHUD();
    this.dialog.say(lines);
  }

  pickFrag(key, n, wasHidden) {
    GS.frags.push(n);
    const spr = (wasHidden ? this.hidden : this.frags)[key + '_spr'];
    if (spr) spr.destroy();
    delete (wasHidden ? this.hidden : this.frags)[key];
    saveGame();
    const lines = wasHidden
      ? [`${CHAPTER.toolName}下，露出一角发黄的纸。`, fragText(n).text]
      : ['地上有一页发黄的纸……', fragText(n).text];
    lines.push(`（本章记忆碎片 ${chapterFrags()}/8　全书 ${GS.frags.length}/${TOTAL_FRAGS}）`);
    if (chapterFrags() === 8) lines.push('这一章的八页都找到了。\n日记还长着呢。');
    this.dialog.say(lines);
  }

  enterHouse(key) {
    GS.indoor = key;
    GS.outPos = { x: this.px, y: this.py };   // 记住门外站哪，出来时回到原地
    GS.searched[key] = GS.searched[key] || [];
    saveGame();
    this.cameras.main.resetFX();
    this.scene.restart();
  }

  leaveHouse() {
    const back = GS.outPos || null;
    GS.indoor = null; GS.outPos = null;
    if (back) GS.pos = back;
    saveGame();
    this.cameras.main.resetFX();
    this.scene.restart();
  }

  // 翻家具：大部分是空的，偶尔有惊喜
  searchFurn(key, x, y) {
    const list = GS.searched[this.indoor];
    if (list.includes(key)) { this.dialog.say(['这里已经翻过了。']); return; }
    list.push(key);
    const loot = rollLoot();
    let text;
    if (loot.kind === 'none') text = loot.msgs[Phaser.Math.Between(0, loot.msgs.length - 1)];
    else if (loot.kind === 'gold') { const n = Phaser.Math.Between(loot.min, loot.max); GS.p.gold += n; text = loot.msg.replace('{n}', n); }
    else if (loot.kind === 'potion') { GS.p.potion++; text = loot.msg; }
    else if (loot.kind === 'ether')  { GS.p.ether++;  text = loot.msg; }
    else if (loot.kind === 'scroll') { GS.p.scroll++; text = loot.msg; }
    else if (loot.kind === 'herb')   { GS.p.mp = GS.p.maxmp; text = loot.msg; }
    saveGame(); this.updateHUD();
    this.add.text(x * TILE + 16, y * TILE + 2, '·', { fontSize: '16px', color: '#8a7548' }).setOrigin(0.5).setDepth(6);
    if (loot.kind !== 'none') this.cameras.main.flash(180, 255, 240, 180);
    this.dialog.say([text]);
  }

  enterDungeon() {
    const left = SOKOBAN.length - GS.rooms.length;
    if (left === 0) { this.dialog.say(['石室里的机关都解开了。']); return; }
    const desc = CHAPTER.puzzle.kind === 'candy'
      ? '石室中间堆着一小堆糖，\n旁边摆着几个空盘子。'
      : '石室里摆着几个刻了数字的石箱，\n地上有写着口诀的凹槽。';
    this.dialog.say([desc], () => {
      this.dialog.choice(`要进石室吗？（还剩 ${left} 间）`, ['进去！', '再等等'], i => {
        if (i !== 0) return;
        this.inBattle = true;   // 借用同一个锁，避免地图继续响应输入
        this.lockedAt = 0;
        this.held = null; this.queued = null;
        const next = SOKOBAN.findIndex((_, k) => !GS.rooms.includes(k));
        this.cameras.main.resetFX();
        this.scene.launch(CHAPTER.puzzle.kind === 'candy' ? 'Candy' : 'Puzzle', { room: next });
        this.scene.sleep();
      });
    });
  }

  checkRevenge() {
    if (GS.pool.length >= 3 && !this.revengeSprite && !GS.flags.bossFight) {
      const { x, y } = REVENGE_TILE;
      this.revengeSprite = this.add.image(x * TILE + 16, y * TILE + 16, 'revenge').setScale(2).setDepth(6);
      this.revengeSprite.gx = x; this.revengeSprite.gy = y;
      this.tweens.add({ targets: this.revengeSprite, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
    } else if (GS.pool.length < 3 && this.revengeSprite) {
      this.revengeSprite.destroy();
      this.revengeSprite = null;
    }
  }

  startBattle(def, extra) {
    this.inBattle = true;
    this.lockedAt = 0;
    this.held = null; this.queued = null;
    this.cameras.main.flash(250, 255, 255, 255);
    this.time.delayedCall(260, () => {
      // 休眠会冻住正在播放的闪白特效，醒来后残留一层白纱 —— 睡前必须清掉
      this.cameras.main.resetFX();
      this.scene.launch('Battle', Object.assign({ def }, extra));
      this.scene.sleep();
    });
  }

  onWake() {
    this.inBattle = false;
    this.cameras.main.resetFX();   // 兜底：清掉任何被冻结的转场特效

    // 从迷宫回来：石门可能开了、宝箱可能变了 → 重建地图（位置由 GS.pos 保住）
    if (GS.fromPuzzle) {
      GS.fromPuzzle = false;
      saveGame();
      this.scene.restart();
      return;
    }

    const r = GS.lastBattle || {};
    GS.lastBattle = null;

    if (r.result === 'win') {
      if (r.mid !== undefined) {
        const mob = this.mobs[r.mid];
        mob.dead = true; mob.sprite.setVisible(false);
        // 45 秒后重生，且玩家离窝还有 6 格以上才放出来 ——
        // 否则刚打完转身就顶脸复活，孩子会觉得永远打不完
        const tryRespawn = () => {
          if (!mob.sprite || mob.sprite.active === false) return;   // 场景已重建，交给新场景管
          if (!this.scene.isActive()) { this.time.delayedCall(5000, tryRespawn); return; }
          const far = Math.abs(this.px - mob.home.x) + Math.abs(this.py - mob.home.y) >= 6;
          if (!far) { this.time.delayedCall(5000, tryRespawn); return; }
          mob.x = mob.home.x; mob.y = mob.home.y; mob.dead = false;
          mob.sprite.setPosition(mob.x * TILE + 16, mob.y * TILE + 16).setVisible(true);
        };
        this.time.delayedCall(45000, tryRespawn);
      }
      if (r.revenge && this.revengeSprite && GS.pool.length === 0) {
        this.revengeSprite.destroy(); this.revengeSprite = null;
      }
      if (r.boss) {
        GS.flags.boss = true;
        if (!GS.tools.includes(CHAPTER.tool)) GS.tools.push(CHAPTER.tool);   // 本章探索工具
        saveGame();
        this.bossSprite.destroy();
        this.dialog.say([
          '口诀骆驼王倒下了，眼里的红光消失了……',
          '骆驼王：谢谢你……我想起来了，\n我本来是守护口诀的精灵啊！',
          '你拿到了第一颗【记忆水晶】！',
          `这个也给你吧。\n${CHAPTER.toolName} 到手了！`,
          GS.chapter === 0
            ? '「沙漠里有几处沙子不太一样，\n用放大镜看看，会有发现的。」'
            : '「回廊的墙缝里卡着东西。\n用钩爪就够得着了。」',
          `本章记忆碎片还差 ${8 - chapterFrags()} 页。\n回头去找找吧。`,
        ], () => this.scene.start('Clear'), '');
        this.crystal && this.tweens.add({ targets: this.crystal, y: this.crystal.y - 60, alpha: 0, duration: 1500, onComplete: () => this.crystal.destroy() });
        this.updateHUD();
        return;
      }
    } else if (r.result === 'lose') {
      GS.p.hp = GS.p.maxhp;
      this.px = PLAYER_START.x; this.py = PLAYER_START.y;
      this.player.setPosition(this.px * TILE + 16, this.py * TILE + 16);
      this.dialog.say(['眼前一黑……\n你被村里人救回了村庄，体力恢复了。']);
    }
    this.checkRevenge();
    this.updateHUD();
    saveGame();
  }
}

// ============ 战斗 ============
class Battle extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.def = data.def;
    this.mid = data.mid;
    this.isBoss = !!data.boss;
    this.isRevenge = !!data.revenge;
    this.practice = !!this.def.practice;
    this.enemy = {
      hp: this.isRevenge ? Math.max(24, GS.pool.length * 9) : this.def.hp,
      atk: this.def.atk,
      def: this.def.def || 0,
    };
    this.enemy.maxhp = this.enemy.hp;
    this.combo = 0;
    this.spellCasts = 0;   // 同一场仗里施法次数，用来做魔法衰减
    this.hintNext = false;
    this.slowNext = false;
    this.shieldTurns = 0;
    this.focused = false;
    this.state = 'intro';
    this.bossPhase = 1;
  }

  create() {
    // 背景：沙漠
    this.add.rectangle(W / 2, 190, W, 380, 0xfce8b8);
    this.add.rectangle(W / 2, 60, W, 120, 0xa8d8f0);
    this.add.circle(400, 70, 34, 0xffd76a);
    this.add.rectangle(W / 2, 400, W, 60, 0xe3c078);
    this.add.rectangle(W / 2, 640, W, 430, 0x1a1f3a);

    // 敌人
    const scale = this.isBoss ? 9 : 8;
    this.enemySprite = this.add.image(W / 2, this.isBoss ? 230 : 250, this.def.tex).setScale(scale);
    this.tweens.add({ targets: this.enemySprite, y: '+=8', duration: 900, yoyo: true, repeat: -1 });

    // 敌人名字+血条
    this.add.text(W / 2, 60, this.def.name, { fontSize: '26px', fontFamily: FONT, color: '#333', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.rectangle(W / 2, 95, 304, 18, 0x333333).setStrokeStyle(2, 0x111111);
    this.ehpBar = this.add.image(W / 2 - 150, 95, 'px').setOrigin(0, 0.5).setScale(300, 14).setTint(0xe05050);

    // 玩家面板
    this.add.rectangle(W / 2, 395, 456, 64, 0x14182e, 0.92).setStrokeStyle(3, 0xf4e6c0);
    this.pName = this.add.text(30, 375, '', { fontSize: '18px', fontFamily: FONT, color: '#ffe08a' });
    this.add.text(200, 372, 'HP', { fontSize: '14px', fontFamily: FONT, color: '#9fdc9f' });
    this.add.rectangle(320, 380, 204, 14, 0x333333);
    this.hpBar = this.add.image(218, 380, 'px').setOrigin(0, 0.5).setScale(200, 10).setTint(0x50c050);
    this.add.text(200, 396, 'MP', { fontSize: '14px', fontFamily: FONT, color: '#9fb4e8' });
    this.add.rectangle(320, 404, 204, 14, 0x333333);
    this.mpBar = this.add.image(218, 404, 'px').setOrigin(0, 0.5).setScale(200, 10).setTint(0x5080e0);
    this.updateBars();

    // 消息框
    this.add.rectangle(W / 2, 490, 456, 118, 0x14182e, 0.92).setStrokeStyle(3, 0xf4e6c0);
    this.msgText = this.add.text(W / 2, 490, '', { fontSize: '23px', fontFamily: FONT, color: '#fff', wordWrap: { width: 420 }, align: 'center', lineSpacing: 6 }).setOrigin(0.5);

    // 连击显示
    this.comboText = this.add.text(W - 24, 340, '', { fontSize: '22px', fontFamily: FONT, color: '#ffb347', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // 技能计时条
    this.timerBar = this.add.image(20, 556, 'px').setOrigin(0, 0.5).setScale(440, 8).setTint(0xffb347).setVisible(false);

    this.buttons = [];
    // 战斗界面不放 A/B：本来就是四个大按钮直接点，A/B 会压住消息框
    this.input.keyboard.on('keydown-Z', () => { if (this.state === 'msg') { this.lastTap = 0; this.tapMsg(); } });
    this.input.keyboard.on('keydown-SPACE', () => this.tapMsg());
    this.input.on('pointerdown', () => {
      if (this.btnConsumed) { this.btnConsumed = false; return; }
      this.tapMsg();
    });

    this.showMsgs([`${this.def.name} 出现了！`], () => this.showMenu());
  }

  updateBars() {
    const p = GS.p;
    this.pName.setText(`勇者 Lv${p.lv}\n⚔️${totalAtk()} 🛡️${totalDef()} 🧠${totalInt()}`);
    this.hpBar.setScale(200 * Math.max(0, p.hp / p.maxhp), 10);
    this.mpBar.setScale(200 * Math.max(0, p.mp / p.maxmp), 10);
    this.ehpBar.setScale(300 * Math.max(0, this.enemy.hp / this.enemy.maxhp), 14);
  }

  // ---- 顺序消息（点击继续） ----
  showMsgs(lines, cb) {
    // 消息和按钮绝不同屏：否则点到残留按钮会重复触发、且点击被按钮吃掉导致消息无法关闭
    this.clearButtons();
    this.state = 'msg';
    this.msgQueue = lines.slice();
    this.msgCb = cb;
    this.msgText.setText(this.msgQueue.shift());
  }
  tapMsg() {
    if (this.state !== 'msg') return;
    // 小孩子会疯狂连点：去抖，避免一条消息还没读到就被跳过、也避免一次点击被消费两次
    const now = this.time.now;
    if (this.lastTap && now - this.lastTap < 250) return;
    this.lastTap = now;

    if (this.msgQueue && this.msgQueue.length) {
      this.msgText.setText(this.msgQueue.shift());
      return;
    }
    const cb = this.msgCb;
    this.msgCb = null;
    this.state = 'anim';
    // 没有后续回调时绝不停在死状态：敌人已死就结算，否则回到指令菜单
    if (cb) cb();
    else if (this.enemy.hp <= 0) this.victory();
    else this.showMenu();
  }

  clearButtons() { this.buttons.forEach(b => b.destroy()); this.buttons = []; }

  // ---- 指令菜单 ----
  showMenu() {
    this.clearButtons();
    this.state = 'menu';
    this.msgText.setText(this.practice ? '练习中～不会受伤，放心答！' : '要怎么做？');
    const spells = learned().filter(k => SPELLS[k].kind !== 'field');
    const cheapest = spells.length ? Math.min(...spells.map(k => SPELLS[k].mp)) : Infinity;
    const defs = [
      ['⚔️ 攻击', () => this.askQuestion(false)],
      ['✨ 魔法', () => {
        if (!spells.length) { this.showMsgs(['你还没有学会魔法。\n升到 3 级就能学【初级治愈术】了！'], () => this.showMenu()); return; }
        if (GS.p.mp < cheapest) { this.showMsgs(['MP 不够用任何魔法了。\n连对 3 题可以回 MP，或者喝魔法药水。'], () => this.showMenu()); return; }
        this.showSpells();
      }, !spells.length || GS.p.mp < cheapest],
      ['🎒 道具', () => this.showItems()],
      ['🏃 逃跑', () => {
        if (this.isBoss) { this.showMsgs(['魔王挡住了去路，逃不掉！'], () => this.showMenu()); return; }
        if (Math.random() < 0.55 + totalSpd() * 0.03) { this.end('flee'); return; }
        this.showMsgs(['没能逃掉！'], () => this.enemyTurn(false, true));
      }],
    ];
    const pos = [[122, 640], [358, 640], [122, 725], [358, 725]];
    defs.forEach(([label, cb, dim], i) => {
      this.buttons.push(makeButton(this, pos[i][0], pos[i][1], 220, 72, label,
        () => { if (this.state === 'menu') cb(); },
        { fontSize: '21px', color: dim ? 0x1c2340 : undefined, dim }));
    });
  }

  // ---- 魔法子菜单（按类别分组，DQ 式） ----
  // 两列 × 3 行 = 每页 6 格。魔法多了要分页，否则高等级会排到屏幕外面去
  showSpells(page = 0) {
    this.clearButtons();
    const keys = learned().filter(k => SPELLS[k].kind !== 'field');
    const PER = 4;                                  // 每页 4 个魔法，留 2 格给翻页和返回
    const pages = Math.max(1, Math.ceil(keys.length / PER));
    if (page >= pages) page = 0;
    const slice = keys.slice(page * PER, page * PER + PER);

    const cells = slice.map(k => {
      const s = SPELLS[k];
      const usable = GS.p.mp >= s.mp;
      return [`${s.name}\nMP${s.mp}`, () => {
        if (!usable) { this.showMsgs([`MP 不够用【${s.name}】了。`], () => this.showSpells(page)); return; }
        this.castSpell(k);
      }, !usable];
    });
    if (pages > 1) cells.push([`▼ 下一页\n${page + 1}/${pages}`, () => this.showSpells(page + 1), false]);
    cells.push(['↩️ 返回', () => this.showMenu(), false]);

    const pos = [[122, 600], [358, 600], [122, 672], [358, 672], [122, 744], [358, 744]];
    cells.slice(0, 6).forEach(([label, cb, dim], i) => {
      this.buttons.push(makeButton(this, pos[i][0], pos[i][1], 220, 62, label, cb,
        { fontSize: '18px', color: dim ? 0x1c2340 : undefined, dim }));
    });
    this.state = 'menu';
    this.msgText.setText(`用什么魔法？  MP ${GS.p.mp}/${GS.p.maxmp}`);
  }

  castSpell(key) {
    const s = SPELLS[key];
    GS.p.mp -= s.mp;
    this.clearButtons();

    if (s.kind === 'heal') {
      const before = GS.p.hp;
      const amount = s.val >= 999 ? 9999 : spellPower(s.val, false);
      GS.p.hp = Math.min(GS.p.maxhp, GS.p.hp + amount);
      this.updateBars();
      this.showFloat(`+${GS.p.hp - before}`, '#9fe89f', W / 2, 400);
      this.showMsgs([`【${s.name}】！\n恢复了 ${GS.p.hp - before} 点HP。`], () => this.enemyTurn(false));
      return;
    }
    if (s.kind === 'attack') {
      const base = spellPower(s.val, this.isBoss);
      this.state = 'menu';
      this.msgText.setText(`【${s.name}】\n威力 ${base}（智力 ${totalInt()}）`);
      this.clearButtons();
      this.buttons.push(makeButton(this, 122, 660, 220, 76, '📖 答题加成\n答对 ×1.5',
        () => this.castAttackQ(s, base, true), { fontSize: '18px', color: 0x3a6b45 }));
      this.buttons.push(makeButton(this, 358, 660, 220, 76, `⚡ 直接放\n${base} 伤害`,
        () => this.castAttackQ(s, base, false), { fontSize: '18px' }));
      return;
    }
    // buff
    if (key === 'hint') { this.hintNext = true; this.showMsgs(['【提示术】！\n下一题只剩 2 个选项。'], () => this.showMenu()); }
    else if (key === 'slowtime') { this.slowNext = true; this.showMsgs(['【缓时术】！\n下一道限时题时间加倍。'], () => this.showMenu()); }
    else if (key === 'shield') { this.shieldTurns = 3; this.showMsgs(['【护盾术】！\n3 回合内受到的伤害减半。'], () => this.showMenu()); }
    else if (key === 'focus') { this.focused = true; this.showMsgs(['【集中术】！\n下一击必定暴击。'], () => this.showMenu()); }
    this.updateBars();
  }

  // 攻击魔法的答题加成：答对 ×1.5，答错或跳过按原威力 —— 只奖励，不惩罚
  castAttackQ(s, base, withQuiz) {
    this.clearButtons();
    if (!withQuiz) { this.fireSpell(s, base, 1, null); return; }
    const q = this.pickQuestion();
    this.state = 'question';
    this.msgText.setText(`${s.name}加成题：\n${q.text}`);
    this.startSpeedBar();
    const pos = [[122, 640], [358, 640], [122, 725], [358, 725]];
    q.options.forEach((opt, i) => {
      this.buttons.push(makeButton(this, pos[i][0], pos[i][1], 220, 66, opt, () => {
        if (this.state !== 'question') return;
        const ok = opt === q.answer;
        this.qAskedAt = null; this.hideSpeedBar(); this.clearButtons();
        this.fireSpell(s, base, ok ? 1.5 : 1, ok ? null : `答案是 ${q.answer}\n💡 ${q.tip}`);
      }, { fontSize: '22px', color: 0x3a5f8b }));
    });
    this.buttons.push(makeButton(this, W / 2, 792, 200, 46, '跳过加成', () => {
      if (this.state !== 'question') return;
      this.qAskedAt = null; this.hideSpeedBar(); this.clearButtons();
      this.fireSpell(s, base, 1, null);
    }, { fontSize: '17px' }));
  }

  fireSpell(s, base, mult, wrongTip) {
    // 同一场仗里连续施法威力递减：第1发100%、第2发80%、第3发60%…最低35%。
    // 不加这条，孩子可以低等级靠连放魔法直接秒Boss，练级就没意义了
    const decay = Math.max(0.35, 1 - 0.2 * this.spellCasts);
    this.spellCasts++;
    const dmg = Math.max(1, Math.round(base * mult * decay));
    this.enemy.hp -= dmg;                       // 无视防御
    this.enemySprite.setTint(0xffaa55);
    this.tweens.add({ targets: this.enemySprite, x: '+=12', duration: 50, yoyo: true, repeat: 3,
      onComplete: () => this.enemySprite.clearTint() });
    this.showFloat(`-${dmg} 无视防御!`, '#ffb347');
    if (mult > 1) this.showFloat('答对了! ×1.5', '#8ee88e', W / 2, 300);
    this.updateBars();
    const lines = [];
    if (wrongTip) lines.push(wrongTip);
    lines.push(`【${s.name}】！${mult > 1 ? '\n答对加成，' : '\n'}造成 ${dmg} 点伤害！`);
    if (decay < 1) lines.push(`它开始适应你的魔法了……\n（这一场里魔法威力已降到 ${Math.round(decay * 100)}%）`);
    else if (this.isBoss) lines.push('（Boss 有魔抗，魔法威力打了折）');
    this.showMsgs(lines, () => {
      if (this.enemy.hp <= 0) { this.victory(); return; }
      this.enemyTurn(false);
    });
  }

  showItems() {
    this.clearButtons();
    const p = GS.p;
    const defs = [
      [`🧪 药水 ×${p.potion}（HP+40）`, () => {
        if (p.potion <= 0) { this.showMsgs(['没有药水了……'], () => this.showMenu()); return; }
        p.potion--; p.hp = Math.min(p.maxhp, p.hp + 40);
        this.updateBars();
        this.showMsgs(['喝下药水，恢复了40点HP！'], () => this.enemyTurn(false));
      }, p.potion <= 0],
      [`💧 魔法药水 ×${p.ether}（MP+30）`, () => {
        if (p.ether <= 0) { this.showMsgs(['没有魔法药水了……'], () => this.showMenu()); return; }
        p.ether--; p.mp = Math.min(p.maxmp, p.mp + 30);
        this.updateBars();
        this.showMsgs(['喝下魔法药水，MP 恢复了！'], () => this.enemyTurn(false));
      }, p.ether <= 0],
      [`📜 提示卷轴 ×${p.scroll}（去掉2个错误选项）`, () => {
        if (p.scroll <= 0) { this.showMsgs(['没有卷轴了……'], () => this.showMenu()); return; }
        if (this.hintNext) { this.showMsgs(['已经用过卷轴啦！'], () => this.showMenu()); return; }
        p.scroll--; this.hintNext = true;
        this.showMsgs(['卷轴发光了！下一题只剩2个选项。'], () => this.showMenu());
      }, p.scroll <= 0],
      ['↩️ 返回', () => this.showMenu(), false],
    ];
    defs.forEach(([label, cb, dim], i) => {
      this.buttons.push(makeButton(this, W / 2, 610 + i * 64, 440, 58, label, cb,
        { fontSize: '19px', color: dim ? 0x1c2340 : undefined, dim }));
    });
    this.state = 'menu';
    this.msgText.setText('用什么道具？');
  }

  update() { this.updateSpeedBar(); }

  // ---- 出题 ----
  pickQuestion() {
    if (this.isRevenge && GS.pool.length) {
      this.poolIdx = Phaser.Math.Between(0, GS.pool.length - 1);
      return GS.pool[this.poolIdx];
    }
    let qt = this.def.qtype;
    if (qt === 'mixedmath') qt = Math.random() < 0.5 ? 'mult' : 'addsub';
    if (qt === 'revenge') qt = 'mixed';
    if (this.isBoss) {
      const ratio = this.enemy.hp / this.enemy.maxhp;
      qt = ratio > 0.66 ? 'mult' : ratio > 0.33 ? 'addsub' : 'chinese';
    }
    return getQuestion(qt);
  }

  askQuestion(isSkill) {
    this.clearButtons();
    this.state = 'question';
    this.q = this.pickQuestion();
    this.isSkill = isSkill;
    this.msgText.setText(this.q.text);
    this.startSpeedBar();

    let opts = this.q.options.slice();
    if (this.hintNext) {
      const wrong = opts.filter(o => o !== this.q.answer);
      Phaser.Utils.Array.Shuffle(wrong);
      opts = Phaser.Utils.Array.Shuffle([this.q.answer, wrong[0]]);
      this.hintNext = false;
    }

    const pos = opts.length === 2 ? [[122, 660], [358, 660]] : [[122, 640], [358, 640], [122, 725], [358, 725]];
    opts.forEach((opt, i) => {
      this.buttons.push(makeButton(this, pos[i][0], pos[i][1], 220, 72, opt, () => {
        if (this.state !== 'question') return;
        this.stopTimer();
        this.resolve(opt === this.q.answer);
      }, { fontSize: '24px', color: 0x3a5f8b }));
    });

    if (isSkill) {
      this.timerBar.setVisible(true).setScale(440, 8);
      const dur = this.slowNext ? 20000 : 10000;
      this.slowNext = false;
      this.timerTween = this.tweens.add({
        targets: this.timerBar, scaleX: 0, duration: dur,
        onComplete: () => { if (this.state === 'question') { this.showFloat('时间到！', '#ff6666'); this.resolve(false); } },
      });
    }
  }

  // 速度条：绿(≤2秒 ×1.5) → 黄(≤3秒 ×1.2) → 灰(×1.0)。只奖励，不惩罚
  startSpeedBar() {
    this.qAskedAt = this.time.now;
    if (!this.speedBar) {
      this.speedBg = this.add.rectangle(W / 2, 570, 444, 16, 0x2a2a34).setStrokeStyle(2, 0x555566);
      this.speedBar = this.add.image(20, 570, 'px').setOrigin(0, 0.5);
      this.speedTxt = this.add.text(W - 26, 570, '', { fontSize: '18px', fontFamily: FONT, fontStyle: 'bold' }).setOrigin(1, 0.5);
    }
    [this.speedBg, this.speedBar, this.speedTxt].forEach(o => o.setVisible(true));
    this.speedBar.setScale(440, 12).setTint(SPEED_TIERS[0].color);
    this.speedTxt.setText(SPEED_TIERS[0].label).setColor('#8ee88e');
  }

  hideSpeedBar() {
    [this.speedBg, this.speedBar, this.speedTxt].forEach(o => o && o.setVisible(false));
  }

  updateSpeedBar() {
    if (this.state !== 'question' || !this.speedBar || !this.qAskedAt) return;
    const el = this.time.now - this.qAskedAt;
    const span = SPEED_TIERS[SPEED_TIERS.length - 1].ms;      // 条子在 3 秒内走完
    const left = Math.max(0, 1 - el / span);
    this.speedBar.setScale(440 * left, 12);
    const t = speedTier(el);
    this.speedBar.setTint(t.color);
    this.speedTxt.setText(t.label).setColor(t === SPEED_BASE ? '#9aa2bd' : (t.mult === 1.5 ? '#8ee88e' : '#ffd76a'));
  }

  stopTimer() {
    if (this.timerTween) { this.timerTween.remove(); this.timerTween = null; }
    this.timerBar.setVisible(false);
  }

  showFloat(txt, color, x = W / 2, y = 250) {
    const t = this.add.text(x, y, txt, { fontSize: '32px', fontFamily: FONT, color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  resolve(correct) {
    this.clearButtons();
    const elapsed = this.qAskedAt ? this.time.now - this.qAskedAt : 9999;
    const tier = correct ? speedTier(elapsed) : SPEED_BASE;
    this.qAskedAt = null;
    this.hideSpeedBar();
    this.state = 'anim';

    if (correct) {
      this.combo++;
      const perfect = this.combo % 3 === 0;   // 连对3次：暴击 + 完美格挡 + 回MP
      const subject = /[+−×]/.test(this.q.text) ? 'math' : 'chinese';
      let dmg = Math.max(1, totalAtk() - this.enemy.def) + Phaser.Math.Between(0, 2);
      dmg = Math.round(dmg * gearBoost(subject));
      if (this.isSkill) dmg = Math.round(dmg * 2.2);
      if (this.focused) { dmg *= 2; this.focused = false; }
      dmg = Math.round(dmg * tier.mult);          // 答得快，打得重
      if (perfect) dmg *= 2;
      this.enemy.hp -= dmg;

      if (this.isRevenge && this.poolIdx !== undefined) { GS.pool.splice(this.poolIdx, 1); this.poolIdx = undefined; }

      this.comboText.setText(this.combo >= 2 ? `连击 ×${this.combo}` : '');
      this.enemySprite.setTint(0xff8888);
      this.tweens.add({ targets: this.enemySprite, x: '+=10', duration: 50, yoyo: true, repeat: 3, onComplete: () => this.enemySprite.clearTint() });

      // 等级不足时给明确反馈，而不是干巴巴的 -1
      const tooWeak = totalAtk() - this.enemy.def <= 1;
      if (tooWeak && !perfect) this.showFloat('伤不到它…', '#ff9955');
      else this.showFloat(`-${dmg}${perfect ? ' 暴击!!' : ''}`, perfect ? '#ffd700' : '#ffffff');
      if (tier.mult > 1) {
        this.showFloat(`手快! ${tier.label}`, tier.mult === 1.5 ? '#8ee88e' : '#ffd76a', W / 2, 300);
      }

      if (perfect) {
        GS.p.mp = Math.min(GS.p.maxmp, GS.p.mp + 2);   // 会做题就有魔法可用
        this.showFloat('完美格挡! MP+2', '#7fe0ff', W / 2, 340);
      }
      this.updateBars();

      this.time.delayedCall(750, () => {
        if (this.enemy.hp <= 0) { this.victory(); return; }
        if (this.isBoss && this.enemy.hp / this.enemy.maxhp <= 0.33 && this.bossPhase < 3) {
          this.bossPhase = 3; this.enemy.atk = this.def.atk + 3;
          this.showMsgs(['骆驼王生气了！开始考语文了！\n（攻击力上升）'], () => this.enemyTurn(perfect));
          return;
        }
        this.enemyTurn(perfect);
      });
    } else {
      this.combo = 0;
      this.comboText.setText('');
      if (!this.isRevenge && GS.pool.length < 10 && !GS.pool.some(q => q.text === this.q.text)) {
        GS.pool.push({ text: this.q.text, options: this.q.options, answer: this.q.answer, tip: this.q.tip });
      }
      this.showMsgs([`答错了！正确答案：${this.q.answer}\n💡 ${this.q.tip}`], () => this.enemyTurn(false, true));
    }
  }

  // 敌人每回合都出手。答对=格挡(减半)，完美格挡=免伤，答错=全额
  enemyTurn(perfect, wrong = false) {
    if (this.practice) { this.showMenu(); return; }
    this.state = 'anim';
    if (perfect) { this.showMenu(); return; }

    const floor = Math.ceil(this.enemy.atk * 0.3);   // 防御最多减伤70%，防止堆防具无敌
    let dmg = Math.max(floor, this.enemy.atk - totalDef()) + Phaser.Math.Between(0, 2);
    if (!wrong) dmg = Math.ceil(dmg / 2);                          // 答对格挡
    if (wrong && hasGearFlag('softenWrong')) dmg = Math.ceil(dmg / 2); // 橡皮盾
    if (this.shieldTurns > 0) { dmg = Math.ceil(dmg / 2); this.shieldTurns--; }

    if (Math.random() < totalSpd() * 0.015) {                      // 鞋子闪避
      this.showFloat('闪开了!', '#9fe89f', W / 2, 400);
      this.time.delayedCall(600, () => this.showMenu());
      return;
    }

    GS.p.hp -= dmg;
    this.tweens.add({ targets: this.enemySprite, y: '+=40', duration: 120, yoyo: true });
    this.cameras.main.shake(200, 0.012);
    this.showFloat(`-${dmg}${!wrong ? ' 格挡' : ''}`, '#ff6666', W / 2, 400);
    this.updateBars();

    this.time.delayedCall(600, () => {
      if (GS.p.hp <= 0) {
        GS.p.hp = 0; this.updateBars();
        this.showMsgs(['你被打败了……'], () => this.end('lose'));
      } else {
        this.showMenu();
      }
    });
  }

  victory() {
    this.tweens.add({ targets: this.enemySprite, alpha: 0, scale: 0, angle: 180, duration: 600 });
    const msgs = [`打败了 ${this.def.name}！`];
    // 图鉴：唤醒过的精灵入册（决定最终结局）
    if (!this.practice && !this.isRevenge && !GS.dex.includes(this.def.key)) {
      GS.dex.push(this.def.key);
      msgs.push(`✨ ${this.def.name} 被唤醒了！\n它进入了你的图鉴。`);
    }
    if (!this.practice) {
      const expGain = Math.round(this.def.exp * (1 + sumGear('expBonus')));
      const goldGain = Math.round(this.def.gold * (1 + sumGear('goldBonus')));
      GS.p.exp += expGain;
      GS.p.gold += goldGain;
      msgs.push(`获得 ${expGain} 经验、💰${goldGain} 金币！`);
      while (GS.p.exp >= expNeed(GS.p.lv)) {
        GS.p.exp -= expNeed(GS.p.lv);
        const before = learned();
        GS.p.lv++;
        GS.p.maxhp += 8; GS.p.maxmp += 3; GS.p.atk += 2;
        GS.p.hp = GS.p.maxhp; GS.p.mp = GS.p.maxmp;
        msgs.push(`🎉 升级！Lv${GS.p.lv}\nHP+8  MP+3  攻击+2，全部恢复！`);
        // 到等级自动学会新魔法，要有仪式感
        learned().filter(k => !before.includes(k)).forEach(k => {
          msgs.push(`✨ 学会了新魔法！\n【${SPELLS[k].name}】\n${SPELLS[k].desc}`);
        });
      }
    } else {
      msgs.push('练习结束，做得好！');
    }
    if (this.isRevenge && GS.pool.length > 0) msgs.push(`还有 ${GS.pool.length} 道错题没消化，\n怨念怪还会再来哦！`);
    if (this.isRevenge && GS.pool.length === 0) msgs.push('错题全部消化完毕，怨念怪消散了！');
    this.updateBars();
    saveGame();
    this.showMsgs(msgs, () => this.end('win'));
  }

  end(result) {
    GS.lastBattle = { result, mid: this.mid, boss: this.isBoss, revenge: this.isRevenge };
    saveGame();
    this.scene.stop();
    this.scene.wake('World');
  }
}

// ============ 推箱子迷宫 ============
class Puzzle extends Phaser.Scene {
  constructor() { super('Puzzle'); }

  init(data) { this.roomIdx = data.room || 0; }

  create() {
    const lv = SOKOBAN[this.roomIdx];
    this.lv = lv;
    this.rows = lv.rows;
    this.gw = this.rows[0].length;
    this.gh = this.rows.length;
    this.cell = 48;
    this.ox = (W - this.gw * this.cell) / 2;
    this.oy = 122;
    this.done = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a22);
    this.add.text(W / 2, 44, lv.name, { fontSize: '26px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 82, `迷宫 ${this.roomIdx + 1} / ${SOKOBAN.length}`, { fontSize: '17px', fontFamily: FONT, color: '#8090b8' }).setOrigin(0.5);

    // 地面与墙
    for (let y = 0; y < this.gh; y++) {
      for (let x = 0; x < this.gw; x++) {
        const wall = this.rows[y][x] === '#';
        this.add.image(this.px(x), this.py(y), wall ? 't_dwall' : 't_dfloor')
          .setDisplaySize(this.cell, this.cell);
      }
    }

    // 凹槽（写着口诀）
    lv.goals.forEach(g => {
      this.add.image(this.px(g.x), this.py(g.y), 'plate').setDisplaySize(this.cell, this.cell);
      const m = Math.min(g.a, g.b), M = Math.max(g.a, g.b);
      // 口诀两个字要够大够清楚 —— 描边压住凹槽的金边，孩子才读得清
      this.add.text(this.px(g.x), this.py(g.y), `${CN[m]}${CN[M]}`,
        { fontSize: '21px', fontFamily: FONT, color: '#ffe9a8', fontStyle: 'bold',
          stroke: '#241a08', strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
    });

    // 箱子
    this.boxes = lv.boxes.map(b => {
      const spr = this.add.image(this.px(b.x), this.py(b.y), 'crate').setDisplaySize(this.cell, this.cell).setDepth(5);
      const txt = this.add.text(this.px(b.x), this.py(b.y), String(b.val),
        { fontSize: '22px', fontFamily: FONT, color: '#3a2410', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
      return { x: b.x, y: b.y, val: b.val, spr, txt };
    });

    // 玩家
    let st = { x: 1, y: 1 };
    for (let y = 0; y < this.gh; y++) for (let x = 0; x < this.gw; x++) if (this.rows[y][x] === '@') st = { x, y };
    this.pos = { ...st };
    this.hero = this.add.image(this.px(st.x), this.py(st.y), 'hero_d').setDisplaySize(this.cell * 0.9, this.cell * 0.9).setDepth(10);

    // 提示条
    this.tip = this.add.text(W / 2, this.oy + this.gh * this.cell + 26, '把得数对的箱子推到凹槽上',
      { fontSize: '18px', fontFamily: FONT, color: '#c8d4f0', align: 'center', wordWrap: { width: 440 } }).setOrigin(0.5);

    // 控制：方向键 + 重置 + 求助 + 离开
    this.makePad();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.queued = null;
    this.moving = false;
  }

  px(x) { return this.ox + x * this.cell + this.cell / 2; }
  py(y) { return this.oy + y * this.cell + this.cell / 2; }

  makePad() {
    const cx = 100, cy = 690, gap = 66, sz = 62;
    [['up', cx, cy - gap, '▲'], ['down', cx, cy + gap, '▼'], ['left', cx - gap, cy, '◀'], ['right', cx + gap, cy, '▶']]
      .forEach(([d, x, y, ch]) => {
        const r = this.add.rectangle(x, y, sz, sz, 0x2c3e6b, 0.85).setStrokeStyle(2, 0xf4e6c0).setInteractive();
        this.add.text(x, y, ch, { fontSize: '22px', color: '#fff' }).setOrigin(0.5);
        r.on('pointerdown', () => { if (!this.done) this.queued = d; });
      });
    makeButton(this, 350, 645, 180, 52, '↺ 重来', () => this.scene.restart({ room: this.roomIdx }), { fontSize: '20px', color: 0x6b4a2c });
    makeButton(this, 350, 705, 180, 52, '💡 求助', () => this.showHint(), { fontSize: '20px', color: 0x3a6b45 });
    makeButton(this, 350, 765, 180, 52, '🚪 离开', () => this.leave(), { fontSize: '20px' });
  }

  showHint() {
    const need = this.lv.goals.map(g => `${CN[Math.min(g.a,g.b)]}${CN[Math.max(g.a,g.b)]} 要 ${g.a * g.b}`).join('，');
    this.tip.setText(`${this.lv.hint}\n（${need}）`);
  }

  update() {
    if (this.done || this.moving) return;
    let d = this.queued; this.queued = null;
    if (!d) {
      if (this.cursors.up.isDown) d = 'up';
      else if (this.cursors.down.isDown) d = 'down';
      else if (this.cursors.left.isDown) d = 'left';
      else if (this.cursors.right.isDown) d = 'right';
    }
    if (d) this.step(d);
  }

  step(dir) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    this.hero.setTexture({ up: 'hero_u', down: 'hero_d', left: 'hero_s', right: 'hero_s' }[dir])
      .setFlipX(dir === 'left');
    const nx = this.pos.x + dx, ny = this.pos.y + dy;
    if (this.isWall(nx, ny)) return;

    const box = this.boxes.find(b => b.x === nx && b.y === ny);
    if (box) {
      const bx = nx + dx, by = ny + dy;
      if (this.isWall(bx, by)) return;
      if (this.boxes.some(b => b.x === bx && b.y === by)) return;
      box.x = bx; box.y = by;
      this.tweens.add({ targets: [box.spr, box.txt], x: this.px(bx), y: this.py(by), duration: 130 });
    }

    this.moving = true;
    this.pos = { x: nx, y: ny };
    this.tweens.add({
      targets: this.hero, x: this.px(nx), y: this.py(ny), duration: 130,
      onComplete: () => { this.moving = false; if (box) this.checkWin(); },
    });
  }

  isWall(x, y) {
    return x < 0 || y < 0 || x >= this.gw || y >= this.gh || this.rows[y][x] === '#';
  }

  checkWin() {
    const ok = this.lv.goals.every(g =>
      this.boxes.some(b => b.x === g.x && b.y === g.y && b.val === g.a * g.b));
    if (!ok) {
      // 给点即时反馈：踩对格子但数字错了要说出来
      const wrong = this.lv.goals.find(g => this.boxes.some(b => b.x === g.x && b.y === g.y && b.val !== g.a * g.b));
      if (wrong) this.tip.setText(`凹槽写的是 ${CN[Math.min(wrong.a,wrong.b)]}${CN[Math.max(wrong.a,wrong.b)]}，\n得数不是这个箱子上的数哦。↺ 重来试试`);
      return;
    }
    this.done = true;
    this.cameras.main.flash(300, 255, 240, 180);
    if (!GS.rooms.includes(this.roomIdx)) GS.rooms.push(this.roomIdx);

    const lines = ['石门轰隆一声打开了！'];
    const rw = this.lv.reward;
    if (rw.kind === 'gold') { GS.p.gold += rw.val; lines.push(`房间深处有 💰${rw.val} 金币！`); }
    else if (rw.kind === 'frag' && !GS.frags.includes(rw.idx)) {
      GS.frags.push(rw.idx);
      lines.push('地上有一页发黄的纸……', FRAGMENTS[rw.idx].text, `（本章记忆碎片 ${GS.frags.length}/8）`);
    }
    const allDone = SOKOBAN.every((_, i) => GS.rooms.includes(i));
    if (allDone) { GS.flags.puzzle = true; lines.push('三间石室都解开了！\n沙漠深处的大石门应该开了。'); }
    saveGame();

    this.panel(lines, () => {
      const next = SOKOBAN.findIndex((_, i) => !GS.rooms.includes(i));
      if (next >= 0) this.scene.restart({ room: next });
      else this.leave();
    });
  }

  // 简易顺序消息面板（迷宫内部专用）
  panel(lines, cb) {
    const bg = this.add.rectangle(W / 2, H / 2, 456, 300, 0x14182e, 0.97).setStrokeStyle(4, 0xf4e6c0).setDepth(100);
    const txt = this.add.text(W / 2, H / 2 - 30, '', { fontSize: '21px', fontFamily: FONT, color: '#fff',
      align: 'center', wordWrap: { width: 410 }, lineSpacing: 8 }).setOrigin(0.5).setDepth(101);
    const q = lines.slice();
    const btn = makeButton(this, W / 2, H / 2 + 100, 200, 54, '继续', () => {
      if (q.length) { txt.setText(q.shift()); return; }
      bg.destroy(); txt.destroy(); btn.destroy();
      cb();
    }, { fontSize: '20px' });
    btn.bg.setDepth(101); btn.txt.setDepth(102);
    txt.setText(q.shift());
  }

  leave() {
    GS.fromPuzzle = true;
    saveGame();
    this.scene.stop();
    this.scene.wake('World');
  }
}

// ============ 分糖机关（第2章）============
// 把"平均分"从算式变成手上的动作：点盘子放糖，每盘必须一样多，
// 分不完的留在中间 —— 那就是余数。
class Candy extends Phaser.Scene {
  constructor() { super('Candy'); }
  init(data) { this.roomIdx = data.room || 0; }

  create() {
    const lv = SOKOBAN[this.roomIdx];      // loadChapter 已把本章谜题装进 SOKOBAN
    this.lv = lv;
    this.pool = lv.total;                  // 还在中间没分出去的
    this.plates = Array(lv.plates).fill(0);
    this.done = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a22);
    this.add.text(W / 2, 44, lv.name, { fontSize: '25px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 80, `石室 ${this.roomIdx + 1} / ${SOKOBAN.length}`, { fontSize: '17px', fontFamily: FONT, color: '#8090b8' }).setOrigin(0.5);
    this.add.text(W / 2, 118, `${lv.total} 颗糖，${lv.plates} 个盘子`, { fontSize: '21px', fontFamily: FONT, color: '#fff2c0' }).setOrigin(0.5);

    // 中间的糖堆
    this.add.rectangle(W / 2, 200, 400, 96, 0x2a2a34).setStrokeStyle(3, 0xf4e6c0);
    this.add.text(W / 2, 165, '还没分的糖', { fontSize: '16px', fontFamily: FONT, color: '#9aa2bd' }).setOrigin(0.5);
    this.poolText = this.add.text(W / 2, 208, '', { fontSize: '30px', fontFamily: FONT, color: '#f06a8a', fontStyle: 'bold' }).setOrigin(0.5);
    this.poolIcons = this.add.container(0, 0);

    // 盘子：点一下放一颗，再点盘子上的糖会收回
    this.plateUI = [];
    const n = lv.plates;
    const gapX = Math.min(112, 420 / n);
    lv.plates && this.plates.forEach((_, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * gapX;
      const y = 340;
      const img = this.add.image(x, y, 't_plate2').setDisplaySize(gapX - 8, gapX - 8).setInteractive({ useHandCursor: true });
      const cnt = this.add.text(x, y + 4, '0', { fontSize: '26px', fontFamily: FONT, color: '#3a2410', fontStyle: 'bold' }).setOrigin(0.5);
      const lbl = this.add.text(x, y + gapX / 2 + 4, `第${i + 1}盘`, { fontSize: '14px', fontFamily: FONT, color: '#8090b8' }).setOrigin(0.5);
      img.on('pointerdown', () => this.put(i));
      this.plateUI.push({ img, cnt, lbl });
    });

    this.tip = this.add.text(W / 2, 432, '点盘子放一颗糖，点满了再点会收回来',
      { fontSize: '17px', fontFamily: FONT, color: '#c8d4f0', align: 'center', wordWrap: { width: 440 } }).setOrigin(0.5);

    makeButton(this, 130, 530, 210, 62, '↺ 全部收回', () => {
      if (this.done) return;
      this.pool = lv.total; this.plates.fill(0); this.refresh();
      this.tip.setText('都收回来了，重新分吧。');
    }, { fontSize: '19px', color: 0x6b4a2c });
    makeButton(this, 350, 530, 210, 62, '💡 求助', () => {
      const q = Math.floor(lv.total / lv.plates), r = lv.total % lv.plates;
      this.tip.setText(`${lv.hint}\n（每盘 ${q} 颗，中间会剩 ${r} 颗）`);
    }, { fontSize: '19px', color: 0x3a6b45 });
    makeButton(this, W / 2, 618, 300, 66, '✓ 分好了', () => this.check(), { fontSize: '22px' });
    makeButton(this, W / 2, 700, 240, 60, '🚪 离开', () => this.leave(), { fontSize: '19px' });

    this.refresh();
  }

  put(i) {
    if (this.done) return;
    if (this.pool > 0) { this.pool--; this.plates[i]++; }
    else if (this.plates[i] > 0) { this.plates[i]--; this.pool++; }   // 没糖了就收回
    this.refresh();
  }

  refresh() {
    this.poolText.setText('🍬 '.repeat(Math.min(this.pool, 12)).trim() + (this.pool > 12 ? ` +${this.pool - 12}` : '') + `   （${this.pool} 颗）`);
    this.plateUI.forEach((p, i) => p.cnt.setText(String(this.plates[i])));
  }

  check() {
    if (this.done) return;
    const lv = this.lv;
    const q = Math.floor(lv.total / lv.plates), r = lv.total % lv.plates;
    const allSame = this.plates.every(v => v === this.plates[0]);
    if (!allSame) { this.tip.setText('每个盘子里要一样多才行。\n再看看哪盘多了、哪盘少了。'); return; }
    if (this.plates[0] !== q || this.pool !== r) {
      this.tip.setText(this.plates[0] < q
        ? '还能再分一些 —— 中间剩的糖\n比盘子数还多，说明每盘还能加。'
        : '分多了。中间的糖不够分了，\n说明每盘要少一点。');
      return;
    }
    // 过关
    this.done = true;
    this.cameras.main.flash(300, 255, 240, 180);
    if (!GS.rooms.includes(this.roomIdx)) GS.rooms.push(this.roomIdx);
    const lines = [`${lv.total} ÷ ${lv.plates} = ${q}${r ? ' …… ' + r : ''}\n石门咔哒响了一声！`];
    if (r === 0) lines.push('正好分完，一颗不剩。');
    else lines.push(`每盘 ${q} 颗，中间剩下 ${r} 颗。\n剩下的这 ${r} 颗，就叫【余数】。`);
    const rw = lv.reward;
    if (rw.kind === 'gold') { GS.p.gold += rw.val; lines.push(`石台上有 💰${rw.val} 金币！`); }
    else if (rw.kind === 'frag' && !GS.frags.includes(rw.idx)) {
      GS.frags.push(rw.idx);
      lines.push('地上有一页发黄的纸……', FRAGMENTS[rw.idx].text, `（本章记忆碎片 ${GS.frags.length}/8）`);
    }
    if (SOKOBAN.every((_, i) => GS.rooms.includes(i))) {
      GS.flags.puzzle = true;
      lines.push('三间石室都解开了！\n回廊尽头的大石门应该开了。');
    }
    saveGame();
    this.panel(lines, () => {
      const next = SOKOBAN.findIndex((_, i) => !GS.rooms.includes(i));
      if (next >= 0) this.scene.restart({ room: next });
      else this.leave();
    });
  }

  panel(lines, cb) {
    const bg = this.add.rectangle(W / 2, H / 2, 456, 320, 0x14182e, 0.97).setStrokeStyle(4, 0xf4e6c0).setDepth(100);
    const txt = this.add.text(W / 2, H / 2 - 30, '', { fontSize: '20px', fontFamily: FONT, color: '#fff',
      align: 'center', wordWrap: { width: 410 }, lineSpacing: 8 }).setOrigin(0.5).setDepth(101);
    const q = lines.slice();
    const btn = makeButton(this, W / 2, H / 2 + 110, 200, 56, '继续', () => {
      if (q.length) { txt.setText(q.shift()); return; }
      bg.destroy(); txt.destroy(); btn.destroy(); cb();
    }, { fontSize: '20px' });
    btn.bg.setDepth(101); btn.txt.setDepth(102);
    txt.setText(q.shift());
  }

  leave() {
    GS.fromPuzzle = true;
    saveGame();
    this.scene.stop();
    this.scene.wake('World');
  }
}

// ============ 通关 ============
class Clear extends Phaser.Scene {
  constructor() { super('Clear'); }
  create() {
    const c = CHAPTER;
    const hasNext = GS.chapter + 1 < CHAPTERS.length;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1f3a);
    const gem = this.add.image(W / 2, 210, 'crystal').setScale(8);
    this.tweens.add({ targets: gem, angle: 360, duration: 6000, repeat: -1 });
    this.add.text(W / 2, 350, `第${c.n === 1 ? '一' : '二'}章 完！`,
      { fontSize: '42px', fontFamily: FONT, color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W / 2, 415, `你夺回了第 ${c.n} 颗记忆水晶\n${c.name}恢复了平静`,
      { fontSize: '21px', fontFamily: FONT, color: '#c8d4f0', align: 'center', lineSpacing: 10 }).setOrigin(0.5);
    this.add.text(W / 2, 505, `勇者 Lv${GS.p.lv}　💰${GS.p.gold}\n本章碎片 ${GS.frags.length}/8　图鉴 ${GS.dex.length}`,
      { fontSize: '19px', fontFamily: FONT, color: '#8090b8', align: 'center', lineSpacing: 8 }).setOrigin(0.5);

    if (GS.frags.length < 8) {
      this.add.text(W / 2, 580, `还有 ${8 - GS.frags.length} 页日记没找到\n（回本章用${c.toolName}再找找）`,
        { fontSize: '17px', fontFamily: FONT, color: '#ffb347', align: 'center', lineSpacing: 6 }).setOrigin(0.5);
    }

    this.add.text(W / 2, 655, hasNext
      ? '水晶浮了起来，慢慢转向北方。\n回村里问问长老吧。'
      : '（下一章敬请期待）',
      { fontSize: '18px', fontFamily: FONT, color: '#ffb347', align: 'center', lineSpacing: 8 }).setOrigin(0.5);
    makeButton(this, W / 2, 740, 300, 64, '↩️ 回到村庄', () => this.scene.start('World'), { fontSize: '20px' });
  }

  // 进入下一章：本章进度归零，人物等级/装备/日记全部带走
  nextChapter() {
    GS.chapter += 1;
    GS.flags = { intro: true, boss: false, puzzle: false };
    // 日记不清空 —— 56 页要跨章累积，清了整条暗线就废了
    GS.chests = []; GS.locks = []; GS.rooms = [];
    GS.clues = []; GS.quest = {}; GS.searched = {}; GS.pool = [];
    GS.pos = null; GS.lastBattle = null; GS.fromPuzzle = false; GS.indoor = null; GS.outPos = null;
    loadChapter(GS.chapter);
    GS.p.hp = GS.p.maxhp; GS.p.mp = GS.p.maxmp;
    saveGame();
    this.scene.stop('World');
    this.scene.start('World');
  }
}

// ============ 启动 ============
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W,
  height: H,
  pixelArt: true,
  backgroundColor: '#000',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, World, Battle, Puzzle, Candy, Clear],
});
window.GS = GS;

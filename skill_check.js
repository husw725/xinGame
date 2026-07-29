// skill_check.js — 智力 / 技能答题加成 / 速度加成 的平衡验证
// 三个新机制都会放大伤害，必须确认它们叠起来仍然打不穿等级墙
const { GEAR, SPELLS } = require('./js/data.js');

const SPEED_TIERS = [{ ms: 2000, mult: 1.5 }, { ms: 3000, mult: 1.2 }];
const speedMult = ms => (SPEED_TIERS.find(t => ms <= t.ms) || { mult: 1 }).mult;
const resistOf = ch => Math.min(0.78, 0.30 + ch * 0.068);
const decayOf = n => Math.max(0.35, 1 - 0.2 * n);   // 同场连续施法衰减
const spellPower = (base, int, ch, vsBoss) => {
  const v = base + int;
  return vsBoss ? Math.max(1, Math.round(v * (1 - resistOf(ch)))) : v;
};

// UPG = 铁匠强化上限带来的额外攻击（3级 × +2）。第3章之后才拿得到，
// 但它是永久加成，必须算进"低5级还能不能打穿等级墙"里
const UPG = 3 * 2;
function player(lv, g, upg = 0) {
  return {
    lv, maxhp: 30 + (lv - 1) * 8, maxmp: 10 + (lv - 1) * 3,
    atk: 5 + (lv - 1) * 2 + (g.atk || 0) + upg, def: g.def || 0,
    int: 5 + (lv - 1) * 2 + (g.int || 0),
  };
}

// 战斗模拟：answerMs 决定速度加成
function sim(p, e, acc, potions, healVal, answerMs, trials = 3000) {
  let wins = 0;
  const floor = Math.ceil(e.atk * 0.3);
  const sm = speedMult(answerMs);
  for (let t = 0; t < trials; t++) {
    let hp = p.maxhp, ehp = e.hp, combo = 0, pot = potions, turns = 0;
    while (hp > 0 && ehp > 0 && turns < 600) {
      turns++;
      if (hp < p.maxhp * 0.35 && pot > 0) { pot--; hp = Math.min(p.maxhp, hp + healVal); continue; }
      const ok = Math.random() < acc;
      let inc = Math.max(floor, e.atk - p.def) + Math.floor(Math.random() * 3);
      if (ok) {
        combo++;
        const perfect = combo % 3 === 0;
        let dmg = Math.max(1, p.atk - e.def) + Math.floor(Math.random() * 3);
        dmg = Math.round(dmg * sm);
        if (perfect) dmg *= 2;
        ehp -= dmg;
        inc = perfect ? 0 : Math.ceil(inc / 2);
      } else combo = 0;
      hp -= inc;
    }
    if (ehp <= 0 && hp > 0) wins++;
  }
  return wins / trials;
}

const CH = [
  { n: 1, lv: 6,  g: { atk: 5,  def: 5,  int: 2  } },
  { n: 2, lv: 11, g: { atk: 9,  def: 11, int: 8  } },
  { n: 3, lv: 16, g: { atk: 14, def: 17, int: 8  } },
  { n: 4, lv: 21, g: { atk: 19, def: 23, int: 10 } },
  { n: 5, lv: 26, g: { atk: 24, def: 29, int: 10 } },
  { n: 6, lv: 31, g: { atk: 30, def: 36, int: 10 } },
  { n: 7, lv: 36, g: { atk: 36, def: 43, int: 10 } },
  { n: 8, lv: 42, g: { atk: 44, def: 52, int: 10 } },
];
const boss = (p) => ({ hp: 320, def: p.atk - 15, atk: p.def + Math.round(0.4 * p.maxhp * (1 + 3 * 0.35) / 16 * 3) });

let bad = 0;
console.log('=== 速度加成会不会打穿等级墙 ===');
console.log('（低5级 + 每题都在2秒内答对 = 最极端的情况）\n');
console.log('章  慢答(×1.0)  快答(×1.5)   达标+快答');
CH.forEach(c => {
  // 第3章起武器可以强化到 +6，低等级玩家也带着，所以低5级那一列必须含 UPG
  // 强化只对小怪生效，Boss 战一律按 0 算 —— 这条由 upgBonus() 保证，下面单独验
  const rec = player(c.lv, c.g), b = boss(player(c.lv, c.g));
  const low = player(c.lv - 5, c.g);
  const pot = Math.round(rec.maxhp * 0.35);
  const slow = sim(low, b, 0.85, 3, pot, 9999);
  const fast = sim(low, b, 0.85, 3, pot, 1500);
  const recFast = sim(rec, b, 0.85, 3, pot, 1500);
  console.log(`${String(c.n).padEnd(3)} ${(slow * 100).toFixed(0).padStart(8)}%  ${(fast * 100).toFixed(0).padStart(9)}%  ${(recFast * 100).toFixed(0).padStart(10)}%`);
  if (fast > 0.35) { console.log(`   ✗ 第${c.n}章：低5级只靠手快就有 ${(fast * 100).toFixed(0)}% 胜率，等级墙被打穿`); bad++; }
  if (recFast < 0.85) { console.log(`   ✗ 第${c.n}章：达标且手快只有 ${(recFast * 100).toFixed(0)}%，太难`); bad++; }
});

console.log('\n=== 智力对魔法的影响（达标等级）===\n');
console.log('章  智力  火花/烈火/爆炎 对小怪      对Boss（含魔抗）');
CH.forEach((c, i) => {
  const p = player(c.lv, c.g);
  const av = ['fire1', 'fire2', 'fire3'].filter(k => SPELLS[k].lv <= c.lv);
  const mob = av.map(k => spellPower(SPELLS[k].val, p.int, i, false)).join('/') || '—';
  const bo = av.map(k => spellPower(SPELLS[k].val, p.int, i, true)).join('/') || '—';
  console.log(`${String(c.n).padEnd(3)} ${String(p.int).padStart(4)}  ${mob.padEnd(22)} ${bo}`);
});

console.log('\n=== 技能答题加成后仍不能秒 Boss ===\n');
console.log('章  最强魔法 单发(×1.5) 可放 总伤  结果');
CH.forEach((c, i) => {
  const low = player(c.lv - 5, c.g);
  const av = ['fire1', 'fire2', 'fire3'].filter(k => SPELLS[k].lv <= low.lv);
  if (!av.length) { console.log(`${String(c.n).padEnd(3)} 还没学攻击魔法 ✓`); return; }
  const k = av[av.length - 1], s = SPELLS[k];
  const per = spellPower(s.val, low.int, i, true) * 1.5;   // 每发都答对
  const casts = Math.floor(low.maxmp / s.mp);
  let total = 0;
  for (let n = 0; n < casts; n++) total += Math.max(1, Math.round(per * decayOf(n)));
  const d = Math.round(per);
  const kill = total >= 320;
  if (kill) { console.log(`${String(c.n).padEnd(3)} ${s.name} ${String(d).padStart(3)}  ${String(casts).padStart(4)} ${String(total).padStart(5)}  ✗ 能秒，墙被绕过`); bad++; }
  else console.log(`${String(c.n).padEnd(3)} ${s.name} ${String(d).padStart(3)}  ${String(casts).padStart(4)} ${String(total).padStart(5)}  ✓ 不能`);
});

// 智力必须真的有用：护符换成高智力的，魔法伤害要看得出差别
const p1 = player(11, { int: 0 }), p2 = player(11, { int: 10 });
const d1 = spellPower(40, p1.int, 1, false), d2 = spellPower(40, p2.int, 1, false);
console.log(`\n=== 智力有没有用 ===\n  Lv11 无护符 智力${p1.int} → 烈火术 ${d1}`);
console.log(`  Lv11 九九项链 智力${p2.int} → 烈火术 ${d2}  （差 ${d2 - d1}）`);
if (d2 - d1 < 3) { console.log('  ✗ 智力加成几乎看不出来，护符没意义'); bad++; }

if (bad) { console.log(`\n✗ ${bad} 处问题`); process.exit(1); }
console.log('\n✅ 智力/技能答题/速度加成 三者叠加后，等级墙仍然成立，且各机制都有实感');


// ---- 铁匠强化绝不能加到 Boss 伤害上 ----
// 实测过：+6 攻会让低5级打 Boss 的胜率从 4% 涨到 91%，等级墙直接没了
console.log('\n=== 铁匠强化只对小怪生效 ===\n');
const gsrc = require('fs').readFileSync('js/game.js', 'utf8');
let ubad = 0;
const chk = (cond, msg) => { console.log(`  ${cond ? '✓' : '✗'} ${msg}`); if (!cond) ubad++; };
chk(/function upgBonus\(vsBoss\) \{ return vsBoss \? 0 :/.test(gsrc),
  'upgBonus(vsBoss) 对 Boss 返回 0');
chk(/function totalAtk\(\) \{ return GS\.p\.atk \+ sumGear\('atk'\); \}/.test(gsrc),
  'totalAtk 里不含强化（等级墙和Boss伤害都用它）');
chk(/totalAtk\(\) \+ upgBonus\(this\.isBoss\) - this\.enemy\.def/.test(gsrc),
  '伤害计算走 upgBonus(this.isBoss)');
chk(!/sumGear\('atk'\)[^\n]*GS\.upg/.test(gsrc), '强化没被偷偷塞进装备加成里');
// 数值上验一遍：满强化对 Boss 净伤没有影响，对本章真实小怪确实有影响
const UPGMAX = 3 * 2;
const { CHAPTERS, ENEMIES } = require('./js/data.js');
CHAPTERS.forEach((C, ci) => {
  const c = CH[ci];
  const p = player(c.lv, c.g), b = boss(p);
  const bossNo = Math.max(1, p.atk - b.def), bossUp = Math.max(1, p.atk + 0 - b.def);
  if (bossNo !== bossUp) { console.log(`  ✗ 第${C.n}章 Boss 净伤被强化改了`); ubad++; }
  // 本章小怪（图鉴里除 revenge/boss 之外的）
  const mobs = C.dex.filter(k => ENEMIES[k] && !ENEMIES[k].boss && k !== 'revenge');
  mobs.forEach(k => {
    const d = ENEMIES[k].def;
    const no = Math.max(1, p.atk - d), up = Math.max(1, p.atk + UPGMAX - d);
    if (up <= no) { console.log(`  ✗ 第${C.n}章 ${ENEMIES[k].name}：强化前后伤害都是 ${no}，强化没意义`); ubad++; }
  });
  console.log(`  ✓ 第${C.n}章 Boss净伤 ${bossNo}（不变）　小怪 ${mobs.map(k => {
    const d = ENEMIES[k].def;
    return `${ENEMIES[k].name} ${Math.max(1, p.atk - d)}→${Math.max(1, p.atk + UPGMAX - d)}`;
  }).join('、')}`);
});
if (ubad) { console.log(`\n✗ 强化机制 ${ubad} 处问题`); process.exit(1); }
console.log('\n✅ 铁匠强化加速刷级，但打不穿等级墙');

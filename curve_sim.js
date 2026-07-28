// curve_sim.js — 全七章成长曲线验证
// 数值由公式推导，不手写表：这样"等级墙"的强度与章节数字大小无关
// 跑法: node curve_sim.js

const expNeed = lv => 20 + lv * 20;
const cumExp = lv => { let s = 0; for (let i = 1; i < lv; i++) s += expNeed(i); return s; };

function player(lv, gear) {
  return {
    lv,
    maxhp: 30 + (lv - 1) * 8,
    maxmp: 10 + (lv - 1) * 3,
    atk: 5 + (lv - 1) * 2 + gear.atk,
    def: gear.def,
    spd: gear.spd,
  };
}

// ---- 数值推导公式（这几条就是整个游戏的平衡骨架）----
//
// 等级墙的本质：伤害 = 攻击 − 敌防。要让"差5级"变成"差3倍伤害"，
// 必须让达标时的净伤害只有约 15 点 —— 差10点攻击才会是致命差距。
// 所以敌防必须跟着玩家攻击走，而不是随章节固定增长。
const NET_DMG_BOSS = 15;   // Boss 战达标时每击净伤害
const NET_DMG_MOB  = 26;   // 小怪战达标时每击净伤害
const BOSS_TURNS   = 16;   // Boss 战目标回合数（小孩的注意力上限）
const MOB_HITS     = 4;    // 小怪该被打几下
const FIGHTS       = 14;   // 每章期望战斗场次（决定练级量=题量）
const POTION_FRAC  = 0.35; // 一瓶药水回多少（占最大HP比例）
const POTIONS      = 3;    // 打 Boss 时身上带几瓶
// 达标时这场仗要消耗掉玩家总资源（血+药）的多大比例。
// 这个值决定等级墙：低5级伤害只有1/3 → 要打3倍回合 → 资源需求超100% → 必死。
// 太低墙就软，太高达标玩家会被打死 —— 所以不手填，由下面的 tune() 搜出来。
let RESOURCE_BURN = 0.62;

function chapterStats(lv, gear, prevLv) {
  const p = player(lv, gear);
  const dmgPerTurn = NET_DMG_BOSS * (1 + 1 / 3);              // 每3题一次暴击x2
  const need = cumExp(lv) - cumExp(prevLv);
  // 玩家这场仗能承受的总伤害 = 血量 + 药水
  const absorb = p.maxhp * (1 + POTIONS * POTION_FRAC);
  // 答对格挡减半、每3次完美格挡免伤 → 实际每回合只吃到 1/3 的敌方攻击
  const perTurn = RESOURCE_BURN * absorb / BOSS_TURNS;
  return {
    p,
    boss: {
      def: p.atk - NET_DMG_BOSS,
      hp:  Math.round(dmgPerTurn * BOSS_TURNS),
      atk: p.def + Math.round(perTurn * 3),
    },
    mob: {
      def: p.atk - NET_DMG_MOB,
      hp:  NET_DMG_MOB * MOB_HITS,
      atk: p.def + Math.round(p.maxhp / 16),
      exp: Math.round(need / FIGHTS),
      gold: Math.round(need / FIGHTS / 4),
    },
    need,
    potion: Math.round(p.maxhp * POTION_FRAC),
  };
}

function sim(p, e, acc, potions, healVal, trials = 3000) {
  let wins = 0, turnSum = 0;
  const floor = Math.ceil(e.atk * 0.3);
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
        if (perfect) dmg *= 2;
        ehp -= dmg;
        inc = perfect ? 0 : Math.ceil(inc / 2);
      } else combo = 0;
      if (Math.random() < p.spd * 0.015) inc = 0;
      hp -= inc;
    }
    if (ehp <= 0 && hp > 0) { wins++; turnSum += turns; }
  }
  return { win: wins / trials, turns: wins ? turnSum / wins : Infinity };
}

// 各章：建议等级 + 该章商店主力装备加成
const CH = [
  { n:1, name:'乘法口诀沙漠', lv:6,  gear:{atk:5,  def:5,  spd:2} },
  { n:2, name:'数字峡谷',     lv:11, gear:{atk:9,  def:11, spd:5} },
  { n:3, name:'时光钟楼',     lv:16, gear:{atk:14, def:17, spd:5} },
  { n:4, name:'砝码矿洞',     lv:21, gear:{atk:19, def:23, spd:8} },
  { n:5, name:'尺寸长廊',     lv:26, gear:{atk:24, def:29, spd:8} },
  { n:6, name:'汉字森林',     lv:31, gear:{atk:30, def:36, spd:11} },
  { n:7, name:'古诗山谷',     lv:36, gear:{atk:36, def:43, spd:11} },
  { n:8, name:'遗忘城(终章)', lv:42, gear:{atk:44, def:52, spd:14} },
];

// ---- 自动搜参：找出让八章同时满足所有约束的 RESOURCE_BURN ----
// 手工试参数是这类平衡问题最容易出错的地方，交给搜索
function evaluate(burn, trials = 900) {
  RESOURCE_BURN = burn;
  let worstLow = 0, worstMid = 1, worstWeak = 0;
  CH.forEach((c, i) => {
    const s = chapterStats(c.lv, c.gear, i === 0 ? 1 : CH[i - 1].lv);
    worstLow  = Math.max(worstLow,  sim(player(c.lv - 5, c.gear), s.boss, 0.85, 3, s.potion, trials).win);
    worstMid  = Math.min(worstMid,  sim(s.p, s.boss, 0.85, 3, s.potion, trials).win);
    worstWeak = Math.max(worstWeak, sim(s.p, s.boss, 0.35, 3, s.potion, trials).win);
  });
  return { worstLow, worstMid, worstWeak, ok: worstLow <= 0.25 && worstMid >= 0.85 && worstWeak <= 0.55 };
}

function tune() {
  const hits = [];
  console.log('=== 搜索 RESOURCE_BURN（要求：低5级≤25%、达标≥85%、弱35%≤55%）===\n');
  console.log('  取值   低5级最差  达标最差  弱35%最差');
  for (let b = 0.20; b <= 0.70001; b += 0.05) {
    const r = evaluate(+b.toFixed(2));
    console.log(`  ${b.toFixed(2)}   ${(r.worstLow*100).toFixed(0).padStart(6)}%  ${(r.worstMid*100).toFixed(0).padStart(7)}%  ${(r.worstWeak*100).toFixed(0).padStart(7)}%   ${r.ok ? '✓ 可用' : ''}`);
    if (r.ok) hits.push(+b.toFixed(2));
  }
  if (!hits.length) { console.log('\n✗ 没有取值能同时满足全部约束，说明公式骨架本身要改'); return null; }
  const pick = hits[Math.floor(hits.length / 2)];   // 取可用区间中点，留容错余量
  console.log(`\n  可用区间: ${hits.join(' / ')}  → 取中点 ${pick}\n`);
  return pick;
}

const tuned = tune();
if (tuned === null) process.exit(1);
RESOURCE_BURN = tuned;

let bad = 0;
const fail = m => { console.log('   ✗ ' + m); bad++; };
const rows = [];

console.log(`=== 各章 Boss 战（RESOURCE_BURN=${RESOURCE_BURN}，准确率85%，3瓶药水）===\n`);
console.log('章  地图            建议Lv  我攻 我防  我HP │ 敌防 敌攻  敌HP │ 低5级 达标 弱35%  回合');
CH.forEach((c, i) => {
  const prevLv = i === 0 ? 1 : CH[i - 1].lv;
  const s = chapterStats(c.lv, c.gear, prevLv);
  rows.push({ c, s });
  const low  = sim(player(c.lv - 5, c.gear), s.boss, 0.85, 3, s.potion);
  const mid  = sim(s.p,                      s.boss, 0.85, 3, s.potion);
  const weak = sim(s.p,                      s.boss, 0.35, 3, s.potion);
  console.log(
    `${String(c.n).padEnd(3)} ${c.name.padEnd(13)} Lv${String(c.lv).padEnd(4)} ` +
    `${String(s.p.atk).padStart(4)} ${String(s.p.def).padStart(4)} ${String(s.p.maxhp).padStart(5)} │ ` +
    `${String(s.boss.def).padStart(4)} ${String(s.boss.atk).padStart(4)} ${String(s.boss.hp).padStart(5)} │ ` +
    `${(low.win*100).toFixed(0).padStart(4)}% ${(mid.win*100).toFixed(0).padStart(4)}% ` +
    `${(weak.win*100).toFixed(0).padStart(5)}% ${(mid.turns===Infinity?'-':mid.turns.toFixed(0)).padStart(5)}`
  );
  if (low.win  > 0.25) fail(`第${c.n}章：低5级胜率 ${(low.win*100).toFixed(0)}%，等级墙太软`);
  if (mid.win  < 0.80) fail(`第${c.n}章：达标胜率仅 ${(mid.win*100).toFixed(0)}%，太难`);
  if (weak.win > 0.55) fail(`第${c.n}章：准确率35%还能赢 ${(weak.win*100).toFixed(0)}%，知识不重要了`);
  if (mid.turns > 30)  fail(`第${c.n}章：Boss 战 ${mid.turns.toFixed(0)} 回合，太拖沓`);
});

console.log('\n=== 练级量（= 孩子要做多少题）===\n');
console.log('章  升级区间      需经验  每怪经验  场次  ≈题量  该章金币');
let totalFights = 0;
rows.forEach(({ c, s }, i) => {
  const from = i === 0 ? 1 : CH[i - 1].lv;
  const fights = Math.ceil(s.need / s.mob.exp);
  totalFights += fights;
  console.log(
    `${String(c.n).padEnd(3)} Lv${String(from).padStart(2)}→Lv${String(c.lv).padStart(2)}   ` +
    `${String(s.need).padStart(7)}   ${String(s.mob.exp).padStart(6)}  ${String(fights).padStart(4)}  ` +
    `${String(fights*6).padStart(5)}  ${String(fights*s.mob.gold).padStart(6)}G`
  );
  if (fights > 30) fail(`第${c.n}章要打 ${fights} 场，刷级太枯燥`);
  if (fights < 8)  fail(`第${c.n}章只要打 ${fights} 场，练级没有存在感`);
});
console.log(`\n全流程约 ${totalFights} 场战斗 ≈ ${totalFights * 6} 道练习题`);
if (totalFights * 6 < 600) fail(`全流程仅 ${totalFights*6} 题，暑假分量不够`);

console.log('\n=== 小怪手感（该被打几下）===');
rows.forEach(({ c, s }) => {
  const hits = Math.ceil(s.mob.hp / (s.p.atk - s.mob.def));
  if (hits < 3 || hits > 7) fail(`第${c.n}章小怪 ${hits} 下打死，手感不对`);
  process.stdout.write(`  第${c.n}章 ${hits}下 `);
});
console.log();

console.log('\n=== 满级玩家（Lv42 + 终章装备）===');
const fin = player(42, CH[7].gear);
console.log(`   HP ${fin.maxhp}  MP ${fin.maxmp}  攻击 ${fin.atk}  防御 ${fin.def}`);

console.log(bad ? `\n✗ ${bad} 处需要调整` : '\n✅ 八章曲线全部成立：等级墙有效、达标可过、知识仍是核心、练级量合理');
process.exit(bad ? 1 : 0);

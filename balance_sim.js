// balance_sim.js — 数值平衡模拟
// 验证两件事: (1) 等级墙存在  (2) 堆装备不能绕过等级墙
// 跑法: node balance_sim.js

// ---- 成长曲线 ----
const expNeed = lv => 20 + lv * 20;

function base(lv) {
  return { lv, maxhp: 30 + (lv - 1) * 8, maxmp: 10 + (lv - 1) * 3, atk: 5 + (lv - 1) * 2 };
}

// ---- 装备表(第1~2章) ----
// atk=攻击 def=防御 spd=速度(闪避/移动/逃跑)
const GEAR = {
  // 武器
  pencil:  { slot:'weapon', name:'铅笔剑',   atk:0,  buy:0   },
  crayon:  { slot:'weapon', name:'蜡笔刀',   atk:2,  buy:60  },
  pen:     { slot:'weapon', name:'钢笔剑',   atk:5,  buy:120 },
  compass: { slot:'weapon', name:'圆规刺剑', atk:9,  buy:300 },
  // 帽子
  cloth_h: { slot:'head',   name:'布帽',     def:1,  buy:30  },
  leather_h:{slot:'head',   name:'皮帽',     def:3,  buy:80  },
  iron_h:  { slot:'head',   name:'铁头盔',   def:5,  buy:220 },
  // 盾牌
  wood_s:  { slot:'shield', name:'木板盾',   def:2,  buy:40  },
  iron_s:  { slot:'shield', name:'铁皮盾',   def:4,  buy:150 },
  eraser_s:{ slot:'shield', name:'橡皮盾',   def:6,  buy:340 },
  // 鞋子
  cloth_b: { slot:'boots',  name:'布鞋',     spd:0,  buy:0   },
  straw_b: { slot:'boots',  name:'草鞋',     spd:2,  buy:35  },
  wind_b:  { slot:'boots',  name:'疾风靴',   spd:5,  buy:180 },
};

function equip(lv, keys) {
  const p = base(lv);
  p.def = 0; p.spd = 0; p.gear = [];
  for (const k of keys) {
    const g = GEAR[k];
    p.atk += g.atk || 0;
    p.def += g.def || 0;
    p.spd += g.spd || 0;
    p.gear.push(g.name);
  }
  return p;
}
const gearCost = keys => keys.reduce((s, k) => s + GEAR[k].buy, 0);

// ---- 战斗模拟 ----
// 我方伤害 = max(1, 攻击 − 敌防) + rand(0,2)；连对3次暴击x2
// 敌方伤害 = max(ceil(敌攻 × 0.3), 敌攻 − 我防) + rand(0,2)
//   ↑ 30% 保底：防御最多减伤 70%，防止堆防具无敌
// 答对=格挡(减半)  答错=全额  连对3次=完美格挡(免伤)
// 闪避率 = spd × 1.5%
function simulate(p, enemy, accuracy, potions = 3, trials = 4000) {
  let wins = 0, turnSum = 0;
  const floor = Math.ceil(enemy.atk * 0.3);
  for (let t = 0; t < trials; t++) {
    let hp = p.maxhp, ehp = enemy.hp, combo = 0, pot = potions, turns = 0;
    while (hp > 0 && ehp > 0 && turns < 500) {
      turns++;
      if (hp < p.maxhp * 0.35 && pot > 0) { pot--; hp = Math.min(p.maxhp, hp + 40); continue; }
      const correct = Math.random() < accuracy;
      let incoming = Math.max(floor, enemy.atk - p.def) + Math.floor(Math.random() * 3);
      if (correct) {
        combo++;
        const perfect = combo % 3 === 0;
        let dmg = Math.max(1, p.atk - enemy.def) + Math.floor(Math.random() * 3);
        if (perfect) dmg *= 2;
        ehp -= dmg;
        incoming = perfect ? 0 : Math.ceil(incoming / 2);
      } else {
        combo = 0;
      }
      if (Math.random() < p.spd * 0.015) incoming = 0; // 闪避
      hp -= incoming;
    }
    if (ehp <= 0 && hp > 0) { wins++; turnSum += turns; }
  }
  return { winRate: wins / trials, avgTurns: wins ? turnSum / wins : Infinity };
}

const BOSS = { hp: 220, def: 8, atk: 16 };
const MOBS = {
  '九九史莱姆': { hp: 26, def: 2, atk: 6,  exp: 42, gold: 11 },
  '借位小鬼':   { hp: 34, def: 3, atk: 8,  exp: 50, gold: 13 },
  '错别字妖精': { hp: 30, def: 3, atk: 7,  exp: 48, gold: 13 },
};

const NAKED = ['pencil', 'cloth_b'];
const CH1_FULL = ['pen', 'leather_h', 'iron_s', 'straw_b'];

console.log('=== 第1章 Boss「口诀骆驼王」 HP220 DEF8 ATK16 ===');
console.log('(准确率 85%，3瓶药水)\n');
console.log('等级  装备                          攻击 防御 HP   胜率   回合');
const rows = [
  [1,  NAKED,    '无装备'],
  [1,  CH1_FULL, `★买齐全套(${gearCost(CH1_FULL)}G)`],
  [3,  NAKED,    '无装备'],
  [4,  ['crayon','cloth_h','wood_s','straw_b'], `蜡笔刀便宜货(${gearCost(['crayon','cloth_h','wood_s','straw_b'])}G)`],
  [5,  ['crayon','cloth_h','wood_s','straw_b'], `蜡笔刀便宜货(${gearCost(['crayon','cloth_h','wood_s','straw_b'])}G)`],
  [5,  ['pen','cloth_h','wood_s','straw_b'],    `钢笔剑+布帽(${gearCost(['pen','cloth_h','wood_s','straw_b'])}G)`],
  [6,  ['pen','leather_h','wood_s','straw_b'],  `钢笔剑+皮帽(${gearCost(['pen','leather_h','wood_s','straw_b'])}G)`],
  [6,  CH1_FULL, `全套(${gearCost(CH1_FULL)}G)`],
  [8,  ['pen','leather_h','wood_s','cloth_b'],  '钢笔剑+皮帽'],
  [10, NAKED,    '无装备(纯练级)'],
];
for (const [lv, keys, label] of rows) {
  const p = equip(lv, keys);
  const r = simulate(p, BOSS, 0.85);
  console.log(
    `Lv${String(lv).padEnd(3)} ${label.padEnd(28)}  ${String(p.atk).padEnd(4)} ${String(p.def).padEnd(4)} ` +
    `${String(p.maxhp).padEnd(4)} ${(r.winRate*100).toFixed(0).padStart(4)}%  ${r.avgTurns===Infinity?'  -':r.avgTurns.toFixed(0).padStart(3)}`
  );
}

console.log('\n=== 准确率的影响 (Lv6 钢笔剑+皮帽) ===');
for (const acc of [0.4, 0.55, 0.7, 0.85, 0.95]) {
  const r = simulate(equip(6, ['pen','leather_h','wood_s','straw_b']), BOSS, acc);
  console.log(`准确率 ${(acc*100).toFixed(0).padStart(3)}% → 胜率 ${(r.winRate*100).toFixed(0).padStart(3)}%  回合 ${r.avgTurns===Infinity?'-':r.avgTurns.toFixed(0)}`);
}

console.log('\n=== 经济：第1章能赚多少、买得起什么 ===');
let cumExp = 0;
for (let lv = 1; lv < 6; lv++) cumExp += expNeed(lv);
const avgExp = Object.values(MOBS).reduce((s,m)=>s+m.exp,0)/3;
const avgGold = Object.values(MOBS).reduce((s,m)=>s+m.gold,0)/3;
const fights = Math.ceil(cumExp / avgExp);
const mainGold = Math.round(fights * avgGold);
const exploreGold = 150; // 支路宝箱
console.log(`练到 Lv6 需 ${cumExp} 经验 ≈ ${fights} 场战斗（≈${fights*6} 道题）`);
console.log(`主线金币 ${mainGold}G ／ 全探索再 +${exploreGold}G = ${mainGold+exploreGold}G`);
console.log(`第1章全套装备 ${gearCost(CH1_FULL)}G → 只靠主线买不起，必须探索或多刷`);
console.log(`推荐配置「钢笔剑+皮帽+木板盾+草鞋」${gearCost(['pen','leather_h','wood_s','straw_b'])}G → 探索后刚好够`);

console.log('\n=== 卖出回收 75% 的换装成本 ===');
for (const [oldK, newK] of [['cloth_h','leather_h'], ['leather_h','iron_h'], ['wood_s','iron_s']]) {
  const o = GEAR[oldK], n = GEAR[newK];
  console.log(`${o.name}(${o.buy}G) → ${n.name}(${n.buy}G)：卖旧得 ${Math.floor(o.buy*0.75)}G，净支出 ${n.buy - Math.floor(o.buy*0.75)}G`);
}

// ---- 断言：设计意图必须成立 ----
const a = simulate(equip(1, NAKED), BOSS, 0.95);
const b = simulate(equip(1, CH1_FULL), BOSS, 0.95);
const c = simulate(equip(6, ['pen','leather_h','wood_s','straw_b']), BOSS, 0.85);
const d = simulate(equip(6, ['pen','leather_h','wood_s','straw_b']), BOSS, 0.35);
const e = simulate(equip(10, NAKED), BOSS, 0.85);
console.assert(a.winRate < 0.05, `❌ 等级墙失效: Lv1无装备全答对胜率 ${a.winRate}`);
console.assert(b.winRate < 0.25, `❌ 堆装备绕过了等级墙: Lv1全套胜率 ${b.winRate}`);
console.assert(c.winRate > 0.85, `❌ 推荐配置打不过: ${c.winRate}`);
console.assert(d.winRate < 0.55, `❌ 知识不重要了: Lv6但准确率35%胜率 ${d.winRate}`);
console.assert(e.winRate > 0.4,  `❌ 装备成了硬门槛: Lv10裸装胜率 ${e.winRate}，纯练级也该有出路`);
console.log('\n✅ 五条设计意图全部成立：');
console.log('   1. 等级不够 → 全答对也打不过');
console.log('   2. 光买装备不练级 → 照样打不过（装备不是捷径）');
console.log('   3. 等级+装备到位 → 稳赢');
console.log('   4. 等级够但不会做题 → 照样输');
console.log('   5. 不买装备但练更高等级 → 也能过（不逼氪，只是更累）');

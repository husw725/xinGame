// data.js — 地图 / 敌人 / 题库（人教版二升三）
const TILE = 32, MAPW = 25, MAPH = 58;

// 图例: T树 .草 -路 r屋顶 w墙 d门 f栅栏 k岩石 ,沙 C仙人掌
//       c宝箱 p记忆碎片 h隐藏点(需放大镜) D迷宫入口 G石门 X水晶 B魔王 1村长 2商人 3老师
// 结构：村庄(0-14) → 沙漠主廊 x10-14，左右支路藏宝(15-46) → 迷宫+石门(47-51) → 魔王(52-57)
const MAP = [
  "TTTTTTTTTTTTTTTTTTTTTTTTT", // 0
  "T...........-...........T",
  "T..rrr......-....rrr....T",
  "T..www......-....www....T",
  "T..wdw......-....wdw....T",
  "T...........-...........T", // 5  （村长/商人已移入屋内）
  "T.......4...-...........T", // 6  铁匠老王
  "T..rrr......-...........T",
  "T..www......-...5.......T", // 8  卖水的婶婶
  "T..wdw......-...........T",
  "T...........-...........T", // 10 （老师已移入学堂）
  "T...........-.......6...T", // 11 朵朵
  "T....T......-......T....T",
  "T......7....-....8......T", // 13 老爷爷 / 石头
  "TTTTTfffffff-fffffffTTTTT", // 14 村口
  "k,,,,,,,,,,,,,,,,,,,,,,,k", // 15 沙漠入口
  "k,,,,,,,,,,,,,,,,,,,,,,,k",
  "k,,,,,,,,k,,,,,k,,,,,,,,k", // 17 主廊成形
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,,,,,,,k,,,,,,,,k", // 20 ← 左支路开口
  "k,,,,,9,,k,,,,,k,,,,,,,,k", // 21 沙漠旅人
  "k,,p,,,,,k,,,,,k,,,,,,,,k", // 22 碎片
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,c,,,k,,,,,k,,,,,,,,k", // 24 宝箱
  "kkkkkkkkkk,,,,,kkkkkkkkkk", // 25 封住左支路
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,,,,,,,,,,k", // 28 ← 右支路开口
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,k,,c,,,,,k", // 30 宝箱
  "k,,,,,,,,k,,,,,k,,,,,p,,k", // 31 碎片
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "kkkkkkkkkk,,,,,kkkkkkkkkk", // 33 封住右支路
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,,,,,,,k,,,,,,,,k", // 35 ← 左支路2开口
  "k,,,,b,,,k,,,,,k,,,,,,,,k", // 36 朵朵的作业本
  "k,,h,,,,,k,,,,,k,,,,,,,,k", // 37 隐藏点(放大镜)
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,h,k,,,,,k,,,,,,,,k", // 39 隐藏点(放大镜)
  "kkkkkkkkkk,,,,,kkkkkkkkkk", // 40
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,,,,,,,,,,k", // 42 ← 右支路2开口
  "k,,,,,,,,k,,,,,k,,,,,,,,k",
  "k,,,,,,,,k,,,,,k,,,h,,,,k", // 44 隐藏点(放大镜)
  "k,,,,,,,,k,,,,,k,,,,,c,,k", // 45 宝箱
  "kkkkkkkkkk,,,,,kkkkkkkkkk", // 46
  "k,,,,,,,,,,,,,,,,,,,,,,,k", // 47 迷宫前广场
  "k,,,,,,,,,,,,,,,,,,,,,,,k",
  "k,,,,,,,,,,D,,,,,,,,,,,,k", // 49 迷宫入口
  "k,,,,,,,,,,,,,,,,,,,,,,,k",
  "kkkkkkkkkkkkGkkkkkkkkkkkk", // 51 石门(解开迷宫才通)
  "k,,,,,,,,,,,,,,,,,,,,,,,k", // 52 魔王区
  "k,,,,,,,,,,,,,,,,,,,,,,,k",
  "k,,,,,,,,,,,X,,,,,,,,,,,k", // 54 记忆水晶
  "k,,,,,,,,,,,B,,,,,,,,,,,k", // 55 口诀骆驼王
  "k,,,,,,,,,,,,,,,,,,,,,,,k",
  "kkkkkkkkkkkkkkkkkkkkkkkkk", // 57
];

const BLOCK_CHARS = 'TrwdfkCXBGD';   // NPC(1-9) 与 b 由代码另行标记为障碍

// 数值经 balance_sim.js 验证：等级墙成立，且堆装备无法绕过
const ENEMIES = {
  slime:  { key:'slime',  name:'九九史莱姆', tex:'slime',  hp:26, def:2, atk:6,  exp:42, gold:11, qtype:'mult' },
  imp:    { key:'imp',    name:'借位小鬼',   tex:'imp',    hp:34, def:3, atk:8,  exp:50, gold:13, qtype:'addsub' },
  wraith: { key:'wraith', name:'错别字妖精', tex:'wraith', hp:30, def:3, atk:7,  exp:48, gold:13, qtype:'chinese' },
  dummy:  { key:'dummy',  name:'训练木桩',   tex:'dummy',  hp:40, def:2, atk:0,  exp:0,  gold:0,  qtype:'mult', practice:true },
  revenge:{ key:'revenge',name:'怨念怪',     tex:'revenge',hp:36, def:3, atk:8,  exp:60, gold:16, qtype:'revenge' },
  boss:   { key:'boss',   name:'口诀骆驼王', tex:'boss',   hp:220,def:8, atk:16, exp:300,gold:150,qtype:'mult', boss:true },
};

// ================= 装备（DQ 逻辑：五部位，卖价 75%） =================
const SLOTS = ['weapon', 'head', 'shield', 'boots', 'charm'];
const SLOT_NAME = { weapon:'⚔️武器', head:'🎩帽子', shield:'🛡️盾牌', boots:'👟鞋子', charm:'📿护符' };
// 每个部位看哪个属性做比较（护符没有数值，只看效果说明）
const SLOT_PROP = { weapon:'atk', head:'def', shield:'def', boots:'spd', charm:null };

const GEAR = {
  // 武器
  pencil:   { slot:'weapon', name:'铅笔剑',   atk:0,  buy:0,   desc:'最初的武器' },
  crayon:   { slot:'weapon', name:'蜡笔刀',   atk:2,  buy:60,  desc:'画出的伤口五颜六色' },
  pen:      { slot:'weapon', name:'钢笔剑',   atk:5,  buy:120, desc:'笔锋很利' },
  compass:  { slot:'weapon', name:'圆规刺剑', atk:9,  buy:300, desc:'又尖又准' },
  brush:    { slot:'weapon', name:'毛笔圣剑', atk:12, buy:0,   desc:'传说中的笔', treasure:true },
  // 帽子
  cloth_h:  { slot:'head',   name:'布帽',     def:1,  buy:30,  desc:'挡挡太阳' },
  leather_h:{ slot:'head',   name:'皮帽',     def:3,  buy:80,  desc:'结实一点' },
  iron_h:   { slot:'head',   name:'铁头盔',   def:5,  buy:220, desc:'沉，但很安全' },
  scholar_h:{ slot:'head',   name:'学士帽',   def:4,  buy:0,   desc:'经验+10%', expBonus:0.1, treasure:true },
  // 盾牌
  wood_s:   { slot:'shield', name:'木板盾',   def:2,  buy:40,  desc:'一块木板' },
  iron_s:   { slot:'shield', name:'铁皮盾',   def:4,  buy:150, desc:'铁做的，靠得住' },
  eraser_s: { slot:'shield', name:'橡皮盾',   def:6,  buy:340, desc:'答错伤害减半', softenWrong:true },
  // 鞋子
  cloth_b:  { slot:'boots',  name:'布鞋',     spd:0,  buy:0,   desc:'普通的鞋' },
  straw_b:  { slot:'boots',  name:'草鞋',     spd:2,  buy:35,  desc:'走得快一点' },
  wind_b:   { slot:'boots',  name:'疾风靴',   spd:5,  buy:180, desc:'走得飞快' },
  // 护符
  abacus:   { slot:'charm',  name:'铜算盘',   buy:100, desc:'金币+20%', goldBonus:0.2 },
  dict:     { slot:'charm',  name:'字典护符', buy:160, desc:'语文题伤害+30%', boost:'chinese' },
  necklace: { slot:'charm',  name:'九九项链', buy:0,   desc:'数学题伤害+30%', boost:'math', treasure:true },
};

// 第1章商店卖什么（宝箱专属的不卖）
const SHOP_GEAR = ['crayon','pen','cloth_h','leather_h','wood_s','iron_s','straw_b','wind_b','abacus','dict'];

// ================= 魔法 =================
// kind: heal治疗 / attack攻击(无视防御) / buff辅助 / field非战斗
const SPELLS = {
  heal1:   { name:'初级治愈术', lv:3,  mp:3,  kind:'heal',   val:25, desc:'回复25点HP' },
  heal2:   { name:'中级治愈术', lv:8,  mp:7,  kind:'heal',   val:60, desc:'回复60点HP' },
  heal3:   { name:'高级治愈术', lv:14, mp:14, kind:'heal',   val:999,desc:'回复全部HP' },
  fire1:   { name:'火花术',     lv:4,  mp:4,  kind:'attack', val:18, desc:'无视防御18伤害' },
  fire2:   { name:'烈火术',     lv:9,  mp:8,  kind:'attack', val:40, desc:'无视防御40伤害' },
  fire3:   { name:'爆炎术',     lv:15, mp:16, kind:'attack', val:90, desc:'无视防御90伤害' },
  hint:    { name:'提示术',     lv:5,  mp:2,  kind:'buff',   desc:'本题去掉两个错选项' },
  slowtime:{ name:'缓时术',     lv:7,  mp:3,  kind:'buff',   desc:'限时题时间加倍' },
  shield:  { name:'护盾术',     lv:10, mp:6,  kind:'buff',   desc:'3回合内敌方伤害减半' },
  focus:   { name:'集中术',     lv:12, mp:5,  kind:'buff',   desc:'下一击必定暴击' },
  gohome:  { name:'归乡术',     lv:6,  mp:8,  kind:'field',  desc:'瞬间回到村庄' },
  seek:    { name:'探宝术',     lv:7,  mp:4,  kind:'field',  desc:'指出附近的宝物' },
  repel:   { name:'避敌术',     lv:10, mp:5,  kind:'field',  desc:'一段时间内小怪不靠近' },
};

function spellsAt(lv) {
  return Object.keys(SPELLS).filter(k => SPELLS[k].lv <= lv);
}

const SPAWNS = [
  { k:'slime',  x:12, y:16 },
  { k:'slime',  x:11, y:19 },
  { k:'slime',  x:4,  y:21 },   // 左支路1
  { k:'imp',    x:13, y:23 },
  { k:'slime',  x:12, y:27 },
  { k:'imp',    x:19, y:29 },   // 右支路1
  { k:'wraith', x:11, y:31 },
  { k:'imp',    x:13, y:36 },
  { k:'wraith', x:5,  y:38 },   // 左支路2
  { k:'wraith', x:12, y:42 },
  { k:'imp',    x:20, y:43 },   // 右支路2
  { k:'wraith', x:12, y:48 },
];
const REVENGE_TILE = { x:14, y:15 };
const PLAYER_START = { x:12, y:12 };

// ================= 记忆碎片（一本日记，全七章共 56 页） =================
// 第一章只放第 1–8 页：建立同情，不给任何身份线索。
// 许愿（第41-48页）和"陪我再学一次"（第56页）分别在第6章和终章 —— 提前给出会毁掉整条暗线。
const TOTAL_FRAGS = 56;
const FRAGMENTS = [
  { where:'左支路 · 沙地上',  text:'第一页：\n「今天又是最后一名。\n先生念名字的时候，我盯着桌子。」' },
  { where:'右支路 · 沙地上',  text:'第二页：\n「他们叫我笨蛋。\n我说我不是，可我说不出为什么。」' },
  { where:'迷宫第一间',       text:'第三页：\n「口诀我背了一百遍。\n昨天会，今天又忘了。」' },
  { where:'迷宫第三间',       text:'第四页：\n「娘说慢一点没关系。\n可是先生不这么想。」' },
  { where:'宝箱里',           text:'第五页：\n「先生说，有的孩子天生就学不会。\n他说的时候没有看我。」' },
  { where:'隐藏处 · 需放大镜', text:'第六页：\n「我把课本藏到沙漠里了。\n没有课本，就不会有人问我了。」' },
  { where:'隐藏处 · 需放大镜', text:'第七页：\n「藏完那天下午，\n我一个人在沙丘上坐到天黑。」' },
  { where:'隐藏处 · 需放大镜', text:'第八页：\n「我开始盼着下雨。\n下雨就不用去学堂了。」' },
];

// ================= NPC =================
// 每个 NPC 必须有：名字、一句能记住的性格、随进度变化的台词。
// tex 复用村民贴图的三种配色。
const NPCS = {
  '1': { name:'村长',       tex:'npc_elder',    role:'elder' },
  '2': { name:'商人',       tex:'npc_merchant', role:'shop' },
  '3': { name:'老师',       tex:'npc_teacher',  role:'teacher' },
  '4': { name:'铁匠老王',   tex:'npc_smith',    role:'clue', clue:'code1' },
  '5': { name:'卖水的婶婶', tex:'npc_aunt',     role:'clue', clue:'code2' },
  '6': { name:'朵朵',       tex:'npc_girl',     role:'quest' },
  '7': { name:'守林的爷爷', tex:'npc_grandpa',  role:'lore' },
  '8': { name:'石头',       tex:'npc_boy',      role:'chat' },
  '9': { name:'沙漠旅人',   tex:'npc_traveler', role:'clue', clue:'bridge' },
};

// ================= 线索 =================
// 线索必须是解谜的必需品，不能是可有可无的提示。
// lock 指明这条线索服务于哪个锁；ask 是 NPC 用题目形式说出来的话；answer 是算出来的结果。
const CLUES = {
  code1:  { lock:'chest3', from:'铁匠老王',   ask:'口令第一个数？二三得几，你自己算。',
            answer:6,  note:'口令第1个数 = 二三得几' },
  code2:  { lock:'chest3', from:'卖水的婶婶', ask:'第二个数嘛……二的四倍。哎哟我这记性。',
            answer:8,  note:'口令第2个数 = 二的四倍' },
  code3:  { lock:'chest3', from:'朵朵',       ask:'谢谢你！第三个数是——五五二十五里的那个五！',
            answer:5,  note:'口令第3个数 = 五五二十五里的五' },
  bridge: { lock:'lore',   from:'沙漠旅人',   ask:'沙子里有几处颜色不一样。没有放大镜是看不出来的。',
            answer:null, note:'沙漠里有隐藏处，需要放大镜' },
};

// ================= 宝箱锁 =================
// 原则：短(10-30秒)、杂(不重复)、无惩罚(随便重来)。锁的类型显示在箱子上，孩子才有预期。
// kind: calc算式锁 / balance天平锁 / code口令锁(需线索)
const CHEST_LOCKS = [
  { kind:'calc',    icon:'🔢', hint:'箱盖上刻着一道题' },
  { kind:'balance', icon:'⚖️', hint:'箱盖上是一架天平，要找出相等的那个' },
  { kind:'code',    icon:'🔒', hint:'三个数字轮盘。\n村里有人知道口令。', clues:['code1','code2','code3'] },
];

// ================= 室内 =================
// 图例: W墙 F地板 D出口(门) N屋主 u柜子 t桌子 p盆栽 B床
// 村里三栋房子，门口的 NPC 改成住在里面。柜子可以翻，翻到什么是随机的。
const HOUSES = {
  // 门在地图上的坐标 → 室内
  '4,4':  { name:'村长家', owner:'1', rows:[
    "WWWWWWWWW",
    "WFuFFFuFW",
    "WFFFFFFFW",
    "WFtFNFtFW",
    "WFFFFFFFW",
    "WBFFFFFpW",
    "WFFFDFFFW",
    "WWWWWWWWW",
  ]},
  '18,4': { name:'商人家', owner:'2', rows:[
    "WWWWWWWWW",
    "WuuFFFuuW",
    "WFFFFFFFW",
    "WFFFNFFFW",
    "WFtFFFtFW",
    "WpFFFFFBW",
    "WFFFDFFFW",
    "WWWWWWWWW",
  ]},
  '4,9':  { name:'学堂',   owner:'3', rows:[
    "WWWWWWWWW",
    "WFuFFFuFW",
    "WtFtFtFtW",
    "WFFFNFFFW",
    "WtFtFtFtW",
    "WpFFFFFpW",
    "WFFFDFFFW",
    "WWWWWWWWW",
  ]},
};
const HOUSE_BLOCK = 'WNutpB';

// 翻柜子/桌子/盆栽能翻到什么。空手率要高，翻到东西才有惊喜
const SEARCH_LOOT = [
  { w:34, kind:'none',   msgs:['空的。', '什么也没有。', '只有灰尘。', '一只小虫子跑掉了。'] },
  { w:22, kind:'gold',   min:3,  max:12,  msg:'找到了 💰{n} 金币！' },
  { w:14, kind:'potion', msg:'找到了一瓶【药水】！' },
  { w:8,  kind:'ether',  msg:'找到了一瓶【魔法药水】！' },
  { w:10, kind:'scroll', msg:'找到了一张【提示卷轴】！' },
  { w:8,  kind:'gold',   min:20, max:45,  msg:'哇，压在最底下的 💰{n} 金币！' },
  { w:4,  kind:'herb',   msg:'找到了一株【知识草】。\n嚼一嚼，MP 全满了！' },
];

function rollLoot() {
  const total = SEARCH_LOOT.reduce((s, l) => s + l.w, 0);
  let r = irnd(1, total);
  for (const l of SEARCH_LOOT) { r -= l.w; if (r <= 0) return l; }
  return SEARCH_LOOT[0];
}

// 宝箱内容（按地图上从上到下的顺序）
const CHESTS = [
  { kind:'gear',  key:'leather_h', msg:'找到了【皮帽】！' },
  { kind:'frag',  idx:4,           msg:'箱子里是一页发黄的纸……' },
  { kind:'gear',  key:'scholar_h', msg:'找到了传说中的【学士帽】！\n（商店买不到，经验+10%）' },
];

// ================= 推箱子迷宫（口诀箱） =================
// 把写着正确得数的箱子推到对应口诀的凹槽上。'#'墙 '.'地面
const SOKOBAN = [
  {
    name: '第一间 · 试试看',
    hint: '站在箱子的另一边，朝凹槽的方向走，就能把箱子推过去。',
    rows: [
      "#########",
      "#.......#",
      "#.O...P.#",
      "#.......#",
      "#.O...P.#",
      "#.......#",
      "#...@...#",
      "#.......#",
      "#########",
    ],
    boxes: [{ x:2, y:2, val:6 }, { x:2, y:4, val:12 }],
    goals: [{ x:6, y:2, a:2, b:3 }, { x:6, y:4, a:3, b:4 }],
    reward: { kind:'frag', idx:2 },
  },
  {
    name: '第二间 · 有个多余的',
    hint: '三个箱子里只有两个用得上。先算出凹槽要的得数，再决定推哪个。',
    rows: [
      "#########",
      "#.......#",
      "#.O.O.O.#",
      "#.......#",
      "#.......#",
      "#..P.P..#",
      "#...@...#",
      "#.......#",
      "#########",
    ],
    boxes: [{ x:2, y:2, val:18 }, { x:4, y:2, val:21 }, { x:6, y:2, val:24 }],
    goals: [{ x:3, y:5, a:3, b:7 }, { x:5, y:5, a:4, b:6 }],
    reward: { kind:'gold', val:120 },
  },
  {
    name: '第三间 · 想清楚再推',
    hint: '凹槽在一个窄洞里，只能从下面往上推。先把箱子推到洞口正下方。',
    rows: [
      "#########",
      "#.......#",
      "#.......#",
      "#.###...#",
      "#.#P#...#",
      "#.#.#...#",
      "#....O.O#",
      "#..@....#",
      "#########",
    ],
    boxes: [{ x:5, y:6, val:42 }, { x:7, y:6, val:48 }],
    goals: [{ x:3, y:4, a:6, b:7 }],
    reward: { kind:'frag', idx:3 },
  },
];

// ================= 题库 =================
function irnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = irnd(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const CN = ['零','一','二','三','四','五','六','七','八','九'];
function numCN(n) {
  if (n === 10) return '一十';
  if (n < 10) return CN[n];
  const t = Math.floor(n / 10), o = n % 10;
  return (t > 1 ? CN[t] : '') + '十' + (o ? CN[o] : '');
}

function numOptions(c) {
  const set = new Set([c]);
  const cands = shuffle([c + 1, c - 1, c + 10, c - 10, c + 2, c - 2, c + 9, c + 11]);
  for (const v of cands) { if (set.size >= 4) break; if (v > 0 && v !== c) set.add(v); }
  while (set.size < 4) { const v = c + irnd(1, 15); if (v > 0) set.add(v); }
  return shuffle([...set].map(String));
}

function multQ() {
  const a = irnd(2, 9), b = irnd(2, 9), c = a * b;
  const m = Math.min(a, b), M = Math.max(a, b);
  const kou = CN[m] + CN[M] + (c < 10 ? '得' + CN[c] : numCN(c));
  return { text: `${a} × ${b} = ?`, options: numOptions(c), answer: String(c), tip: `口诀：${kou}` };
}

function addsubQ() {
  if (Math.random() < 0.5) {
    let a, b;
    do { a = irnd(15, 85); b = irnd(6, 99 - a); } while (a % 10 + b % 10 < 10);
    const c = a + b;
    return { text: `${a} + ${b} = ?`, options: numOptions(c),
      answer: String(c), tip: `个位 ${a%10}+${b%10}=${a%10+b%10}，别忘了向十位进1` };
  } else {
    let a, b;
    do { a = irnd(32, 99); b = irnd(13, a - 5); } while (a % 10 >= b % 10);
    const c = a - b;
    return { text: `${a} − ${b} = ?`, options: numOptions(c),
      answer: String(c), tip: `个位 ${a%10} 不够减 ${b%10}，要向十位借1` };
  }
}

const ZI = [
  { t: '公（　）里开满了花', a: '园', d: ['圆','元','远'], tip: '公园的"园"外面有围墙（囗）' },
  { t: '请（　）下来休息一会儿', a: '坐', d: ['座','作','昨'], tip: '"坐"是动作，"座"是座位' },
  { t: '明天（　）见！', a: '再', d: ['在','才','载'], tip: '"再"表示又一次，"在"表示地点' },
  { t: '我（　）学校读书', a: '在', d: ['再','存','左'], tip: '"在"表示地点' },
  { t: '（　）色的天空真美', a: '蓝', d: ['篮','兰','拦'], tip: '"蓝"是颜色，"篮"是竹字头的篮子' },
  { t: '我们一起打（　）球', a: '篮', d: ['蓝','兰','栏'], tip: '篮球的"篮"是竹字头' },
  { t: '远处传来了歌（　）', a: '声', d: ['生','升','身'], tip: '声音的"声"' },
  { t: '我写（　）作业再去玩', a: '完', d: ['玩','元','院'], tip: '"完"是做完，"玩"是玩耍' },
  { t: '我和同学一起（　）游戏', a: '做', d: ['作','坐','昨'], tip: '做游戏用单人旁的"做"' },
  { t: '语文（　）业写完了', a: '作', d: ['做','坐','座'], tip: '作业的"作"' },
  { t: '我家离学校很（　）', a: '近', d: ['进','今','斤'], tip: '距离近用"近"，走进去用"进"' },
  { t: '上课了，快（　）教室吧', a: '进', d: ['近','今','井'], tip: '走进去用"进"' },
  { t: '月亮慢慢（　）起来了', a: '升', d: ['声','生','身'], tip: '上升的"升"' },
];

const LIANG = [
  { t: '一（　）马', a: '匹', d: ['只','头','条'] },
  { t: '一（　）牛', a: '头', d: ['匹','条','支'] },
  { t: '一（　）鱼', a: '条', d: ['只','头','个'] },
  { t: '一（　）小鸟', a: '只', d: ['条','头','匹'] },
  { t: '一（　）花', a: '朵', d: ['个','只','棵'] },
  { t: '一（　）大树', a: '棵', d: ['朵','颗','只'] },
  { t: '一（　）星星', a: '颗', d: ['棵','朵','匹'] },
  { t: '一（　）雨伞', a: '把', d: ['个','支','张'] },
  { t: '一（　）桌子', a: '张', d: ['个','把','条'] },
  { t: '一（　）铅笔', a: '支', d: ['张','头','只'] },
  { t: '一（　）鞋子', a: '双', d: ['个','副','头'] },
];

const FAN = [
  { t: '"大"的反义词是？', a: '小', d: ['高','多','圆'] },
  { t: '"长"的反义词是？', a: '短', d: ['宽','高','大'] },
  { t: '"黑"的反义词是？', a: '白', d: ['红','蓝','灰'] },
  { t: '"快"的反义词是？', a: '慢', d: ['长','短','急'] },
  { t: '"开"的反义词是？', a: '关', d: ['放','走','停'] },
  { t: '"哭"的反义词是？', a: '笑', d: ['闹','叫','唱'] },
  { t: '"冷"的反义词是？', a: '热', d: ['凉','温','暖'] },
  { t: '"前"的反义词是？', a: '后', d: ['左','右','上'] },
  { t: '"早"的反义词是？', a: '晚', d: ['迟','夜','黑'] },
  { t: '"多"的反义词是？', a: '少', d: ['小','短','空'] },
];

const SHI = [
  { t: '离离原上草，一岁一（　）。', a: '枯荣', d: ['开花','生长','长青'], tip: '《赋得古原草送别》白居易' },
  { t: '碧玉妆成一树高，万条垂下绿（　）。', a: '丝绦', d: ['丝带','柳条','树枝'], tip: '《咏柳》贺知章' },
  { t: '不知细叶谁裁出，二月春风似（　）。', a: '剪刀', d: ['菜刀','小刀','尺子'], tip: '《咏柳》贺知章' },
  { t: '草长莺飞二月天，拂堤杨柳醉春（　）。', a: '烟', d: ['风','雨','光'], tip: '《村居》高鼎' },
  { t: '儿童散学归来早，忙趁东风放（　）。', a: '纸鸢', d: ['风车','纸船','气球'], tip: '《村居》纸鸢就是风筝' },
  { t: '接天莲叶无穷碧，映日荷花别样（　）。', a: '红', d: ['美','香','多'], tip: '《晓出净慈寺送林子方》杨万里' },
  { t: '两个黄鹂鸣翠柳，一行白鹭上（　）。', a: '青天', d: ['蓝天','白云','高山'], tip: '《绝句》杜甫' },
  { t: '窗含西岭千秋雪，门泊东吴万里（　）。', a: '船', d: ['路','桥','人'], tip: '《绝句》杜甫' },
  { t: '飞流直下三千尺，疑是银河落（　）。', a: '九天', d: ['人间','山间','天上'], tip: '《望庐山瀑布》李白' },
  { t: '天苍苍，野茫茫，风吹草低见（　）。', a: '牛羊', d: ['马儿','羊群','骆驼'], tip: '《敕勒歌》北朝民歌' },
];

function bankQ(item) {
  return { text: item.t, options: shuffle([item.a, ...item.d]), answer: item.a, tip: item.tip || `正确答案是"${item.a}"` };
}

function chineseQ() {
  const pool = [ZI, LIANG, FAN, SHI][irnd(0, 3)];
  return bankQ(pool[irnd(0, pool.length - 1)]);
}

// 天平锁专用：左边一个算式，四个选项里选出得数相等的那个（等式概念）
function balanceQ() {
  const a = irnd(2, 9), b = irnd(2, 9), c = a * b;
  // 正确项：另一个得数相同的算式，或加法表达
  const pairs = [];
  for (let i = 2; i <= 9; i++) if (c % i === 0 && c / i >= 2 && c / i <= 9 && i !== a) pairs.push([i, c / i]);
  const right = pairs.length ? `${pairs[0][0]} × ${pairs[0][1]}` : `${c - 10} + 10`;
  const wrong = new Set();
  while (wrong.size < 3) {
    const d = c + (Math.random() < 0.5 ? 1 : -1) * irnd(1, 8);
    if (d === c || d < 2) continue;
    const f = [];
    for (let i = 2; i <= 9; i++) if (d % i === 0 && d / i >= 2 && d / i <= 9) f.push([i, d / i]);
    wrong.add(f.length ? `${f[0][0]} × ${f[0][1]}` : `${d - 1} + 1`);
  }
  return {
    text: `天平左边是  ${a} × ${b}\n哪一个和它一样重？`,
    options: shuffle([right, ...wrong]),
    answer: right,
    tip: `${a}×${b}=${c}，${right} 也等于 ${c}`,
  };
}

function getQuestion(type) {
  if (type === 'balance') return balanceQ();
  if (type === 'mixed') type = ['mult', 'addsub', 'chinese'][irnd(0, 2)];
  if (type === 'mult') return multQ();
  if (type === 'addsub') return addsubQ();
  return chineseQ();
}

if (typeof module !== 'undefined') {
  module.exports = { MAP, MAPW, MAPH, ENEMIES, SPAWNS, GEAR, SLOTS, SHOP_GEAR, SPELLS, spellsAt,
                     FRAGMENTS, CHESTS, SOKOBAN, PLAYER_START, REVENGE_TILE,
                     NPCS, CLUES, CHEST_LOCKS, TOTAL_FRAGS, HOUSES, HOUSE_BLOCK, SEARCH_LOOT, rollLoot,
                     getQuestion, multQ, addsubQ, chineseQ, balanceQ, numCN, CN };
}

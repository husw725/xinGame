// data.js — 地图 / 敌人 / 题库（人教版二升三）
const TILE = 32;

// 图例: T树 .草 -路 r屋顶 w墙 d门 f栅栏 k岩石 ,沙 C仙人掌
//       c宝箱 p记忆碎片 h隐藏点(需放大镜) D迷宫入口 G石门 X水晶 B魔王 1村长 2商人 3老师
// 结构：村庄(0-14) → 沙漠主廊 x10-14，左右支路藏宝(15-46) → 迷宫+石门(47-51) → 魔王(52-57)
const CH1_MAP = [
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

const BLOCK_CHARS = 'TrwdfkCXBGDWP~';   // NPC(1-9) 与 b 由代码另行标记为障碍

// 数值经 balance_sim.js 验证：等级墙成立，且堆装备无法绕过
const ENEMIES = {
  slime:  { key:'slime',  name:'九九史莱姆', tex:'slime',  hp:26, def:2, atk:6,  exp:42, gold:11, qtype:'mult' },
  imp:    { key:'imp',    name:'借位小鬼',   tex:'imp',    hp:34, def:3, atk:8,  exp:50, gold:13, qtype:'addsub' },
  wraith: { key:'wraith', name:'错别字妖精', tex:'wraith', hp:30, def:3, atk:7,  exp:48, gold:13, qtype:'chinese' },
  dummy:  { key:'dummy',  name:'训练木桩',   tex:'dummy',  hp:40, def:2, atk:0,  exp:0,  gold:0,  qtype:'mult', practice:true },
  revenge:{ key:'revenge',name:'怨念怪',     tex:'revenge',hp:36, def:3, atk:8,  exp:60, gold:16, qtype:'revenge' },
  boss:   { key:'boss',   name:'口诀骆驼王', tex:'boss',   hp:220,def:8, atk:16, exp:300,gold:150,qtype:'mult', boss:true },
  // --- 第二章 ---
  spider: { key:'spider', name:'除法蜘蛛',   tex:'spider', hp:104,def:8, atk:18, exp:64, gold:16, qtype:'divide' },
  imp2:   { key:'imp2',   name:'余数小鬼',   tex:'imp',    hp:112,def:9, atk:19, exp:70, gold:18, qtype:'remainder' },
  owl:    { key:'owl',    name:'量词猫头鹰', tex:'owl',    hp:100,def:8, atk:17, exp:62, gold:16, qtype:'liangci' },
  boss2:  { key:'boss2',  name:'分糖巨人',   tex:'boss2',  hp:320,def:19,atk:28, exp:900,gold:420,qtype:'divide', boss:true },
};

// ================= 装备（DQ 逻辑：五部位，卖价 75%） =================
const SLOTS = ['weapon', 'head', 'shield', 'boots', 'charm'];
const SLOT_NAME = { weapon:'⚔️武器', head:'🎩帽子', shield:'🛡️盾牌', boots:'👟鞋子', charm:'📿护符' };
// 每个部位看哪个属性做比较（护符没有数值，只看效果说明）
const SLOT_PROP = { weapon:'atk', head:'def', shield:'def', boots:'spd', charm:'int' };

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
  scholar_h:{ slot:'head',   name:'学士帽',   def:4,  int:6, buy:0, desc:'经验+10%，智力+6', expBonus:0.1, treasure:true },
  // 盾牌
  wood_s:   { slot:'shield', name:'木板盾',   def:2,  buy:40,  desc:'一块木板' },
  iron_s:   { slot:'shield', name:'铁皮盾',   def:4,  buy:150, desc:'铁做的，靠得住' },
  eraser_s: { slot:'shield', name:'橡皮盾',   def:6,  buy:340, desc:'答错伤害减半', softenWrong:true },
  // 鞋子
  cloth_b:  { slot:'boots',  name:'布鞋',     spd:0,  buy:0,   desc:'普通的鞋' },
  straw_b:  { slot:'boots',  name:'草鞋',     spd:2,  buy:35,  desc:'走得快一点' },
  wind_b:   { slot:'boots',  name:'疾风靴',   spd:5,  buy:180, desc:'走得飞快' },
  // 护符
  abacus:   { slot:'charm',  name:'铜算盘',   int:2,  buy:100, desc:'金币+20%，智力+2', goldBonus:0.2 },
  dict:     { slot:'charm',  name:'字典护符', int:8,  buy:160, desc:'语文题伤害+30%，智力+8', boost:'chinese' },
  necklace: { slot:'charm',  name:'九九项链', int:10, buy:0,   desc:'数学题伤害+30%，智力+10', boost:'math', treasure:true },
  // --- 第二章新增 ---
  tri_sword:{ slot:'weapon', name:'三角尺剑', atk:7,  buy:200, desc:'三个角都很锋利' },
  abacus_s: { slot:'shield', name:'算盘盾',   def:5,  buy:260, desc:'珠子噼啪响，挡得住' },
  divider:  { slot:'charm',  name:'分糖锦囊', int:6,  buy:240, desc:'答对回2点MP，智力+6', mpBonus:2 },
  hookband: { slot:'charm',  name:'钩爪腕带', int:4,  buy:0,   desc:'金币+35%，智力+4', goldBonus:0.35, treasure:true },
};

// 第1章商店卖什么（宝箱专属的不卖）
const CH1_SHOP = ['crayon','pen','cloth_h','leather_h','wood_s','iron_s','straw_b','wind_b','abacus','dict'];

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

const CH1_SPAWNS = [
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
const CH1_REVENGE = { x:14, y:15 };
const CH1_START = { x:12, y:12 };

// ================= 记忆碎片（一本日记，全七章共 56 页） =================
// 第一章只放第 1–8 页：建立同情，不给任何身份线索。
// 许愿（第41-48页）和"陪我再学一次"（第56页）分别在第6章和终章 —— 提前给出会毁掉整条暗线。
const TOTAL_FRAGS = 56;
const CH1_FRAGS = [
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
const CH1_NPCS = {
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
const CH1_CLUES = {
  code1:  { lock:'chest3', from:'铁匠老王',   ask:'口令第一个数？二三得几，你自己算。',
            answer:6,  note:'口令第1个数 = 二三得几' },
  code2:  { lock:'chest3', from:'卖水的婶婶', ask:'第二个数嘛……二的四倍。哎哟我这记性。',
            answer:8,  note:'口令第2个数 = 二的四倍' },
  code3:  { lock:'chest3', from:'朵朵',       ask:'谢谢你！第三个数是——五五二十五里的那个五！',
            answer:5,  note:'口令第3个数 = 五五二十五里的五' },
  bridge: { lock:'lore',   from:'沙漠旅人',   ask:'沙子里藏了东西，但现在你看不到。\n要先有一件能放大的宝物。',
            answer:null, note:'沙漠藏有东西（先拿到放大镜再回来）' },
};

// ================= 宝箱锁 =================
// 原则：短(10-30秒)、杂(不重复)、无惩罚(随便重来)。锁的类型显示在箱子上，孩子才有预期。
// kind: calc算式锁 / balance天平锁 / code口令锁(需线索)
const CH1_LOCKS = [
  { kind:'calc',    icon:'🔢', hint:'箱盖上刻着一道题' },
  { kind:'balance', icon:'⚖️', hint:'箱盖上是一架天平，要找出相等的那个' },
  { kind:'code',    icon:'🔒', hint:'三个数字轮盘。\n村里有人知道口令。', clues:['code1','code2','code3'] },
];

// ================= 室内 =================
// 图例: W墙 F地板 D出口(门) N屋主 u柜子 t桌子 p盆栽 B床
// 村里三栋房子，门口的 NPC 改成住在里面。柜子可以翻，翻到什么是随机的。
const CH1_HOUSES = {
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
const CH1_CHESTS = [
  { kind:'gear',  key:'leather_h', msg:'找到了【皮帽】！' },
  { kind:'frag',  idx:4,           msg:'箱子里是一页发黄的纸……' },
  { kind:'gear',  key:'scholar_h', msg:'找到了传说中的【学士帽】！\n（商店买不到，经验+10%）' },
];

// ================= 推箱子迷宫（口诀箱） =================
// 把写着正确得数的箱子推到对应口诀的凹槽上。'#'墙 '.'地面
const CH1_SOKOBAN = [
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

// ---- 第二章题型：表内除法 / 有余数的除法 / 量词 ----
function divideQ() {
  const b = irnd(2, 9), q = irnd(2, 9), a = b * q;
  const m = Math.min(b, q), M = Math.max(b, q);
  return { text: `${a} ÷ ${b} = ?`, options: numOptions(q), answer: String(q),
           tip: `想口诀：${CN[m]}${CN[M]}${a < 10 ? '得' + CN[a] : numCN(a)}，所以 ${a}÷${b}=${q}` };
}

function remainderQ() {
  const b = irnd(3, 9);
  const q = irnd(2, 8);
  const r = irnd(1, b - 1);          // 余数一定小于除数
  const a = b * q + r;
  return { text: `${a} ÷ ${b} = ${q} …… ?\n（余数是几？）`, options: numOptions(r), answer: String(r),
           tip: `${b}×${q}=${b*q}，${a}−${b*q}=${r}。余数一定比除数 ${b} 小` };
}

function liangciQ() {
  const item = LIANG[irnd(0, LIANG.length - 1)];
  return { text: item.t, options: shuffle([item.a, ...item.d]), answer: item.a,
           tip: `应该说「${item.t.replace('（　）', item.a)}」` };
}

function getQuestion(type) {
  if (type === 'balance')   return balanceQ();
  if (type === 'divide')    return divideQ();
  if (type === 'remainder') return remainderQ();
  if (type === 'liangci')   return liangciQ();
  if (type === 'mixed2')    return [divideQ, remainderQ, liangciQ][irnd(0, 2)]();
  if (type === 'mixed') type = ['mult', 'addsub', 'chinese'][irnd(0, 2)];
  if (type === 'mult') return multQ();
  if (type === 'addsub') return addsubQ();
  return chineseQ();
}




// ============================================================
// 第二章 · 除法回廊
// 数学：表内除法、有余数的除法（二下核心）  语文：量词
// ============================================================

// 回廊行生成器：保证每行恰好 25 格，手写 58 行太容易错
function _row(feats) {
  const r = Array(25).fill('s');
  r[0] = r[24] = 'W'; r[9] = r[15] = 'W';      // 外墙 + 主廊两侧
  for (const k in feats) r[+k] = feats[k];
  return r.join('');
}
const _seal = 'W'.repeat(10) + 'sssss' + 'W'.repeat(10);
const _open = 'W' + 's'.repeat(23) + 'W';

// 环形回廊：外圈走廊绕一整圈，中间是天井（水晶和巨人在里面，一进门就看得见但进不去）。
// 四角各有一间侧厅。和第一章的"一条主路走到底"是两种完全不同的空间。
function _ch2map() {
  const W = 25, H = 58, g = Array.from({ length: H }, () => Array(W).fill('W'));
  const put = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
  const fill = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c); };

  // --- 上方小镇 ---
  fill(1, 1, 23, 12, 's');
  fill(2, 2, 4, 4, 'r'); fill(2, 3, 4, 4, 'w'); put(3, 4, 'd');       // 左屋
  fill(19, 2, 21, 4, 'r'); fill(19, 3, 21, 4, 'w'); put(20, 4, 'd');  // 右屋
  fill(2, 7, 4, 9, 'r'); fill(2, 8, 4, 9, 'w'); put(3, 9, 'd');       // 学堂
  [[8, 5], [16, 5], [10, 10], [16, 10]].forEach(([x, y]) => put(x, y, 'P'));
  put(4, 6, '4'); put(18, 6, '5'); put(4, 10, '6'); put(20, 10, '7'); put(4, 12, '8');

  // --- 进廊通道 ---
  fill(11, 13, 13, 16, 's');

  // --- 环形走廊（3 格宽，绕天井一圈）---
  fill(4, 17, 20, 19, 's');   // 上
  fill(4, 45, 20, 47, 's');   // 下
  fill(4, 17, 6, 47, 's');    // 左
  fill(18, 17, 20, 47, 's');  // 右

  // --- 天井（外墙 + 里面的空地）---
  fill(8, 21, 16, 43, 's');   // 天井内部
  put(12, 20, 'G');           // 天井north墙上的石门
  put(12, 30, 'X'); put(12, 32, 'B');

  // --- 四角侧厅（挖进外墙）---
  const hall = (x1, y1, x2, y2, doorX, doorY) => { fill(x1, y1, x2, y2, 's'); put(doorX, doorY, 's'); };
  hall(1, 20, 2, 25, 3, 22);    // 西上厅
  hall(22, 20, 23, 25, 21, 22); // 东上厅
  hall(1, 39, 2, 44, 3, 42);    // 西下厅
  hall(22, 39, 23, 44, 21, 42); // 东下厅

  // --- 内容 ---
  put(1, 22, 'p'); put(2, 25, 'h');    // 西上厅：碎片 + 隐藏
  put(22, 22, 'c'); put(23, 25, 'h');  // 东上厅：宝箱 + 隐藏
  put(1, 44, 'c'); put(2, 39, 'h');    // 西下厅：宝箱 + 隐藏（钩爪）
  put(22, 44, 'p'); put(23, 39, 'h');  // 东下厅：碎片 + 隐藏
  put(5, 32, 'c');                     // 左廊：第三个宝箱
  put(19, 30, '9');                    // 右廊：货郎
  put(12, 46, 'D');                    // 下廊：分糖石室入口

  return g.map(r => r.join(''));
}
const CH2_MAP = _ch2map();

const CH2_START   = { x:12, y:11 };
const CH2_REVENGE = { x:12, y:15 };

const CH2_SPAWNS = [
  { k:'spider', x:12, y:18 },   // 上廊
  { k:'spider', x:7,  y:18 },
  { k:'owl',    x:17, y:18 },
  { k:'spider', x:5,  y:24 },   // 左廊
  { k:'imp2',   x:5,  y:36 },
  { k:'owl',    x:5,  y:42 },
  { k:'imp2',   x:19, y:24 },   // 右廊
  { k:'spider', x:19, y:38 },
  { k:'owl',    x:19, y:44 },
  { k:'imp2',   x:8,  y:46 },   // 下廊
  { k:'spider', x:16, y:46 },
  { k:'imp2',   x:14, y:46 },
];

// 日记第 9–16 页：越来越孤立（不给身份线索）
const CH2_FRAGS = [
  { where:'左支路',   text:'第九页：\n「今天装病。\n娘摸我的头，说没发烧啊。」' },
  { where:'右支路',   text:'第十页：\n「我数着回廊的回声，\n一二三……数到七就乱了。」' },
  { where:'石室第一间', text:'第十一页：\n「同桌换了人。\n新来的那个，什么都会。」' },
  { where:'石室第三间', text:'第十二页：\n「先生让我们两个一起算。\n他算完了，我还在第一步。」' },
  { where:'宝箱里',   text:'第十三页：\n「他没笑我。\n可他也没等我。」' },
  { where:'隐藏处',   text:'第十四页：\n「我宁可他笑我。」' },
  { where:'隐藏处',   text:'第十五页：\n「我把算错的纸都扔进回廊了。\n风把它们吹回来。」' },
  { where:'隐藏处',   text:'第十六页：\n「扔不掉的。」' },
];

const CH2_NPCS = {
  '1': { name:'账房总管', tex:'npc_elder',    role:'elder' },
  '2': { name:'商人',     tex:'npc_merchant', role:'shop' },
  '3': { name:'老师',     tex:'npc_teacher',  role:'teacher' },
  '4': { name:'账房先生', tex:'npc_smith',    role:'clue', clue:'c2a' },
  '5': { name:'卖糖的姐姐',tex:'npc_aunt',    role:'clue', clue:'c2b' },
  '6': { name:'小满',     tex:'npc_girl',     role:'quest' },
  '7': { name:'扫地的老人',tex:'npc_grandpa', role:'lore' },
  '8': { name:'阿力',     tex:'npc_boy',      role:'chat' },
  '9': { name:'迷路的货郎',tex:'npc_traveler', role:'clue', clue:'c2c' },
};

// 推理型线索：三个人各说一句，只有一个说真话。
// 候选 3/6/9 —— 只有"口令是6"能让恰好一人说真话（对应人教版二下·数学广角·推理）
// 推理型线索：三个人各说一句，只有一个说真话。
// 候选 3/6/9 —— 只有"口令是6"能让恰好一人说真话（对应人教版二下·数学广角·推理）
const CH2_CLUES = {
  c2a: { lock:'riddle', from:'账房先生',   ask:'我说：口令是 3。',
         note:'账房先生说「口令是 3」' },
  c2b: { lock:'riddle', from:'卖糖的姐姐', ask:'我说：口令不是 6。',
         note:'卖糖的姐姐说「口令不是 6」' },
  c2c: { lock:'riddle', from:'迷路的货郎', ask:'我说：口令不是 3。\n……不过我们三个里，\n只有一个人说了真话。',
         note:'货郎说「口令不是 3」；三人中只有一人说真话' },
  c2d: { lock:'lore',   from:'扫地的老人', ask:'墙缝里卡着东西。\n手伸不进去，得有带钩子的家伙。',
         note:'墙缝藏有东西（先拿到钩爪再回来）' },
};

// 推理锁：候选与答案，答案由"恰好一人说真话"推出
const CH2_RIDDLE = {
  candidates: [3, 6, 9],
  answer: 6,
  explain: '如果口令是 3：账房先生说对了、姐姐也说对了 —— 两个人说真话，不行。\n' +
           '如果是 9：姐姐和货郎都说对了 —— 还是两个，不行。\n' +
           '如果是 6：只有货郎说对了 —— 正好一个人！',
};


const CH2_LOCKS = [
  { kind:'calc',    icon:'🔢', hint:'箱盖上刻着一道除法题' },
  { kind:'balance', icon:'⚖️', hint:'箱盖上是一架天平，要找出相等的那个' },
  { kind:'riddle',  icon:'🧩', hint:'箱盖上刻着：\n「三个人只有一个说真话。」\n镇上问齐三句话再来。', clues:['c2a','c2b','c2c'] },
];

const CH2_CHESTS = [
  { kind:'gear', key:'iron_h',   msg:'找到了【铁头盔】！' },
  { kind:'frag', idx:4,          msg:'箱子里是一页发黄的纸……' },
  { kind:'gear', key:'necklace', msg:'找到了传说中的【九九项链】！\n（商店买不到，数学题伤害+30%）' },
];

const CH2_HOUSES = {
  '3,4':  { name:'账房', owner:'1', rows:[
    "WWWWWWWWW",
    "WuuuFuuuW",
    "WFFFFFFFW",
    "WtFFNFFtW",
    "WFFFFFFFW",
    "WuFFFFFuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '20,4': { name:'货栈', owner:'2', rows:[
    "WWWWWWWWW",
    "WuFuFuFuW",
    "WFFFFFFFW",
    "WuFFNFFuW",
    "WFFFFFFFW",
    "WtFFFFFtW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '3,9':  { name:'回廊学堂', owner:'3', rows:[
    "WWWWWWWWW",
    "WFFtttFFW",
    "WFtFFFtFW",
    "WFtFNFtFW",
    "WFtFFFtFW",
    "WuFtFtFuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
};


const CH2_SHOP = ['tri_sword','compass','iron_h','abacus_s','eraser_s','wind_b','dict','divider'];

// ---- 分糖机关（第2章招牌谜题）----
// 把 N 颗糖平均分到 M 个盘子里，分不完的留在中间当余数
const CH2_CANDY = [
  { name:'第一间 · 分给三个人', total:12, plates:3, hint:'一颗一颗放，每盘要一样多。12 颗分 3 盘。',
    reward:{ kind:'frag', idx:2 } },
  { name:'第二间 · 分不完怎么办', total:14, plates:4, hint:'14 颗分 4 盘，每盘 3 颗，剩下的 2 颗放不进去 —— 那就是余数。',
    reward:{ kind:'gold', val:260 } },
  { name:'第三间 · 想清楚再放', total:23, plates:5, hint:'先想每盘能放几颗，再想会剩几颗。23 ÷ 5 = 4 …… 3',
    reward:{ kind:'frag', idx:3 } },
];

// ============================================================
// 章节表：game.js 通过 loadChapter() 切换，其余代码无需改动
// ============================================================
const CHAPTERS = [
  { n:1, name:'乘法口诀沙漠', recLv:6,  tool:'lens', toolName:'🔍放大镜', boss:'boss',
    map:CH1_MAP, start:CH1_START, revenge:CH1_REVENGE, spawns:CH1_SPAWNS,
    frags:CH1_FRAGS, npcs:CH1_NPCS, clues:CH1_CLUES, locks:CH1_LOCKS,
    chests:CH1_CHESTS, houses:CH1_HOUSES, shop:CH1_SHOP,
    puzzle:{ kind:'sokoban', rooms:CH1_SOKOBAN },
    bossTile:{ x:12, y:55 }, crystalTile:{ x:12, y:54 },
    hiddenBase:5, hiddenTool:'lens', hiddenToolName:'放大镜' },
  { n:2, name:'除法回廊', recLv:11, tool:'hook', toolName:'🪝词语钩爪', boss:'boss2',
    map:CH2_MAP, start:CH2_START, revenge:CH2_REVENGE, spawns:CH2_SPAWNS,
    frags:CH2_FRAGS, npcs:CH2_NPCS, clues:CH2_CLUES, locks:CH2_LOCKS,
    chests:CH2_CHESTS, houses:CH2_HOUSES, shop:CH2_SHOP,
    puzzle:{ kind:'candy', rooms:CH2_CANDY },
    bossTile:{ x:12, y:32 }, crystalTile:{ x:12, y:30 },
    hiddenBase:5, hiddenTool:'hook', hiddenToolName:'词语钩爪' },
];

// 当前章节的数据（game.js 直接用这些名字）
let MAP, MAPW, MAPH, SPAWNS, PLAYER_START, REVENGE_TILE, FRAGMENTS,
    NPCS, CLUES, CHEST_LOCKS, CHESTS, HOUSES, SHOP_GEAR, SOKOBAN, CHAPTER;

function loadChapter(i) {
  const c = CHAPTERS[Math.min(i, CHAPTERS.length - 1)];
  CHAPTER = c;
  MAP = c.map; MAPH = c.map.length; MAPW = c.map[0].length;
  SPAWNS = c.spawns; PLAYER_START = c.start; REVENGE_TILE = c.revenge;
  FRAGMENTS = c.frags; NPCS = c.npcs; CLUES = c.clues; CHEST_LOCKS = c.locks;
  CHESTS = c.chests; HOUSES = c.houses; SHOP_GEAR = c.shop;
  SOKOBAN = c.puzzle.rooms;
  return c;
}
// 碎片是全局编号（第c章第i页 = c*8+i），日记要跨章累积才拼得出真相
function fragGlobal(chapterIdx, local) { return chapterIdx * 8 + local; }
function fragText(g) {
  const c = CHAPTERS[Math.floor(g / 8)];
  return c ? c.frags[g % 8] : null;
}
function fragsOfChapter(chapterIdx, list) {
  const lo = chapterIdx * 8, hi = lo + 8;
  return list.filter(g => g >= lo && g < hi);
}

loadChapter(0);

if (typeof module !== 'undefined') {
  module.exports = { MAP, MAPW, MAPH, ENEMIES, SPAWNS, GEAR, SLOTS, SHOP_GEAR, SPELLS, spellsAt,
                     FRAGMENTS, CHESTS, SOKOBAN, PLAYER_START, REVENGE_TILE,
                     NPCS, CLUES, CHEST_LOCKS, TOTAL_FRAGS, HOUSES, HOUSE_BLOCK, SEARCH_LOOT, rollLoot,
                     CHAPTERS, loadChapter, CH2_CANDY, CH2_RIDDLE, fragGlobal, fragText, fragsOfChapter,
                     getQuestion, multQ, addsubQ, chineseQ, balanceQ, divideQ, remainderQ, liangciQ, numCN, CN };
}

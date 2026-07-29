// data.js — 地图 / 敌人 / 题库（人教版二升三）
const TILE = 32;

// 图例: T树 .草 -路 r屋顶 w墙 d门 f栅栏 k岩石 ,沙 C仙人掌
//       c宝箱 p记忆碎片 h隐藏点(需工具) D机关入口 G石门 X水晶 B魔王 O传送阵 1村长 2商人 3老师
//       g钟楼木地板 v楼梯 M矿洞岩壁 n矿洞地面
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
  "T....H......-.......6...T", // 11 朵朵 / x5=抱课本的妹妹
  "T....T..JO..-......T....T", // 12 x9=传送阵 x8=圆盘旁的奶奶
  "T......7....-.E..8......T", // 13 老爷爷 / 石头 / x13=巡逻的大哥
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

const BLOCK_CHARS = 'TrwdfkCXBGDWPML~';   // NPC 与 b 由代码另行标记为障碍。M=矿洞岩壁 L=长廊砖墙

// 数值经 balance_sim.js 验证：等级墙成立，且堆装备无法绕过
const ENEMIES = {
  slime:  { key:'slime',  name:'九九史莱姆', tex:'slime',  hp:26, def:2, atk:6,  exp:42, gold:11, qtype:'mult' },
  imp:    { key:'imp',    name:'借位小鬼',   tex:'imp',    hp:34, def:3, atk:8,  exp:50, gold:13, qtype:'addsub' },
  wraith: { key:'wraith', name:'错别字妖精', tex:'wraith', hp:30, def:3, atk:7,  exp:48, gold:13, qtype:'chinese' },
  dummy:  { key:'dummy',  name:'训练木桩',   tex:'dummy',  hp:40, def:2, atk:0,  exp:0,  gold:0,  qtype:'mult', practice:true },
  revenge:{ key:'revenge',name:'怨念怪',     tex:'revenge',hp:36, def:3, atk:8,  exp:60, gold:16, qtype:'revenge' },
  boss:   { key:'boss',   name:'口诀骆驼王', tex:'boss',   hp:220,def:8, atk:16, exp:300,gold:150,qtype:'mixed1b', boss:true },
  // --- 第二章 ---
  spider: { key:'spider', name:'除法蜘蛛',   tex:'spider', hp:104,def:8, atk:18, exp:64, gold:16, qtype:'divide' },
  imp2:   { key:'imp2',   name:'余数小鬼',   tex:'imp',    hp:112,def:9, atk:19, exp:70, gold:18, qtype:'remainder' },
  owl:    { key:'owl',    name:'量词猫头鹰', tex:'owl',    hp:100,def:8, atk:17, exp:62, gold:16, qtype:'liangci' },
  boss2:  { key:'boss2',  name:'分糖巨人',   tex:'boss2',  hp:320,def:19,atk:28, exp:900,gold:420,qtype:'mixed2b', boss:true },
  // --- 第三章（数值取自 curve_sim：达标 Lv16 时 我攻49/我防17/我HP150）---
  // 小怪 4 刀砍死、挨 15 下才倒，和前两章手感一致
  cog:    { key:'cog',    name:'齿轮蜘蛛',   tex:'cog',    hp:150,def:12,atk:26, exp:98, gold:24, qtype:'timeunit' },
  bell:   { key:'bell',   name:'走时铜铃',   tex:'bell',   hp:158,def:13,atk:27, exp:104,gold:26, qtype:'timeafter' },
  sand:   { key:'sand',   name:'沙漏懒虫',   tex:'sandw',  hp:146,def:11,atk:28, exp:100,gold:25, qtype:'timespan' },
  flip:   { key:'flip',   name:'颠倒摆',     tex:'flip',   hp:152,def:12,atk:27, exp:102,gold:25, qtype:'antonym' },
  boss3:  { key:'boss3',  name:'时针幽灵',   tex:'boss3',  hp:320,def:34,atk:40, exp:1900,gold:760,qtype:'mixed3b', boss:true },
  // --- 第四章（curve_sim ch4：达标 Lv21 我攻64/我防23/我HP190）---
  ore:    { key:'ore',    name:'矿石傀',     tex:'ore',    hp:196,def:17,atk:35, exp:134,gold:33, qtype:'massunit' },
  cart:   { key:'cart',   name:'矿车鬼',     tex:'cart',   hp:204,def:18,atk:36, exp:140,gold:35, qtype:'masssum' },
  bat:    { key:'bat',    name:'秤砣蝠',     tex:'bat',    hp:190,def:16,atk:37, exp:136,gold:34, qtype:'masspick' },
  echo:   { key:'echo',   name:'回声蝠',     tex:'echo',   hp:198,def:17,atk:36, exp:138,gold:34, qtype:'duoyin' },
  boss4:  { key:'boss4',  name:'称重河马',   tex:'boss4',  hp:320,def:49,atk:52, exp:3200,gold:1200,qtype:'mixed4b', boss:true },
  // --- 第五章（curve_sim ch5：达标 Lv26 我攻79/我防29/我HP230）---
  tape:   { key:'tape',   name:'卷尺虫',     tex:'tape',   hp:242,def:21,atk:44, exp:170,gold:45, qtype:'lenunit' },
  rod:    { key:'rod',    name:'标杆兵',     tex:'rod',    hp:250,def:22,atk:45, exp:176,gold:47, qtype:'lencmp' },
  coil:   { key:'coil',   name:'皮尺蛇',     tex:'coil',   hp:236,def:20,atk:46, exp:172,gold:46, qtype:'lenpick' },
  twin:   { key:'twin',   name:'双生字',     tex:'twin',   hp:244,def:21,atk:45, exp:174,gold:46, qtype:'xingjin' },
  boss5:  { key:'boss5',  name:'量尺蛇',     tex:'boss5',  hp:320,def:64,atk:64, exp:5200,gold:1800,qtype:'mixed5b', boss:true },
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
  // --- 第三章新增（Lv16 前后买得起）---
  clock_sw: { slot:'weapon', name:'钟摆锤',   atk:11, buy:420, desc:'一下一下，砸得很稳' },
  gear_h:   { slot:'head',   name:'齿轮盔',   def:7,  buy:380, desc:'转起来会咔咔响' },
  glass_s:  { slot:'shield', name:'钟面盾',   def:8,  buy:460, desc:'表盘做的盾，看得见时间' },
  swift_b:  { slot:'boots',  name:'秒针靴',   spd:8,  buy:400, desc:'走得比秒针还快' },
  hourgl:   { slot:'charm',  name:'沙漏护符', int:9,  buy:520, desc:'限时题时间+50%，智力+9', slowQ:0.5 },
  pocketw:  { slot:'charm',  name:'时之怀表', int:14, buy:0,   desc:'答题倒计时+1秒，智力+14', bonusMs:1000, treasure:true },
  // --- 第四章新增（Lv21 前后买得起）---
  pick_sw:  { slot:'weapon', name:'矿工镐',   atk:15, buy:700, desc:'一镐下去，石头都裂' },
  ore_h:    { slot:'head',   name:'矿石盔',   def:9,  buy:0,   desc:'整块矿石凿出来的', treasure:true },
  plate_s:  { slot:'shield', name:'秤盘盾',   def:11, buy:780, desc:'铜秤盘，又厚又沉' },
  gramch:   { slot:'charm',  name:'克重香囊', int:11, buy:820, desc:'答错伤害再减10%，智力+11', softenWrong:true },
  weightc:  { slot:'charm',  name:'砝码护符', int:16, buy:0,   desc:'答对回3点MP，智力+16', mpBonus:3, treasure:true },
  // --- 第五章新增（Lv26 前后买得起）---
  tape_sw:  { slot:'weapon', name:'卷尺鞭',   atk:19, buy:1100, desc:'甩出去能抽到很远' },
  ruler_h:  { slot:'head',   name:'量角盔',   def:12, buy:960,  desc:'顶上带个半圆的刻度' },
  ruler_s:  { slot:'shield', name:'尺盾',     def:14, buy:0,    desc:'一整块刻度板', treasure:true },
  cmcharm:  { slot:'charm',  name:'厘米绳',   int:13, buy:1150, desc:'限时题时间+50%，智力+13', slowQ:0.5 },
  longruler:{ slot:'boots',  name:'伸缩尺',   spd:12, buy:0,    desc:'一步能跨很远', treasure:true },
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
  // 下面三位分担了原来开场一口气讲完的东西：怎么打、纸片哪儿看、圆盘怎么用。
  // role:'info' 就是"台词写在数据里"，不用为每个人写一段代码。
  'E': { name:'巡逻的大哥', tex:'npc_guard', role:'info',
    lines: ['村口外面就是沙漠了，怪物到处跑。',
            '碰上就得打。答对一道题，\n就是砍它一刀。',
            '连着答对三道会打出暴击，\n伤害翻倍！',
            '打不过别硬撑。回来多练几级，\n等级差一点，伤害差很多。'],
    lines2: ['骆驼王都被你打倒了，\n还用我教你打架？'] },
  'H': { name:'抱课本的妹妹', tex:'npc_kid', role:'info',
    lines: ['哥哥你看，我的课本……',
            '（她翻开书，纸上的字正在一个个变淡。）',
            '字被魔王偷走了。\n我背过的都想不起来了。',
            '路上要是捡到发黄的纸片，\n那是有人写的日记。',
            '按 B 打开菜单，\n在【冒险手册】里能翻。'],
    lines2: ['我的课本上，字回来了一点点！\n哥哥你再多找几页好不好？'] },
  'J': { name:'圆盘旁的奶奶', tex:'npc_granny', role:'info',
    lines: ['我旁边这个大圆盘，是老早的传送盘。',
            '它现在是暗的。\n打败这一章的魔王，它就会亮。',
            '亮了以后踩上去，\n想去哪一章都行，还能回来。',
            '你的等级和装备都跟着走，\n不会白练。'],
    lines2: ['圆盘亮了吧？踩上去试试。',
             '哪一章没找完的纸片，\n随时回去补，不着急。'] },
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

// 语文题库的统一出口，subj 在这里打上 —— 混合题型（Boss）才分得清学科
function bankQ(item) {
  return { subj:'chinese', text: item.t, options: shuffle([item.a, ...item.d]), answer: item.a,
           tip: item.tip || `正确答案是"${item.a}"` };
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

// ---- 第3章：时、分、秒（人教版三上）----
const hhmm = m => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
// 时刻型选项：干扰项都是"孩子真会犯的错"——差 10 分、多算一小时、时分弄反
function timeOptions(mins) {
  const set = new Set([hhmm(mins)]);
  const cands = shuffle([mins + 10, mins - 10, mins + 60, mins - 60, mins + 5, mins - 5, mins + 30]);
  for (const v of cands) { if (set.size >= 4) break; if (v > 0 && v < 24 * 60) set.add(hhmm(v)); }
  return shuffle([...set]);
}

function timeUnitQ() {
  const kind = irnd(0, 3);
  if (kind === 0) { const h = irnd(2, 9); return { text: `${h} 时 = ? 分`, options: numOptions(h * 60), answer: String(h * 60), tip: `1 时 = 60 分，所以 ${h} 时 = 60×${h} = ${h * 60} 分` }; }
  if (kind === 1) { const m = irnd(2, 9); return { text: `${m} 分 = ? 秒`, options: numOptions(m * 60), answer: String(m * 60), tip: `1 分 = 60 秒，所以 ${m} 分 = 60×${m} = ${m * 60} 秒` }; }
  if (kind === 2) { const m = irnd(2, 9); return { text: `${m * 60} 秒 = ? 分`, options: numOptions(m), answer: String(m), tip: `60 秒是 1 分，${m * 60} 里有 ${m} 个 60，所以是 ${m} 分` }; }
  const h = irnd(2, 6); return { text: `${h * 60} 分 = ? 时`, options: numOptions(h), answer: String(h), tip: `60 分是 1 时，${h * 60} 里有 ${h} 个 60，所以是 ${h} 时` };
}

// 现在几点，再过多久是几点（会跨小时，这正是要练的地方）
function timeAfterQ() {
  const start = irnd(6, 20) * 60 + irnd(0, 11) * 5;
  const add = [15, 20, 25, 30, 40, 45, 50][irnd(0, 6)];
  const end = start + add;
  const carry = Math.floor(end / 60) > Math.floor(start / 60);
  return {
    text: `现在 ${hhmm(start)}，\n再过 ${add} 分钟是几点？`,
    options: timeOptions(end), answer: hhmm(end),
    tip: carry
      ? `${start % 60} 分 + ${add} 分 = ${start % 60 + add} 分，超过 60 了，\n进 1 时：${hhmm(end)}`
      : `分针从 ${start % 60} 走到 ${start % 60 + add}，时针没过整点，\n所以是 ${hhmm(end)}`,
  };
}

// 两个时刻之间过了多少分钟
function timeSpanQ() {
  const start = irnd(6, 19) * 60 + irnd(0, 11) * 5;
  const span = [15, 20, 25, 35, 40, 45, 50, 55][irnd(0, 7)];
  const end = start + span;
  return {
    text: `${hhmm(start)} 出发，${hhmm(end)} 到，\n一共用了多少分钟？`,
    options: numOptions(span), answer: String(span),
    tip: Math.floor(end / 60) > Math.floor(start / 60)
      ? `先走到整点 ${Math.floor(end / 60)}:00 用了 ${60 - start % 60} 分，\n再走 ${end % 60} 分，一共 ${span} 分`
      : `同一个小时里，${end % 60} − ${start % 60} = ${span} 分`,
  };
}

// ---- 语文题（跨章复用）----
// 每一章都要有语文怪。第3章一度三个怪全是数学题，标题写着"数学+语文"
// 却连着好几章一个语文都没有 —— subject_check.js 现在守着这条。

// 反义词（人教版三上）：和"时间"主题也搭（早↔晚、快↔慢）
const ANTONYM = [
  ['早','晚'], ['快','慢'], ['长','短'], ['前','后'], ['多','少'],
  ['轻','重'], ['大','小'], ['冷','热'], ['高','低'], ['宽','窄'],
  ['深','浅'], ['粗','细'], ['明','暗'], ['忙','闲'], ['软','硬'],
];
function antonymQ() {
  const pool = ANTONYM;
  const p = pool[irnd(0, pool.length - 1)];
  const flip = irnd(0, 1);
  const q = flip ? p[1] : p[0], a = flip ? p[0] : p[1];
  const others = pool.flat().filter(c => c !== q && c !== a);
  const opts = shuffle([a, ...shuffle(others).slice(0, 3)]);
  return { subj:'chinese', text: `「${q}」的反义词是哪个？`, options: opts, answer: a,
           tip: `${q} ↔ ${a}。\n意思正好相反的两个字，就是反义词。` };
}

// 多音字（人教版三上）：一个字两个读音，配着句子选
const DUOYIN = [
  { c:'重', a:{ y:'zhòng', s:'这个箱子很重' }, b:{ y:'chóng', s:'重新写一遍' } },
  { c:'长', a:{ y:'cháng', s:'这条路很长' },   b:{ y:'zhǎng', s:'他长高了' } },
  { c:'行', a:{ y:'xíng', s:'一行人走过来' },  b:{ y:'háng', s:'写了三行字' } },
  { c:'空', a:{ y:'kōng', s:'天空很蓝' },      b:{ y:'kòng', s:'留一个空格' } },
  { c:'发', a:{ y:'fā', s:'发出声音' },        b:{ y:'fà', s:'头发很黑' } },
  { c:'转', a:{ y:'zhuàn', s:'轮子在转' },     b:{ y:'zhuǎn', s:'向左转弯' } },
  { c:'着', a:{ y:'zhe', s:'他笑着说' },       b:{ y:'zháo', s:'着火了' } },
  { c:'量', a:{ y:'liàng', s:'重量是多少' },   b:{ y:'liáng', s:'量一量有多长' } },
];
function duoyinQ() {
  const d = DUOYIN[irnd(0, DUOYIN.length - 1)];
  const pickA = irnd(0, 1);
  const use = pickA ? d.a : d.b, other = pickA ? d.b : d.a;
  const fakes = DUOYIN.filter(x => x !== d).flatMap(x => [x.a.y, x.b.y]);
  const opts = shuffle([use.y, other.y, ...shuffle(fakes).slice(0, 2)]);
  return { subj:'chinese', text: `「${use.s}」\n里的「${d.c}」读什么？`, options: opts, answer: use.y,
           tip: `${use.s} → ${d.c} 读 ${use.y}。\n（${other.s} 里读 ${other.y}）` };
}

// ---- 第5章：米与厘米（人教版三上）----
// 换算 1米=100厘米、1分米=10厘米
function lenUnitQ() {
  const kind = irnd(0, 3);
  if (kind === 0) { const m = irnd(2, 9); return { text: `${m} 米 = ? 厘米`, options: numOptions(m * 100), answer: String(m * 100), tip: `1 米 = 100 厘米，所以 ${m} 米 = 100×${m} = ${m * 100} 厘米` }; }
  if (kind === 1) { const m = irnd(2, 9); return { text: `${m * 100} 厘米 = ? 米`, options: numOptions(m), answer: String(m), tip: `100 厘米是 1 米，${m * 100} 里有 ${m} 个 100，所以是 ${m} 米` }; }
  if (kind === 2) { const d = irnd(2, 9); return { text: `${d} 分米 = ? 厘米`, options: numOptions(d * 10), answer: String(d * 10), tip: `1 分米 = 10 厘米，所以 ${d} 分米 = ${d * 10} 厘米` }; }
  const m = irnd(1, 8), c = irnd(1, 9) * 10;
  return { text: `${m} 米 ${c} 厘米 = ? 厘米`, options: numOptions(m * 100 + c), answer: String(m * 100 + c),
           tip: `${m} 米 = ${m * 100} 厘米，再加 ${c} 厘米 = ${m * 100 + c} 厘米` };
}

const LEN_THINGS = [
  { n:'一支铅笔', u:'厘米' }, { n:'一本书的宽', u:'厘米' }, { n:'一块橡皮', u:'厘米' },
  { n:'你的手掌', u:'厘米' }, { n:'一枚硬币', u:'厘米' },
  { n:'教室的长', u:'米' }, { n:'一棵大树的高', u:'米' }, { n:'操场跑道', u:'米' },
  { n:'一辆公交车', u:'米' }, { n:'旗杆的高', u:'米' },
];
function lenPickQ() {
  const t = LEN_THINGS[irnd(0, LEN_THINGS.length - 1)];
  return { text: `${t.n}\n有多长？用哪个单位合适？`, options: shuffle(['厘米', '米', '千克', '分钟']), answer: t.u,
           tip: t.u === '厘米' ? `${t.n}比较短，用【厘米】。` : `${t.n}比较长，用【米】。\n1 米 = 100 厘米。` };
}

// 单位不同的两段谁更长 —— 必须先换算成同一个单位，这是本章的核心
function lenCmpQ() {
  const a = irnd(1, 3) * 100 + irnd(0, 9) * 10;      // 厘米
  let b = irnd(1, 3) * 100 + irnd(0, 9) * 10;
  while (b === a) b = irnd(1, 3) * 100 + irnd(0, 9) * 10;
  const show = c => (irnd(0, 1) && c % 100 === 0) ? `${c / 100} 米` : `${c} 厘米`;
  const sa = show(a), sb = show(b);
  const longer = a > b ? sa : sb;
  return { text: `哪个更长？\n${sa}　还是　${sb}`, options: shuffle([sa, sb, '一样长', '比不出来']), answer: longer,
           tip: `换成厘米比：${a} 厘米 和 ${b} 厘米。\n${Math.max(a, b)} 更大，所以 ${longer} 更长。` };
}

// ---- 形近字（语文，第5章）----
// 和"辨长短"呼应：都是把很像的两样东西分清楚
const XINGJIN = [
  { s:'请把门（　）上', a:'关', d:['天','夫','开'] },
  { s:'太阳（　）来了', a:'出', d:['山','由','击'] },
  { s:'他在（　）书',   a:'读', d:['卖','买','续'] },
  { s:'我很（　）心',   a:'开', d:['井','丹','升'] },
  { s:'天上有（　）朵云', a:'几', d:['九','凡','丸'] },
  { s:'（　）里有水',   a:'河', d:['何','荷','可'] },
  { s:'他跑得很（　）', a:'快', d:['块','决','诀'] },
  { s:'（　）字要写好', a:'汉', d:['汗','没','汁'] },
  { s:'一（　）花',     a:'朵', d:['杂','采','杀'] },
  { s:'（　）妈妈说话', a:'听', d:['斤','拆','折'] },
];
function xingjinQ() {
  const it = XINGJIN[irnd(0, XINGJIN.length - 1)];
  return { subj:'chinese', text: `「${it.s}」\n填哪个字？`, options: shuffle([it.a, ...it.d]), answer: it.a,
           tip: `${it.s.replace('（　）', it.a)}。\n这几个字长得像，别看错。` };
}

// ---- 第4章：克与千克（人教版三上）----
// 千克↔克 换算。整千克进出，孩子练的是"1千克=1000克"这一条
function massUnitQ() {
  const kind = irnd(0, 2);
  if (kind === 0) { const k = irnd(2, 9); return { text: `${k} 千克 = ? 克`, options: numOptions(k * 1000), answer: String(k * 1000), tip: `1 千克 = 1000 克，所以 ${k} 千克 = 1000×${k} = ${k * 1000} 克` }; }
  if (kind === 1) { const k = irnd(2, 9); return { text: `${k * 1000} 克 = ? 千克`, options: numOptions(k), answer: String(k), tip: `1000 克是 1 千克，${k * 1000} 里有 ${k} 个 1000，所以是 ${k} 千克` }; }
  const k = irnd(1, 8), g = irnd(1, 9) * 100;
  return { text: `${k} 千克 ${g} 克 = ? 克`, options: numOptions(k * 1000 + g), answer: String(k * 1000 + g),
           tip: `${k} 千克 = ${k * 1000} 克，再加 ${g} 克 = ${k * 1000 + g} 克` };
}

// 该用克还是千克 —— 单位感比换算更重要，这题不算数
const MASS_THINGS = [
  { n:'一枚一元硬币', u:'克' }, { n:'一颗鸡蛋', u:'克' }, { n:'一支铅笔', u:'克' },
  { n:'一本课本', u:'克' }, { n:'一片羽毛', u:'克' }, { n:'一块橡皮', u:'克' },
  { n:'一个小学生', u:'千克' }, { n:'一袋大米', u:'千克' }, { n:'一头猪', u:'千克' },
  { n:'一辆自行车', u:'千克' }, { n:'一台电视', u:'千克' }, { n:'一只西瓜', u:'千克' },
];
function massPickQ() {
  const t = MASS_THINGS[irnd(0, MASS_THINGS.length - 1)];
  return { text: `${t.n}\n有多重？用哪个单位合适？`, options: shuffle(['克', '千克', '米', '分钟']), answer: t.u,
           tip: t.u === '克' ? `${t.n}很轻，用【克】。\n很轻的东西用克，重的用千克。`
                             : `${t.n}比较重，用【千克】。\n1 千克 = 1000 克。` };
}

// 凑够整千克还差多少 / 两袋加起来多重
function massSumQ() {
  if (irnd(0, 1)) {
    const have = irnd(1, 9) * 100;
    return { text: `一袋 ${have} 克，\n再装多少克就正好 1 千克？`, options: numOptions(1000 - have), answer: String(1000 - have),
             tip: `1 千克 = 1000 克，1000 − ${have} = ${1000 - have} 克` };
  }
  const a = irnd(1, 8) * 100, b = irnd(1, 8) * 100;
  return { text: `${a} 克 + ${b} 克 = ? 克`, options: numOptions(a + b), answer: String(a + b),
           tip: a + b >= 1000 ? `${a}+${b}=${a + b} 克，\n也就是 ${Math.floor((a + b) / 1000)} 千克 ${(a + b) % 1000} 克`
                              : `${a}+${b}=${a + b} 克，还不到 1 千克` };
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
  return { subj:'chinese', text: item.t, options: shuffle([item.a, ...item.d]), answer: item.a,
           tip: `应该说「${item.t.replace('（　）', item.a)}」` };
}

// 题型属于数学还是语文。原来是在战斗里用 /[+−×]/ 猜题面 ——
// 时间题"3 时 = ? 分"没有运算符，被判成语文，字典护符会错误加成。
// 改成查表，题目自带 subj，不再靠猜。
const QSUBJ = {
  mult:'math', addsub:'math', divide:'math', remainder:'math', balance:'math',
  timeunit:'math', timeafter:'math', timespan:'math',
  massunit:'math', masspick:'math', masssum:'math',
  chinese:'chinese', liangci:'chinese', antonym:'chinese', duoyin:'chinese',
  mixed:'mixed', mixed2:'mixed', mixed3:'math', mixed3b:'mixed', mixed4:'math', mixed4b:'mixed',
  lenunit:'math', lenpick:'math', lencmp:'math', xingjin:'chinese',
  mixed1b:'mixed', mixed2b:'mixed', mixed5b:'mixed', mixedmath:'math', revenge:'mixed',
};

function getQuestion(type) {
  const q = getQuestionRaw(type);
  if (!q.subj) q.subj = QSUBJ[type] === 'chinese' ? 'chinese' : 'math';
  return q;
}

function getQuestionRaw(type) {
  if (type === 'antonym')   return antonymQ();
  if (type === 'duoyin')    return duoyinQ();
  if (type === 'balance')   return balanceQ();
  if (type === 'divide')    return divideQ();
  if (type === 'remainder') return remainderQ();
  if (type === 'liangci')   return liangciQ();
  if (type === 'timeunit')  return timeUnitQ();
  if (type === 'timeafter') return timeAfterQ();
  if (type === 'timespan')  return timeSpanQ();
  if (type === 'mixed3')    return [timeUnitQ, timeAfterQ, timeSpanQ][irnd(0, 2)]();
  if (type === 'mixed3b')   return [timeUnitQ, timeAfterQ, timeSpanQ, antonymQ][irnd(0, 3)]();
  if (type === 'massunit')  return massUnitQ();
  if (type === 'masspick')  return massPickQ();
  if (type === 'masssum')   return massSumQ();
  if (type === 'mixed4')    return [massUnitQ, massPickQ, massSumQ][irnd(0, 2)]();
  if (type === 'mixed4b')   return [massUnitQ, massPickQ, massSumQ, duoyinQ][irnd(0, 3)]();
  if (type === 'lenunit')   return lenUnitQ();
  if (type === 'lenpick')   return lenPickQ();
  if (type === 'lencmp')    return lenCmpQ();
  if (type === 'xingjin')   return xingjinQ();
  if (type === 'mixed5b')   return [lenUnitQ, lenPickQ, lenCmpQ, xingjinQ][irnd(0, 3)]();
  if (type === 'mixed2')    return [divideQ, remainderQ, liangciQ][irnd(0, 2)]();
  if (type === 'mixed1b')   return [multQ, multQ, chineseQ][irnd(0, 2)]();
  if (type === 'mixed2b')   return [divideQ, remainderQ, liangciQ][irnd(0, 2)]();
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
  put(10, 12, 'O');   // 传送阵（出生点 12,11 旁边）
  put(8, 12, 'E'); put(14, 12, 'H'); put(18, 11, 'J');   // 开场旁白拆给这三位

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

// ---- 第3章：时光钟楼 ----
// 拓扑刻意和前两章分开：第1章直廊、第2章环廊，这里是"竖着爬的塔"。
// 每层一间横厅，楼梯左右交替 —— 走法是 Z 字形，逼着你把每层走完才能上楼。
function _ch3map() {
  const W = 25, H = 62, g = Array.from({ length: H }, () => Array(W).fill('W'));
  const put = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
  const fill = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c); };

  // --- 塔底的钟表匠小镇（0~12）---
  fill(1, 1, 23, 12, 'g');
  fill(2, 2, 5, 4, 'r'); fill(2, 3, 5, 4, 'w'); put(3, 4, 'd');        // 钟表铺
  fill(18, 2, 21, 4, 'r'); fill(18, 3, 21, 4, 'w'); put(20, 4, 'd');   // 杂货铺
  fill(2, 7, 5, 9, 'r'); fill(2, 8, 5, 9, 'w'); put(3, 9, 'd');        // 学堂
  put(7, 6, '4'); put(16, 6, '5'); put(9, 10, '6'); put(19, 9, '7'); put(6, 11, '8');
  put(13, 6, 'E'); put(17, 11, 'H'); put(21, 7, 'J');                   // 开场说明拆给这三位
  put(8, 3, 'K');                                                        // 换物链：拾荒的小子
  put(15, 3, 'L');                                                       // 跨章委托：大钟守夜人
  put(11, 12, 'O');                                                     // 传送圆盘
  fill(12, 13, 13, 15, 'g');                                            // 进塔的门洞

  // --- 塔身：6 层横厅，楼梯左右交替（Z 字形爬）---
  // 每层厅高 3 格（top..top+2），层间隔 4 格楼板，楼梯 'v' 竖着打通
  // 楼梯左右交替 = 每层都得横穿一遍才上得去，路线自然变长，不用靠迷宫绕
  for (let i = 0; i < 6; i++) {
    const top = 17 + i * 7;
    fill(3, top, 21, top + 2, 'g');
    if (i < 5) {
      const sx = i % 2 === 0 ? 20 : 4;      // 一层右、二层左、三层右……
      fill(sx, top + 3, sx, top + 6, 'v');  // 层间隔 4 格，得整段打通
    }
  }
  fill(12, 16, 13, 16, 'g');                // 进塔口接到一层

  // --- 六层 → 顶层：一段竖楼梯，底下卡着钟门 ---
  const topY = 59;
  fill(12, 55, 12, 58, 'v');
  put(12, 55, 'G');                          // 钟门：拨对时间才开

  // --- 顶层钟面厅（魔王）---
  fill(3, topY, 21, topY + 2, 'g');
  put(12, topY, 'X'); put(12, topY + 1, 'B');   // 水晶在上、时针幽灵在下

  // --- 内容分布 ---
  put(5,  18, 'c');  put(19, 19, 'p');      // 一层：宝箱 + 碎片
  put(4,  25, 'h');  put(20, 26, 'c');      // 二层
  put(6,  32, 'p');  put(18, 33, 'h');      // 三层
  put(5,  39, 'c');  put(20, 40, 'h');      // 四层
  put(7,  46, 'p');  put(19, 47, 'h');      // 五层
  put(12, 53, 'D');                          // 六层：钟面机关入口
  put(6,  54, 'G');                          // 六层：通顶层的钟门（解开机关才开）
  put(16, 53, '9');                          // 六层：迷路的报时人

  return g.map(r => r.join(''));
}
const CH3_MAP = _ch3map();

const CH3_START   = { x:12, y:11 };
const CH3_REVENGE = { x:12, y:14 };

// ---- 第4章：砝码矿洞 ----
// 拓扑第四种：树状分支坑道。一条主竖井，左右伸出长短不等的支洞，
// 支洞尽头才是东西。前三章是直廊/环廊/塔层，这里是"岔路多、会走错"。
function _ch4map() {
  const W = 25, H = 60, g = Array.from({ length: H }, () => Array(W).fill('M'));
  const put = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
  const fill = (x1, y1, x2, y2, c) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) put(x, y, c); };

  // --- 洞口的矿工营地（0~12）---
  fill(1, 1, 23, 12, 'n');
  fill(2, 2, 5, 4, 'r'); fill(2, 3, 5, 4, 'w'); put(3, 4, 'd');        // 矿工棚
  fill(18, 2, 21, 4, 'r'); fill(18, 3, 21, 4, 'w'); put(20, 4, 'd');   // 秤房
  fill(2, 7, 5, 9, 'r'); fill(2, 8, 5, 9, 'w'); put(3, 9, 'd');        // 学堂
  put(7, 6, '4'); put(16, 6, '5'); put(9, 10, '6'); put(19, 9, '7'); put(6, 11, '8');
  put(13, 6, 'E'); put(17, 11, 'H'); put(21, 7, 'J');
  put(11, 12, 'O');                                                     // 传送圆盘

  // --- 主竖井：x=12，从洞口一直到矿底 ---
  fill(11, 13, 13, 55, 'n');

  // --- 左右支洞：长短不一，尽头放东西 ---
  // [y, 方向, 长度]
  const branches = [
    [17, -1, 8], [21, 1, 9], [26, -1, 6], [31, 1, 7],
    [36, -1, 9], [41, 1, 6], [46, -1, 7], [50, 1, 8],
  ];
  branches.forEach(([y, dir, len]) => {
    const x1 = dir < 0 ? 11 - len : 14, x2 = dir < 0 ? 10 : 13 + len;
    fill(x1, y, x2, y + 1, 'n');
  });
  // 支洞尽头的内容
  put(3,  17, 'c'); put(22, 21, 'p'); put(5,  26, 'h'); put(21, 31, 'c');
  put(2,  36, 'p'); put(20, 41, 'h'); put(4,  46, 'h'); put(22, 50, 'c');
  put(18, 22, '9');                                                     // 支洞里的迷路矿工（右支洞 y=21~22）

  // --- 矿底：天平机关入口 + 石门 ---
  fill(4, 52, 20, 55, 'n');
  put(12, 51, 'D');            // 天平机关入口（在竖井上，进矿底之前）
  // y=56 整行是岩壁，只有 x=8 这一格是门 —— 门必须是唯一通路，否则谜题白做
  put(8, 56, 'G');
  fill(3, 57, 21, 59, 'n');    // 魔王厅
  put(12, 57, 'X'); put(12, 58, 'B');

  return g.map(r => r.join(''));
}
const CH4_MAP = _ch4map();

const CH4_START   = { x:12, y:11 };
const CH4_REVENGE = { x:12, y:14 };

// ---- 第5章：尺寸长廊 ----
// 拓扑第五种：螺旋。一条走廊从外圈一圈圈绕到最里面，路只有一条但很长，
// 每绕一圈廊宽都不一样（3格→2格→1格），"越走越窄"本身就是尺寸的暗示。
function _ch5map() {
  const W = 25, H = 58, g = Array.from({ length: H }, () => Array(W).fill('L'));
  const put = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
  const fill = (x1, y1, x2, y2, c) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++)
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) put(x, y, c);
  };

  // --- 廊口的量尺小镇（0~12）---
  fill(1, 1, 23, 12, 'q');
  fill(2, 2, 5, 4, 'r'); fill(2, 3, 5, 4, 'w'); put(3, 4, 'd');
  fill(18, 2, 21, 4, 'r'); fill(18, 3, 21, 4, 'w'); put(20, 4, 'd');
  fill(2, 7, 5, 9, 'r'); fill(2, 8, 5, 9, 'w'); put(3, 9, 'd');
  put(7, 6, '4'); put(16, 6, '5'); put(9, 10, '6'); put(19, 9, '7'); put(6, 11, '8');
  put(13, 6, 'E'); put(17, 11, 'H'); put(21, 7, 'J');
  put(11, 12, 'O');

  // --- 螺旋走廊：一圈圈往里绕，逐圈变窄 ---
  // 每一圈用四条边拼出来，wid 是廊宽
  const ring = (x1, y1, x2, y2, wid) => {
    fill(x1, y1, x2, y1 + wid - 1, 'q');            // 上边
    fill(x1, y2 - wid + 1, x2, y2, 'q');            // 下边
    fill(x1, y1, x1 + wid - 1, y2, 'q');            // 左边
    fill(x2 - wid + 1, y1, x2, y2, 'q');            // 右边
  };
  ring(2, 15, 22, 54, 3);        // 最外圈，宽3
  ring(6, 21, 18, 48, 2);        // 第二圈，宽2
  ring(9, 26, 15, 43, 1);        // 第三圈，宽1（只能单排通过）

  // 圈与圈之间的开口（错开，逼着你绕整圈）
  fill(12, 13, 13, 15, 'q');     // 镇子 → 外圈（上方进）
  fill(12, 18, 13, 21, 'q');     // 外圈 → 第二圈（上方）
  fill(6, 34, 9, 35, 'q');       // 第二圈 → 第三圈（左侧，得绕半圈才到）

  // --- 最里面：量尺厅 + 石门 + 魔王厅 ---
  // 魔王厅只能留 x=11~13，四周都得是墙，否则会贴上内圈的走廊、绕过石门
  fill(11, 27, 13, 36, 'q');     // 量尺厅（从第三圈上边 y=26 进）
  put(12, 30, 'D');              // 搭桥机关入口
  put(12, 37, 'G');              // 量尺石门 —— 通魔王厅的唯一一格
  fill(11, 38, 13, 41, 'q');     // 魔王厅（y=42 留墙，别贴到第三圈下边 y=43）
  put(12, 39, 'X'); put(12, 40, 'B');

  // --- 内容：沿着螺旋分布，越里面越好 ---
  put(3,  17, 'c'); put(21, 20, 'p');
  put(3,  50, 'h'); put(21, 51, 'c');
  put(7,  23, 'p'); put(17, 24, 'h');
  put(7,  46, 'h'); put(17, 45, 'c');
  put(20, 30, '9');              // 外圈右侧：迷路的量尺匠
  put(7, 40, 'b');               // 地上的木尺（接了委托才出现）

  return g.map(r => r.join(''));
}
const CH5_MAP = _ch5map();

const CH5_START   = { x:12, y:11 };
const CH5_REVENGE = { x:12, y:14 };

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
  // 原来开场旁白讲的"巨人要分匀""回廊绕一圈"，现在由这三位说
  'E': { name:'摆石子的女孩', tex:'npc_girl2', role:'info',
    lines: ['（她面前摆着两堆石子，一颗一颗数得很认真。）',
            '要一样多。不一样多，巨人会生气。',
            '巨人说，什么都要分匀。',
            '分不匀的，他就拿走。',
            '……我家的桌子，就被拿走一半。'],
    lines2: ['巨人走了！',
             '可是我还是想把石子摆匀。\n摆匀了好看。'] },
  'H': { name:'靠墙的守卫', tex:'npc_guard', role:'info',
    lines: ['这地方叫除法回廊。绕一整圈，\n要走上一天。',
            '你看正中间那块空地 ——\n那是天井。',
            '第二颗水晶就在天井里发光。',
            '不过想进天井，得先过那扇石门。'],
    lines2: ['天井空了，水晶被你拿走了。',
             '回廊倒是清静下来了。'] },
  'J': { name:'修门板的木匠', tex:'npc_carpenter', role:'info',
    lines: ['门板是我一块块码好的。\n巨人非要平分，我拦不住。',
            '最难受的是分不完剩下的那几块。',
            '巨人管那叫"零头"，堆在角落，\n谁也不敢动。',
            '你要是会算余数，\n说不定能把零头处理掉。'],
    lines2: ['零头我收拾好了，\n门板也装回去了。谢啦！'] },
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

// ================= 第三章数据 =================
const CH3_SPAWNS = [
  { k:'cog',  x:8,  y:18 }, { k:'bell', x:16, y:19 },      // 一层
  { k:'sand', x:9,  y:25 }, { k:'cog',  x:17, y:26 },      // 二层
  { k:'bell', x:10, y:32 }, { k:'sand', x:16, y:33 },      // 三层
  { k:'cog',  x:8,  y:39 }, { k:'bell', x:18, y:40 },      // 四层
  { k:'sand', x:11, y:46 }, { k:'cog',  x:17, y:47 },      // 五层
  { k:'bell', x:9,  y:53 }, { k:'sand', x:20, y:54 },      // 六层
  { k:'flip', x:13, y:19 }, { k:'flip', x:11, y:40 },      // 颠倒摆（语文·反义词）
];

// 日记第 17–24 页：他开始"追不上"——为第6章的身份揭示继续铺垫，仍不点名
const CH3_FRAGS = [
  { where:'一层',     text:'第十七页：\n「先生说，会看钟的孩子\n才管得住自己。」' },
  { where:'三层',     text:'第十八页：\n「我把闹钟拨早了半小时。\n还是最后一个到。」' },
  { where:'五层',     text:'第十九页：\n「他们跑得快。\n我数着自己的脚步，\n一二一二。」' },
  { where:'钟面第一间', text:'第二十页：\n「今天迟到了。\n先生没说我，只看了看钟。」' },
  { where:'宝箱里',   text:'第二十一页：\n「我想把钟拨慢。\n那样是不是就来得及了。」' },
  { where:'隐藏处',   text:'第二十二页：\n「拨慢了也没用。\n天还是黑了。」' },
  { where:'隐藏处',   text:'第二十三页：\n「我在钟楼下面坐到很晚。\n没人来找。」' },
  { where:'隐藏处',   text:'第二十四页：\n「时间不等我。\n谁也不等我。」' },
];

const CH3_NPCS = {
  '1': { name:'守钟人',    tex:'npc_elder',    role:'elder' },
  '2': { name:'商人',      tex:'npc_merchant', role:'shop' },
  '3': { name:'老师',      tex:'npc_teacher',  role:'teacher' },
  // 线索机制：三张作息表拼出钟门要拨的时刻（不是凑数字，也不是真假话）
  '4': { name:'钟表匠',    tex:'npc_smith',    role:'clue', clue:'c3a' },
  '5': { name:'送奶的婶婶',tex:'npc_aunt',     role:'clue', clue:'c3b' },
  '9': { name:'迷路的报时人',tex:'npc_traveler',role:'clue', clue:'c3c' },
  '6': { name:'滴答',      tex:'npc_girl',     role:'quest' },
  '7': { name:'修钟的老人',tex:'npc_grandpa',  role:'lore' },
  '8': { name:'小铃',      tex:'npc_boy',      role:'chat' },
  'E': { name:'塔下的更夫', tex:'npc_guard', role:'info',
    lines: ['这塔有六层，楼梯一层左一层右。',
            '想上去，每层都得横着走一遍。',
            '塔顶的大钟停了。\n停在几点，没人说得准。'],
    lines2: ['大钟又开始走了。\n我听见它响了。'] },
  'H': { name:'背书包的男孩', tex:'npc_kid', role:'info',
    lines: ['这儿的怪物都跟时间有关。',
            '有的问你 1 时等于几分，\n有的问你再过一会儿几点了。',
            '我总算错跨小时的那种。\n满 60 分要进 1 时，我老忘。'],
    lines2: ['我现在会算跨小时的了！'] },
  'J': { name:'圆盘旁的奶奶', tex:'npc_granny', role:'info',
    lines: ['圆盘你已经会用啦。',
            '前两章要是还有纸片没捡完，\n随时踩上去回去。'],
    lines2: ['三个地方都能去了。\n想去哪儿踩一下就行。'] },
  // 换物链的第三环：给钢丝的人
  'K': { name:'拾荒的小子', tex:'npc_carpenter', role:'trade' },
  // 跨章委托：三样零件散在第1、2、3章，得踩传送阵回去拿
  'L': { name:'大钟守夜人', tex:'npc_guard2', role:'errand' },
};

// 线索：三张作息表，拼出钟门要拨到的时刻（时来自一张，分来自另一张，第三张校验）
const CH3_CLUES = {
  c3a: { lock:'clock', from:'钟表匠',     ask:'大钟停的那一刻，\n时针正指着下午的第 4 个整点。\n（也就是 16 时）',
         note:'钟表匠说：时针指 16 时' },
  c3b: { lock:'clock', from:'送奶的婶婶', ask:'我送完最后一家是 15:40，\n那时钟还在走。\n它是在那之后 5 分钟停的。',
         note:'送奶婶婶说：15:40 之后 5 分钟停的 → 15:45' },
  c3c: { lock:'clock', from:'迷路的报时人',ask:'我记着的是"三点三刻"。\n一刻是 15 分，三刻就是 45 分。',
         note:'报时人说：三点三刻 = 3:45（下午就是 15:45）' },
  c3d: { lock:'lore',  from:'修钟的老人',  ask:'齿轮缝里塞着东西。\n手指抠不出来，得有细长的家伙。',
         note:'齿轮缝藏有东西（拿到时之怀表再回来）' },
};

// 钟门：把指针拨到停摆的那一刻。16时 是钟表匠记错了（他看的是时针"快指到"4）
// 婶婶和报时人两条独立线索都指向 15:45 —— 二对一，答案就是 15:45
const CH3_CLOCKLOCK = {
  answer: { h: 15, m: 45 },
  candidates: [{ h: 16, m: 0 }, { h: 15, m: 45 }, { h: 3, m: 45 }],
  explain: '婶婶说 15:40 之后 5 分钟 → 15:45。\n' +
           '报时人说"三点三刻" → 3:45，下午就是 15:45。\n' +
           '两个人对得上，所以是 15:45。\n' +
           '钟表匠看的是时针快指到 4，其实还没到整点。',
};

const CH3_LOCKS = [
  { kind:'calc',     icon:'🔢', hint:'箱盖上刻着一道时间换算题' },
  { kind:'schedule', icon:'🕐', hint:'箱盖上是一张作息表，\n缺了一格时间。' },
  { kind:'clock',    icon:'⏰', hint:'箱盖上是个小钟面。\n镇上三个人各记着一个时刻，\n问齐了再来。', clues:['c3a','c3b','c3c'] },
];

const CH3_CHESTS = [
  { kind:'gear', key:'glass_s', msg:'找到了【钟面盾】！' },
  { kind:'frag', idx:4,         msg:'箱子里是一页发黄的纸……' },
  { kind:'gear', key:'pocketw', msg:'找到了传说中的【时之怀表】！\n（商店买不到，答题倒计时+1秒）' },
];

const CH3_HOUSES = {
  '3,4':  { name:'钟表铺', owner:'1', rows:[
    "WWWWWWWWW",
    "WuFuFuFuW",
    "WFFFFFFFW",
    "WtFFNFFtW",
    "WFFFFFFFW",
    "WuFFFFFuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '20,4': { name:'杂货铺', owner:'2', rows:[
    "WWWWWWWWW",
    "WuuFFFuuW",
    "WFFFFFFFW",
    "WFFFNFFFW",
    "WtFFFFFtW",
    "WFFFFFFFW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '3,9':  { name:'钟楼学堂', owner:'3', rows:[
    "WWWWWWWWW",
    "WFtttttFW",
    "WFFFFFFFW",
    "WFFFNFFFW",
    "WFtttttFW",
    "WuFFFFFuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
};

const CH3_SHOP = ['clock_sw','compass','gear_h','glass_s','abacus_s','swift_b','hourgl','divider'];

// ---- 钟面机关（第3章招牌谜题）----
// 拨时针分针到指定时刻。三间递进：读整点 → 读半点/刻 → 算经过时间后的时刻
const CH3_CLOCK = [
  { name:'第一间 · 先认整点', start:{ h:9, m:0 }, target:{ h:12, m:0 },
    riddle: '石刻：「日出后三小时，门方开」\n（现在钟上是 9:00）',
    hint: '9 点再过 3 小时就是 12 点。\n按 ＋时 拨三下。',
    reward:{ kind:'frag', idx:3 } },
  { name:'第二间 · 半点和刻', start:{ h:7, m:0 }, target:{ h:7, m:45 },
    riddle: '石刻：「七点三刻」\n（一刻 = 15 分）',
    hint: '三刻 = 15×3 = 45 分。\n时针留在 7，分针拨到 45。',
    reward:{ kind:'gold', val:420 } },
  { name:'第三间 · 会跨小时', start:{ h:10, m:50 }, target:{ h:11, m:35 },
    riddle: '石刻：「现在十点五十，\n再过四十五分钟」',
    hint: '50 + 45 = 95 分，超过 60 了。\n进 1 时，剩 35 分 → 11:35。',
    reward:{ kind:'gear', key:'swift_b' } },
];

// ================= 第四章数据 =================
const CH4_SPAWNS = [
  { k:'ore',  x:12, y:16 }, { k:'bat',  x:6,  y:17 },
  { k:'cart', x:18, y:21 }, { k:'ore',  x:12, y:24 },
  { k:'bat',  x:8,  y:26 }, { k:'cart', x:17, y:31 },
  { k:'ore',  x:12, y:34 }, { k:'bat',  x:5,  y:36 },
  { k:'cart', x:16, y:41 }, { k:'ore',  x:12, y:44 },
  { k:'bat',  x:7,  y:46 }, { k:'cart', x:18, y:50 },
  { k:'echo', x:12, y:29 }, { k:'echo', x:12, y:48 },   // 回声蝠（语文·多音字）
];

// 日记第 25–32 页：他开始"称量自己"——为第6章的身份揭示铺垫，仍不点名
const CH4_FRAGS = [
  { where:'左支洞', text:'第二十五页：\n「先生把我们的本子摞成一叠，\n我的最薄。」' },
  { where:'右支洞', text:'第二十六页：\n「娘说我瘦。\n我说我不吃了。」' },
  { where:'秤房',   text:'第二十七页：\n「一样的两个人，\n为什么有一个就是轻的。」' },
  { where:'天平第一间', text:'第二十八页：\n「我把石头装进书包。\n这样称起来就重了。」' },
  { where:'宝箱里', text:'第二十九页：\n「先生看出来了。\n他没说，把石头拿出来了。」' },
  { where:'隐藏处', text:'第三十页：\n「他说，本子薄不要紧。\n我说要紧。」' },
  { where:'隐藏处', text:'第三十一页：\n「我想知道我到底有多重。」' },
  { where:'隐藏处', text:'第三十二页：\n「称不出来的。\n秤上没有那个刻度。」' },
];

const CH4_NPCS = {
  '1': { name:'老矿长',   tex:'npc_elder',    role:'elder' },
  '2': { name:'商人',     tex:'npc_merchant', role:'shop' },
  '3': { name:'老师',     tex:'npc_teacher',  role:'teacher' },
  // 线索机制第四种：三段重量相加（不是凑口令、不是真假话、不是互相印证）
  '4': { name:'掌秤的师傅', tex:'npc_smith',  role:'clue', clue:'c4a' },
  '5': { name:'装袋的婶婶', tex:'npc_aunt',   role:'clue', clue:'c4b' },
  '9': { name:'迷路的矿工', tex:'npc_traveler',role:'clue', clue:'c4c' },
  '6': { name:'小秤',     tex:'npc_girl',     role:'quest' },
  '7': { name:'瞎眼的老矿工', tex:'npc_grandpa', role:'lore' },
  '8': { name:'铁头',     tex:'npc_boy',      role:'chat' },
  'E': { name:'洞口的工头', tex:'npc_guard', role:'info',
    lines: ['矿洞里岔道多，别乱钻。',
            '支洞有长有短，\n尽头才有东西。',
            '走错了就退回主井再下。'],
    lines2: ['河马走了，矿又能开了。'] },
  'H': { name:'扛麻袋的小子', tex:'npc_kid', role:'info',
    lines: ['这儿的怪都跟"多重"有关。',
            '一千克等于一千克，\n这条记牢就不怕。',
            '很轻的用克，重的用千克。'],
    lines2: ['我现在装袋能估个八九不离十了。'] },
  'J': { name:'圆盘旁的奶奶', tex:'npc_granny', role:'info',
    lines: ['圆盘还是那个用法。',
            '前面三个地方，\n哪儿的纸片没捡完就回去。'],
    lines2: ['四个地方都通了。'] },
};

const CH4_CLUES = {
  c4a: { lock:'weigh', from:'掌秤的师傅', ask:'那口箱子压着三袋矿。\n我这袋是 400 克。',
         note:'掌秤师傅：第一袋 400 克' },
  c4b: { lock:'weigh', from:'装袋的婶婶', ask:'我装的那袋比他的重 200 克。',
         note:'装袋婶婶：第二袋比第一袋重 200 克 → 600 克' },
  c4c: { lock:'weigh', from:'迷路的矿工', ask:'第三袋我记得清 ——\n正好半千克。',
         note:'迷路矿工：第三袋 = 半千克 = 500 克' },
  c4d: { lock:'lore',  from:'瞎眼的老矿工', ask:'岩缝里卡着东西。\n我摸得着，掏不出来。',
         note:'岩缝藏有东西（拿到砝码再回来）' },
};

// 称重锁：三袋加起来多少克。400 + 600 + 500 = 1500 克 = 1千克500克
const CH4_WEIGHLOCK = {
  answer: 1500,
  candidates: [1300, 1500, 1900],
  explain: '第一袋 400 克。\n' +
           '第二袋比它重 200 克 → 600 克。\n' +
           '第三袋半千克 → 500 克。\n' +
           '400 + 600 + 500 = 1500 克，\n也就是 1 千克 500 克。',
};

const CH4_LOCKS = [
  { kind:'calc',  icon:'🔢', hint:'箱盖上刻着一道千克换算题' },
  { kind:'unit',  icon:'⚖️', hint:'箱盖上画着一样东西，\n问你该用克还是千克。' },
  { kind:'weigh', icon:'🧮', hint:'箱盖上刻着：\n「三袋矿一共多少克？」\n营地里三个人各知道一袋。', clues:['c4a','c4b','c4c'] },
];

const CH4_CHESTS = [
  { kind:'gear', key:'ore_h',   msg:'找到了【矿石盔】！' },
  { kind:'frag', idx:4,         msg:'箱子里是一页发黄的纸……' },
  { kind:'gear', key:'weightc', msg:'找到了传说中的【砝码护符】！\n（商店买不到，答对回3点MP）' },
];

const CH4_HOUSES = {
  '3,4':  { name:'矿工棚', owner:'1', rows:[
    "WWWWWWWWW",
    "WBFFFFFBW",
    "WFFFFFFFW",
    "WtFFNFFtW",
    "WFFFFFFFW",
    "WBFFFFFBW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '20,4': { name:'秤房', owner:'2', rows:[
    "WWWWWWWWW",
    "WuuuuuuuW",
    "WFFFFFFFW",
    "WtFFNFFtW",
    "WFFFFFFFW",
    "WuuFFFuuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '3,9':  { name:'矿洞学堂', owner:'3', rows:[
    "WWWWWWWWW",
    "WFtttttFW",
    "WFFFFFFFW",
    "WuFFNFFuW",
    "WFFFFFFFW",
    "WFtttttFW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
};

const CH4_SHOP = ['pick_sw','clock_sw','ore_h','glass_s','plate_s','swift_b','hourgl','gramch'];

// ---- 天平机关（第4章招牌谜题）----
// 左盘固定重量，右边给一堆砝码，选出组合让天平平衡。
// total 用克表示，砝码也用克 —— 换算就发生在"1千克那块砝码顶几个200克"里
const CH4_BALANCE = [
  { name:'第一间 · 先配平', target:700, weights:[500, 200, 100, 50],
    riddle:'左盘：一袋 700 克的矿。',
    hint:'500 + 200 = 700。\n两块就够了。',
    reward:{ kind:'frag', idx:3 } },
  { name:'第二间 · 千克换克', target:1200, weights:[1000, 500, 200, 100],
    riddle:'左盘：一袋 1 千克 200 克的矿。',
    hint:'1 千克 = 1000 克，\n所以要 1000 + 200 = 1200 克。',
    reward:{ kind:'gold', val:600 } },
  { name:'第三间 · 想清楚再放', target:1850, weights:[1000, 500, 200, 100, 50],
    riddle:'左盘：一袋 1 千克 850 克的矿。',
    hint:'1850 = 1000 + 500 + 200 + 100 + 50。\n五块全用上。',
    reward:{ kind:'gear', key:'plate_s' } },
];

// ================= 第五章数据 =================
const CH5_SPAWNS = [
  { k:'tape', x:12, y:16 }, { k:'rod',  x:20, y:17 },
  { k:'tape', x:4,  y:30 }, { k:'rod',  x:21, y:38 },
  { k:'tape', x:12, y:52 }, { k:'rod',  x:7,  y:26 },
  { k:'coil', x:17, y:22 }, { k:'coil', x:7,  y:44 },
  { k:'tape', x:12, y:33 }, { k:'rod',  x:12, y:33 },
  { k:'twin', x:13, y:19 }, { k:'twin', x:11, y:47 },   // 双生字（语文·形近字）
];

// 日记第 33–40 页：他开始量自己和别人的距离
const CH5_FRAGS = [
  { where:'外圈',   text:'第三十三页：\n「我量了我和他的座位。\n两步半。」' },
  { where:'外圈',   text:'第三十四页：\n「下课他们都到操场去。\n我数了，一百二十步。」' },
  { where:'第二圈', text:'第三十五页：\n「我把尺子借给他。\n他没还，我也没要。」' },
  { where:'搭桥第一间', text:'第三十六页：\n「先生说，量东西要从零开始。\n我总从一开始。」' },
  { where:'宝箱里', text:'第三十七页：\n「所以我量什么都短一点。」' },
  { where:'隐藏处', text:'第三十八页：\n「我想量一量我离他们有多远。」' },
  { where:'隐藏处', text:'第三十九页：\n「尺子不够长。」' },
  { where:'隐藏处', text:'第四十页：\n「接了三根，还是不够。」' },
];

const CH5_NPCS = {
  '1': { name:'老尺匠',    tex:'npc_elder',    role:'elder' },
  '2': { name:'商人',      tex:'npc_merchant', role:'shop' },
  '3': { name:'老师',      tex:'npc_teacher',  role:'teacher' },
  // 线索机制第五种：长短关系推理（甲比乙长、乙比丙长 → 谁最长）
  '4': { name:'量布的师傅', tex:'npc_smith',   role:'clue', clue:'c5a' },
  '5': { name:'织带的婶婶', tex:'npc_aunt',    role:'clue', clue:'c5b' },
  '9': { name:'迷路的量尺匠', tex:'npc_traveler', role:'clue', clue:'c5c' },
  '6': { name:'寸寸',      tex:'npc_girl',     role:'quest' },
  '7': { name:'驼背的老人', tex:'npc_grandpa', role:'lore' },
  '8': { name:'尺子',      tex:'npc_boy',      role:'chat' },
  'E': { name:'廊口的引路人', tex:'npc_guard', role:'info',
    lines: ['这廊子是一圈圈往里绕的。',
            '越往里越窄，最里面只能一个人过。',
            '路只有一条，别怕走错，\n就是长。'],
    lines2: ['蛇走了，廊子空了。\n绕一圈也不累了。'] },
  'H': { name:'背尺子的小子', tex:'npc_kid', role:'info',
    lines: ['这儿的怪都问长短。',
            '一米等于一百厘米，\n一分米等于十厘米。',
            '两段长短不一样的单位，\n先换成一样的再比。'],
    lines2: ['我现在一眼就能换算了！'] },
  'J': { name:'圆盘旁的奶奶', tex:'npc_granny', role:'info',
    lines: ['圆盘老规矩。',
            '前面四个地方，\n有纸片没捡完就回去。'],
    lines2: ['五个地方都通了。'] },
};

const CH5_CLUES = {
  c5a: { lock:'order', from:'量布的师傅', ask:'那口箱子要按长短开。\n我知道一条：\n红布比蓝布长。',
         note:'量布师傅：红 > 蓝' },
  c5b: { lock:'order', from:'织带的婶婶', ask:'我织的黄带子\n比红布还长。',
         note:'织带婶婶：黄 > 红' },
  c5c: { lock:'order', from:'迷路的量尺匠', ask:'蓝布我量过，\n它比绿布长。',
         note:'量尺匠：蓝 > 绿' },
  c5d: { lock:'lore',  from:'驼背的老人',  ask:'砖缝里插着东西。\n我腰弯不下去了。',
         note:'砖缝藏有东西（拿到伸缩尺再回来）' },
};

// 排序锁：黄 > 红 > 蓝 > 绿，问最长的是哪个
const CH5_ORDERLOCK = {
  answer: '黄带子',
  candidates: ['黄带子', '红布', '蓝布', '绿布'],
  explain: '黄 > 红（婶婶说的）\n' +
           '红 > 蓝（师傅说的）\n' +
           '蓝 > 绿（量尺匠说的）\n' +
           '连起来：黄 > 红 > 蓝 > 绿。\n最长的是黄带子。',
};

const CH5_LOCKS = [
  { kind:'calc',  icon:'🔢', hint:'箱盖上刻着一道米和厘米的换算题' },
  { kind:'ruler', icon:'📐', hint:'箱盖上画着一样东西，\n问你该用米还是厘米。' },
  { kind:'order', icon:'📊', hint:'箱盖上刻着：\n「哪一根最长？」\n镇上三个人各知道一组长短。', clues:['c5a','c5b','c5c'] },
];

const CH5_CHESTS = [
  { kind:'gear', key:'ruler_s', msg:'找到了【尺盾】！' },
  { kind:'frag', idx:4,         msg:'箱子里是一页发黄的纸……' },
  { kind:'gear', key:'longruler', msg:'找到了传说中的【伸缩尺】！\n（商店买不到，走路速度+12）' },
];

const CH5_HOUSES = {
  '3,4':  { name:'量布铺', owner:'1', rows:[
    "WWWWWWWWW",
    "WtFFFFFtW",
    "WFFFFFFFW",
    "WuFFNFFuW",
    "WFFFFFFFW",
    "WtFFFFFtW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '20,4': { name:'尺行', owner:'2', rows:[
    "WWWWWWWWW",
    "WuFFuFFuW",
    "WFFFFFFFW",
    "WFFFNFFFW",
    "WFFFFFFFW",
    "WuFFuFFuW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
  '3,9':  { name:'长廊学堂', owner:'3', rows:[
    "WWWWWWWWW",
    "WFtFtFtFW",
    "WFFFFFFFW",
    "WFFFNFFFW",
    "WFFFFFFFW",
    "WFtFtFtFW",
    "WFFFDFFFW",
    "WWWWWWWWW" ]},
};

const CH5_SHOP = ['tape_sw','pick_sw','ruler_h','ruler_s','plate_s','swift_b','gramch','cmcharm'];

// ---- 搭桥机关（第5章招牌谜题）----
// 不是"凑总长"（那和第4章天平一样了），是"按长短排顺序"。
// 木板标着混着的单位，必须先换算成同一单位才排得对 —— 这正是本章要练的。
const CH5_BRIDGE = [
  { name:'第一间 · 从短到长', unit:'厘米',
    boards:[{ label:'30厘米', cm:30 }, { label:'1米', cm:100 }, { label:'70厘米', cm:70 }],
    riddle:'石刻：「阶梯要从矮到高。」\n把木板按从短到长摆好。',
    hint:'1米 = 100厘米。\n所以顺序是 30厘米 → 70厘米 → 1米。',
    reward:{ kind:'frag', idx:3 } },
  { name:'第二间 · 单位混着来', unit:'厘米',
    boards:[{ label:'2米', cm:200 }, { label:'150厘米', cm:150 }, { label:'8分米', cm:80 }, { label:'1米20厘米', cm:120 }],
    riddle:'石刻：「从矮到高，一块也不许错。」',
    hint:'全换成厘米：80、120、150、200。\n顺序是 8分米 → 1米20厘米 → 150厘米 → 2米。',
    reward:{ kind:'gold', val:900 } },
  { name:'第三间 · 差一点也不行', unit:'厘米',
    boards:[{ label:'1米05厘米', cm:105 }, { label:'95厘米', cm:95 }, { label:'1米', cm:100 },
            { label:'1米15厘米', cm:115 }, { label:'9分米', cm:90 }],
    riddle:'石刻：「五块，从矮到高。」\n这几块差得很近，看仔细。',
    hint:'换成厘米：90、95、100、105、115。\n顺序是 9分米 → 95厘米 → 1米 → 1米05厘米 → 1米15厘米。',
    reward:{ kind:'gear', key:'ruler_s' } },
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
    hiddenBase:5, hiddenTool:'lens', hiddenToolName:'放大镜',
    // 下面这些原来写死在 game.js 的 if (chapter===0/1) 里，改成数据 —— 加新章不用再动代码
    dex:['slime','imp','wraith','revenge','boss'],
    bossTaunt:'哞——想要水晶？\n先把乘法口诀背熟再来吧，小豆丁！',
    hiddenLocked:'这里的沙子好像有点不一样……\n可是什么也看不出来。',
    toolHint:'「沙漠里有几处沙子不太一样，\n用放大镜看看，会有发现的。」',
    gateHint:['一扇巨大的石门，上面刻着乘法口诀。',
              '门缝里透出光，可是推不开——\n旁边那个石室里好像有机关。'],
    elderWhere:'南边沙漠里的口诀骆驼王守着记忆水晶。',
    elderSide:'沙漠两边的岔路你也去看看，\n听说藏着别人丢下的东西。',
    groundItem:{ quest:'dodo', appearAt:'taken', becomes:'found', tint:0x9fd8f0,
                 msg:['捡到了一本浅蓝色封面的作业本。', '是朵朵丢的那本吧？\n拿回村里还给她。'] } },
  { n:2, name:'除法回廊', recLv:11, tool:'hook', toolName:'🪝词语钩爪', boss:'boss2',
    map:CH2_MAP, start:CH2_START, revenge:CH2_REVENGE, spawns:CH2_SPAWNS,
    frags:CH2_FRAGS, npcs:CH2_NPCS, clues:CH2_CLUES, locks:CH2_LOCKS,
    chests:CH2_CHESTS, houses:CH2_HOUSES, shop:CH2_SHOP,
    puzzle:{ kind:'candy', rooms:CH2_CANDY },
    bossTile:{ x:12, y:32 }, crystalTile:{ x:12, y:30 },
    hiddenBase:5, hiddenTool:'hook', hiddenToolName:'词语钩爪',
    dex:['spider','imp2','owl','revenge','boss2'],
    bossTaunt:'想过去？先证明你会分东西。\n分不匀的人，我不放行。',
    hiddenLocked:'墙缝里好像卡着什么……\n可是手伸不进去。',
    toolHint:'「回廊的墙缝里卡着东西。\n用钩爪就够得着了。」',
    gateHint:['天井的石门上刻满了除号。',
              '门推不动——\n旁边的石室里好像有机关。'],
    elderWhere:'回廊尽头的分糖巨人守着第二颗水晶。',
    elderSide:'四个角上的侧厅别漏了，\n里头有人藏过东西。',
    // 长老在上一章末尾对本章的铺垫（先给氛围，别给答案）
    elderTease:['那地方原本热闹。\n直到一个巨人住了进去 ——',
                '他不抢东西，他"分"东西。\n什么都要分成一样多的几份。',
                '锅碗、粮食、连门板都拆了平分。\n分不完的零头堆在角落，谁也不敢动。'],
    travelBeats:['你跟着水晶往北走。', '沙子渐渐变成石板。',
                 '风声停了，脚步声开始有回音。',
                 '一圈一圈的石廊立在眼前 ——\n【除法回廊】。'] },
  { n:3, name:'时光钟楼', recLv:16, tool:'watch', toolName:'⏱️时之怀表', boss:'boss3',
    map:CH3_MAP, start:CH3_START, revenge:CH3_REVENGE, spawns:CH3_SPAWNS,
    frags:CH3_FRAGS, npcs:CH3_NPCS, clues:CH3_CLUES, locks:CH3_LOCKS,
    chests:CH3_CHESTS, houses:CH3_HOUSES, shop:CH3_SHOP,
    puzzle:{ kind:'clock', rooms:CH3_CLOCK },
    bossTile:{ x:12, y:60 }, crystalTile:{ x:12, y:59 },
    hiddenBase:5, hiddenTool:'watch', hiddenToolName:'时之怀表',
    dex:['cog','bell','sand','flip','revenge','boss3'],
    dropCog:true,   // 只有钟楼的怪掉齿轮碎片（回第1章强化武器的料）
    bossTaunt:'嗒、嗒、嗒……\n你也迟到了。\n迟到的人，我不放过去。',
    hiddenLocked:'齿轮缝里好像塞着什么……\n手指抠不出来。',
    toolHint:'「塔里的齿轮缝里塞着东西。\n用怀表的链子能勾出来。」',
    gateHint:['一扇黄铜大门，正中间是个空的表盘。',
              '门纹丝不动——\n六层的钟室里应该有机关。'],
    elderWhere:'塔顶的时针幽灵守着第三颗水晶。',
    elderSide:'每层楼梯一左一右，\n横着走一遍才上得去。\n顺路把东西都捡了。',
    elderTease:['那是一座钟楼，六层高。',
                '塔里住进来一个东西，\n它把大钟弄停了。',
                '钟一停，塔里的人就不知道\n什么时候该做什么了。',
                '有人守着空盘子等饭，\n有人天亮了还在睡。'],
    travelBeats:['你顺着水晶指的方向往东走。',
                 '石板路变成了铺着木板的斜坡。',
                 '远处传来齿轮转动的声音，\n一下，又一下。',
                 '一座六层高的塔立在眼前 ——\n【时光钟楼】。',
                 '塔顶的大钟停着。\n指针不动。'] },
  { n:4, name:'砝码矿洞', recLv:21, tool:'scale', toolName:'⚖️砝码', boss:'boss4',
    map:CH4_MAP, start:CH4_START, revenge:CH4_REVENGE, spawns:CH4_SPAWNS,
    frags:CH4_FRAGS, npcs:CH4_NPCS, clues:CH4_CLUES, locks:CH4_LOCKS,
    chests:CH4_CHESTS, houses:CH4_HOUSES, shop:CH4_SHOP,
    puzzle:{ kind:'balance', rooms:CH4_BALANCE },
    bossTile:{ x:12, y:58 }, crystalTile:{ x:12, y:57 },
    hiddenBase:5, hiddenTool:'scale', hiddenToolName:'砝码',
    dex:['ore','cart','bat','echo','revenge','boss4'],
    dropSample:true,   // 小秤的委托：矿洞的怪掉矿石样本
    bossTaunt:'哼……你几斤几两，\n上秤我就知道。\n称不够的，过不去。',
    hiddenLocked:'岩缝里好像卡着什么……\n手掏不进去。',
    toolHint:'「矿洞的岩缝里卡着东西。\n用砝码的挂钩能勾出来。」',
    gateHint:['一扇石门，门上嵌着一架大铜天平。',
              '两边不平，门就不动——\n矿底的秤室里应该有机关。'],
    elderWhere:'矿底的称重河马守着第四颗水晶。',
    elderSide:'支洞有长有短，尽头才有东西。\n别嫌绕，绕到底才有货。',
    elderTease:['再往东是一片老矿洞。',
                '洞里住进来一头河马，\n什么都要过秤。',
                '它说称不够的东西不许运出去，\n矿就这么停了。'],
    travelBeats:['你顺着水晶往东走。',
                 '木板路变成了碎石坡。',
                 '空气里有铁锈味，\n远处传来矿车的咔嗒声。',
                 '一个黑黢黢的洞口张在山壁上 ——\n【砝码矿洞】。'] },
  { n:5, name:'尺寸长廊', recLv:26, tool:'ruler', toolName:'📏伸缩尺', boss:'boss5',
    map:CH5_MAP, start:CH5_START, revenge:CH5_REVENGE, spawns:CH5_SPAWNS,
    frags:CH5_FRAGS, npcs:CH5_NPCS, clues:CH5_CLUES, locks:CH5_LOCKS,
    chests:CH5_CHESTS, houses:CH5_HOUSES, shop:CH5_SHOP,
    puzzle:{ kind:'bridge', rooms:CH5_BRIDGE },
    bossTile:{ x:12, y:40 }, crystalTile:{ x:12, y:39 },
    hiddenBase:5, hiddenTool:'ruler', hiddenToolName:'伸缩尺',
    groundItem:{ quest:'owner', appearAt:'taken', becomes:'found', tint:0xf0d8a0,
                 msg:['地上有一把木尺。', '刻度只到 30，浅色木头，\n尾巴上有个缺口。',
                      '是谁丢的？\n拿回镇上问问吧。'] },
    dex:['tape','rod','coil','twin','revenge','boss5'],
    bossTaunt:'嘶——你有多长？\n量不够的，我不让过。',
    hiddenLocked:'砖缝里好像插着什么……\n手指伸不进去。',
    toolHint:'「长廊的砖缝里插着东西。\n用伸缩尺能撬出来。」',
    gateHint:['一扇石门，门上刻着一道长长的刻度。',
              '刻度对不上，门就不开——\n里面的搭桥室应该有机关。'],
    elderWhere:'廊子最里面的量尺蛇守着第五颗水晶。',
    elderSide:'廊子是一圈圈往里绕的。\n路只有一条，绕到底就是。',
    elderTease:['再往南是一条老长廊。',
                '住进去一条蛇，浑身是刻度。',
                '它量什么都嫌短，\n量不够的东西就不许过。',
                '现在廊子里的东西，\n谁也搬不出来。'],
    travelBeats:['你顺着水晶往南走。',
                 '碎石坡换成了平整的青砖。',
                 '砖上刻着一道道刻度，\n一直延伸到看不见的地方。',
                 '一条绕成圈的长廊铺在眼前 ——\n【尺寸长廊】。'] },
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
  module.exports = { ENEMIES, GEAR, SLOTS, SPELLS, spellsAt,
                     TOTAL_FRAGS, HOUSE_BLOCK, SEARCH_LOOT, rollLoot, BLOCK_CHARS, QSUBJ,
                     CHAPTERS, loadChapter, CH2_CANDY, CH2_RIDDLE, CH3_CLOCK, CH3_CLOCKLOCK, CH4_BALANCE, CH4_WEIGHLOCK, CH5_BRIDGE, CH5_ORDERLOCK,
                     fragGlobal, fragText, fragsOfChapter,
                     getQuestion, multQ, addsubQ, chineseQ, balanceQ, divideQ, remainderQ, liangciQ, numCN, CN };
  // 下面这些会被 loadChapter 整个换掉，所以必须导出成 getter。
  // 直接写进对象字面量的话导出的是加载那一刻的值 —— node 校验脚本里
  // loadChapter(1) 之后读到的还是第一章的地图，第二章等于没验。
  // （game.js 在浏览器里是当普通脚本读这些变量的，一直是对的，只有 node 侧受影响。）
  Object.defineProperties(module.exports, {
    MAP:          { get: () => MAP,          enumerable: true },
    MAPW:         { get: () => MAPW,         enumerable: true },
    MAPH:         { get: () => MAPH,         enumerable: true },
    SPAWNS:       { get: () => SPAWNS,       enumerable: true },
    PLAYER_START: { get: () => PLAYER_START, enumerable: true },
    REVENGE_TILE: { get: () => REVENGE_TILE, enumerable: true },
    FRAGMENTS:    { get: () => FRAGMENTS,    enumerable: true },
    NPCS:         { get: () => NPCS,         enumerable: true },
    CLUES:        { get: () => CLUES,        enumerable: true },
    CHEST_LOCKS:  { get: () => CHEST_LOCKS,  enumerable: true },
    CHESTS:       { get: () => CHESTS,       enumerable: true },
    HOUSES:       { get: () => HOUSES,       enumerable: true },
    SHOP_GEAR:    { get: () => SHOP_GEAR,    enumerable: true },
    SOKOBAN:      { get: () => SOKOBAN,      enumerable: true },
    CHAPTER:      { get: () => CHAPTER,      enumerable: true },
  });
}

// art.js — 代码生成像素贴图（占位美术，后续可整体替换成素材包）
// ponytail: 像素矩阵手绘占位图，正式美术阶段换 spritesheet 即可

const SPRITES = {
  hero_d: {
    p: { h:'#6b4423', s:'#f2c9a0', k:'#232323', b:'#3a6fd8', q:'#2a4a80', e:'#3a2a12' },
    r: [
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....ssssssss....",
      "....skssssks....",
      "....ssssssss....",
      ".....ssssss.....",
      "....bbbbbbbb....",
      "...bbbbbbbbbb...",
      "...sbbbbbbbbs...",
      "...sbbbbbbbbs...",
      "....bbbbbbbb....",
      "....qqqqqqqq....",
      "....qqq..qqq....",
      "....ee....ee....",
    ],
  },
  hero_u: {
    p: { h:'#6b4423', s:'#f2c9a0', b:'#3a6fd8', q:'#2a4a80', e:'#3a2a12' },
    r: [
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      ".....hhhhhh.....",
      "....bbbbbbbb....",
      "...bbbbbbbbbb...",
      "...sbbbbbbbbs...",
      "...sbbbbbbbbs...",
      "....bbbbbbbb....",
      "....qqqqqqqq....",
      "....qqq..qqq....",
      "....ee....ee....",
    ],
  },
  hero_s: {
    p: { h:'#6b4423', s:'#f2c9a0', k:'#232323', b:'#3a6fd8', q:'#2a4a80', e:'#3a2a12' },
    r: [
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....hsssssss....",
      "....hsssssks....",
      "....hsssssss....",
      ".....ssssss.....",
      "....bbbbbbbb....",
      "...bbbbbbbbbb...",
      "...bbbbbbbbss...",
      "...bbbbbbbbss...",
      "....bbbbbbbb....",
      "....qqqqqqqq....",
      "....qqq..qqq....",
      "....ee....ee....",
    ],
  },
  villager: {
    p: { h:'#cfcfcf', s:'#f2c9a0', k:'#232323', b:'#8a6d4a' },
    r: [
      "................",
      ".....hhhhhh.....",
      "....hhhhhhhh....",
      "....hhhhhhhh....",
      "....ssssssss....",
      "....skssssks....",
      "....ssssssss....",
      ".....ssssss.....",
      "....bbbbbbbb....",
      "...bbbbbbbbbb...",
      "...sbbbbbbbbs...",
      "...bbbbbbbbbb...",
      "...bbbbbbbbbb...",
      "...bbbbbbbbbb...",
      "...bbbbbbbbbb...",
      "................",
    ],
  },
  slime: {
    p: { g:'#4fc14f', l:'#8ee88e', d:'#2e8b2e', w:'#ffffff', k:'#111111' },
    r: [
      "................",
      "................",
      "................",
      ".....gggggg.....",
      "....llgggggg....",
      "...gggggggggg...",
      "..ggwwggggwwgg..",
      "..ggwkggggwkgg..",
      ".gggggggggggggg.",
      ".ggggggddgggggg.",
      "gggggggggggggggg",
      "gggggggggggggggg",
      "gggggggggggggggg",
      ".gggggggggggggg.",
      "..gggggggggggg..",
      "................",
    ],
  },
  imp: {
    p: { v:'#8e5bd8', d:'#5a3494', y:'#f4c542', w:'#ffffff', k:'#111111' },
    r: [
      "................",
      "..y..........y..",
      "..yvv......vvy..",
      "...vvvvvvvvvv...",
      "..vvvvvvvvvvvv..",
      "..vvwkvvvvwkvv..",
      "..vvvvvvvvvvvv..",
      "...vvvddddvvv...",
      "...vvvvvvvvvv...",
      "..v.vvvvvvvv.v..",
      "..v..vvvvvv..v..",
      ".....vvvvvv.....",
      "....vvv..vvv....",
      "....vv....vv....",
      "....dd....dd....",
      "................",
    ],
  },
  wraith: {
    p: { w:'#f5f0e6', k:'#232323', r:'#d84343' },
    r: [
      "................",
      "................",
      ".....wwwwww.....",
      "....wwwwwwww....",
      "...wwwwwwwwww...",
      "...wwkwwwwkww...",
      "...wwwwwwwwww...",
      "...wwrwwwwrww...",
      "...wwwrwwrwww...",
      "...wwwwrrwwww...",
      "...wwwrwwrwww...",
      "...wwrwwwwrww...",
      "...wwwwwwwwww...",
      "...w.ww..ww.w...",
      "................",
      "................",
    ],
  },
  revenge: {
    p: { w:'#5a5a66', k:'#ff4444', r:'#2b2b33' },
    r: [
      "................",
      "................",
      ".....wwwwww.....",
      "....wwwwwwww....",
      "...wwwwwwwwww...",
      "...wwkwwwwkww...",
      "...wwwwwwwwww...",
      "...wwrwwwwrww...",
      "...wwwrwwrwww...",
      "...wwwwrrwwww...",
      "...wwwrwwrwww...",
      "...wwrwwwwrww...",
      "...wwwwwwwwww...",
      "...w.ww..ww.w...",
      "................",
      "................",
    ],
  },
  dummy: {
    p: { t:'#a97b46', d:'#6e4c26', k:'#232323' },
    r: [
      "................",
      "................",
      "......tttt......",
      "......tttt......",
      "......tkkt......",
      "......tttt......",
      "...tttttttttt...",
      "...tttttttttt...",
      "......tttt......",
      "......tttt......",
      "......tttt......",
      "......tttt......",
      "....tttttttt....",
      "....dddddddd....",
      "................",
      "................",
    ],
  },
  spider: {
    p: { d:'#4a3a6a', l:'#7a5ec8', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "..d..........d..",
      "...d........d...",
      "....dddddddd....",
      "...dllllllllld..",
      "..dlwkllllwkld..",
      "..dllllllllllld.",
      ".dllllyyyylllld.",
      ".dlllllllllllld.",
      "..dlllllllllld..",
      "...dddddddddd...",
      "..d..d....d..d..",
      ".d...d....d...d.",
      "d....d....d....d",
      "................",
      "................",
    ],
  },
  owl: {
    p: { b:'#8a6a3a', l:'#c8a878', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "...bb......bb...",
      "...bbb....bbb...",
      "...bbbbbbbbbb...",
      "..bbllllllllbb..",
      "..blwwwwwwwwlb..",
      "..blwkwwwwkwlb..",
      "..bllwwyywwllb..",
      "..bllllyylllllb.",
      "..bbllllllllbb..",
      "...bbllllllbb...",
      "...bbbllllbbb...",
      "....bbbbbbbb....",
      ".....yy..yy.....",
      "................",
      "................",
    ],
  },
  // ---- 第三章：钟楼的三种怪 ----
  // 齿轮蜘蛛：身体就是一枚齿轮
  cog: {
    p: { m:'#8a8f9a', l:'#c2c8d4', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "....m..mm..m....",
      "...mmmmmmmmmm...",
      "..mmllllllllmm..",
      "..mllllllllllm..",
      "mmllwkllllwkllmm",
      "..mllllllllllm..",
      "..mlllyyyylllm..",
      "..mllllyyllllm..",
      "..mmllllllllmm..",
      "...mmmmmmmmmm...",
      "....m..mm..m....",
      "..m..m....m..m..",
      ".m...m....m...m.",
      "................",
      "................",
    ],
  },
  // 走时铜铃
  bell: {
    p: { b:'#c8a03a', d:'#8a6a1a', w:'#ffffff', k:'#111111', y:'#fff2a0' },
    r: [
      "................",
      ".......dd.......",
      "......dbbd......",
      ".....dbbbbd.....",
      "....dbbbbbbd....",
      "...dbbbbbbbbd...",
      "...dbwkbbwkbd...",
      "..dbbbbbbbbbbd..",
      "..dbbbyyyybbbd..",
      ".dbbbbbbbbbbbbd.",
      ".dbbbbbbbbbbbbd.",
      "ddddddddddddddd.",
      "................",
      "......dyyd......",
      "................",
      "................",
    ],
  },
  // 沙漏懒虫：细腰沙漏，睡眼
  sandw: {
    p: { s:'#e0c890', d:'#a8874a', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "..dddddddddddd..",
      "..dssssssssssd..",
      "..dswkssswksd...",
      "..dsssssssssd...",
      "...dsssyyssd....",
      "....dsssssd.....",
      ".....dsssd......",
      ".....dsssd......",
      "....dsyyysd.....",
      "...dsyyyyysd....",
      "..dsyyyyyyysd...",
      "..dsyyyyyyyysd..",
      "..dddddddddddd..",
      "................",
      "................",
    ],
  },
  // 颠倒摆：上下颠倒的钟摆，脸也是倒的（语文·反义词）
  flip: {
    p: { v:'#7a6ac8', l:'#a8a0e8', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "......vvvv......",
      ".....vvvvvv.....",
      "....vvvvvvvv....",
      "...vvllllllvv...",
      "...vllyyyyllv...",
      "..vvllllllllvv..",
      "..vllwkllwkllv..",
      "..vllllllllllv..",
      "..vvllllllllvv..",
      "...vvllllllvv...",
      "....vvvvvvvv....",
      ".....vvvvvv.....",
      "......vvvv......",
      ".......vv.......",
      "......yyyy......",
    ],
  },
  // ---- 第四章：矿洞的四种怪 ----
  // 矿石傀：一坨会走的矿石
  ore: {
    p: { r:'#7a6a58', l:'#9c8a70', y:'#c8a03a', w:'#ffffff', k:'#111111' },
    r: [
      "................",
      "....rrrrrrr.....",
      "...rrrrrrrrr....",
      "..rrllllllrrr...",
      "..rlllyyylllrr..",
      "..rllwkllwkllr..",
      "..rllllllllllr..",
      "..rllyylllyyllr.",
      "..rrllllllllrr..",
      "...rrrrrrrrrr...",
      "...rr..rr..rr...",
      "..rrr..rr..rrr..",
      "..rr...rr...rr..",
      ".rrr...rr...rrr.",
      "................",
      "................",
    ],
  },
  // 矿车鬼：一辆翻着的矿车
  cart: {
    p: { m:'#5e5048', b:'#8a7a5a', w:'#ffffff', k:'#111111', y:'#c8a03a' },
    r: [
      "................",
      "................",
      "..mmmmmmmmmmmm..",
      "..mbbbbbbbbbbm..",
      "..mbwkbbbbwkbm..",
      "..mbbbbbbbbbbm..",
      "..mbbyyyyyybbm..",
      "..mbbbbbbbbbbm..",
      "..mmmmmmmmmmmm..",
      "...m........m...",
      "..yyy......yyy..",
      ".yyyyy....yyyyy.",
      ".yyyyy....yyyyy.",
      "..yyy......yyy..",
      "................",
      "................",
    ],
  },
  // 秤砣蝠：挂着秤砣的蝙蝠
  bat: {
    p: { d:'#4a4a56', l:'#7a7a8a', w:'#ffffff', k:'#111111', y:'#c8a03a' },
    r: [
      "................",
      "d..............d",
      "dd............dd",
      "ddd..dddddd..ddd",
      "dddddllllllddddd",
      "ddddlwkllwkldddd",
      ".dddllllllllddd.",
      "..ddlllyyllldd..",
      "...ddllllllldd..",
      "....dddddddd....",
      "......dyyd......",
      ".....yyyyyy.....",
      ".....yyyyyy.....",
      "......yyyy......",
      "................",
      "................",
    ],
  },
  // 回声蝠：张着大嘴，声波纹（语文·多音字）
  echo: {
    p: { v:'#6a5a8a', l:'#9a8ac0', w:'#ffffff', k:'#111111', y:'#f4c542' },
    r: [
      "................",
      "v..............v",
      "vv...vvvvvv...vv",
      "vvv.vllllllv.vvv",
      "vvvvvlwkkwlvvvvv",
      ".vvvvllllllvvvv.",
      "..vvvlllllllvv..",
      "...vvyyyyyyvv...",
      "...vvykkkkyvv...",
      "....vyyyyyyv....",
      ".....vvvvvv.....",
      "..y.y......y.y..",
      ".y...y....y...y.",
      "y.....y..y.....y",
      "................",
      "................",
    ],
  },
  // 称重河马：坐在秤上的大河马
  boss4: {
    p: { g:'#a08ab0', d:'#6e5a80', w:'#ffffff', k:'#111111', y:'#c8a03a', c:'#cfc0dc' },
    r: [
      "....gggggggggg......",
      "...gggggggggggg.....",
      "..gggggggggggggg....",
      "..ggwkgggggwkggg....",
      "..gggggggggggggg....",
      "..ggcccccccccggg....",
      "..gccdddddddccgg....",
      "..gccdddddddccgg....",
      "..ggcccccccccggg....",
      "...gggggggggggg.....",
      "..gggggggggggggg....",
      ".gggggggggggggggg...",
      ".gggggggggggggggg...",
      ".ggg..gggggg..ggg...",
      ".ggg..gggggg..ggg...",
      ".ddd..dddddd..ddd...",
      "yyyyyyyyyyyyyyyyyy..",
      "yyyyyyyyyyyyyyyyyy..",
      "....yy........yy....",
      "....................",
    ],
  },
  // 时针幽灵：飘着的钟面，指针就是手
  boss3: {
    p: { g:'#9fb8e8', d:'#5a6ea8', w:'#ffffff', k:'#111111', y:'#f4c542', c:'#e8eeff' },
    r: [
      "......gggggggg......",
      "....gggggggggggg....",
      "...gggccccccccggg...",
      "..ggccccccccccccgg..",
      "..ggccwkccccwkccgg..",
      "..ggccccccccccccgg..",
      "..ggcccyycccccccgg..",
      "..ggcccyyyyccccggg..",
      "..ggcccyycccccggg...",
      "..ggccccccccccccgg..",
      "...gggcccccccccgg...",
      "....gggggggggggg....",
      "...dgggggggggggd....",
      "..dd.gggggggg..dd...",
      ".dd...gggggg....dd..",
      ".d.....gggg......d..",
      "........gg..........",
      "....................",
      "....................",
      "....................",
    ],
  },
  boss2: {
    p: { g:'#d88fb0', d:'#a05a7a', w:'#ffffff', k:'#111111', y:'#f4c542', c:'#f7e0a0' },
    r: [
      "......gggggggg......",
      ".....gggggggggg.....",
      "....gggggggggggg....",
      "....ggwkggggwkgg....",
      "....gggggggggggg....",
      "....ggggddddgggg....",
      ".....gggggggggg.....",
      "...cggggggggggggc...",
      "..cccggggggggggccc..",
      "..cccgggyyyygggccc..",
      "...ccggggyyggggcc...",
      "....gggggggggggg....",
      "....gggggggggggg....",
      "....ggg......ggg....",
      "....ggg......ggg....",
      "....ddd......ddd....",
      "....ddd......ddd....",
      "...dddd......dddd...",
      "....................",
      "....................",
    ],
  },
  boss: {
    p: { c:'#c89b5a', d:'#8a6534', y:'#f4c542', k:'#232323', r:'#b04040' },
    r: [
      ".yyy....................",
      ".ccc....................",
      "ccccc...................",
      "ckccc...................",
      "ccccc...................",
      ".cccc...................",
      "..ccc.....ccc....ccc....",
      "..ccc....ccccc..ccccc...",
      "..cccc..ccccccccccccc...",
      "..cccccccccccccccccccc..",
      "...ccccccccccccccccccc..",
      "...ccccrrrrcccccccccc...",
      "....cccrrrrccccccccc....",
      "....cccccccccccccccc....",
      "....ccc..ccc..ccc..cc...",
      "....ccc..ccc..ccc..cc...",
      "....dcc..dcc..dcc..dc...",
      "....dcc..dcc..dcc..dc...",
      "....ddd..ddd..ddd..dd...",
      "........................",
    ],
  },
};

const NPC_PALETTES = {
  npc_elder:    { h:'#cfcfcf', s:'#f2c9a0', k:'#232323', b:'#8a6d4a' },
  npc_merchant: { h:'#4a2f1a', s:'#f2c9a0', k:'#232323', b:'#d87f3a' },
  npc_teacher:  { h:'#26221e', s:'#f2c9a0', k:'#232323', b:'#6e58c8' },
  npc_smith:    { h:'#3a2a12', s:'#e0b088', k:'#232323', b:'#6b4a2c' },
  npc_aunt:     { h:'#4a2f1a', s:'#f2c9a0', k:'#232323', b:'#3f9b6d' },
  npc_girl:     { h:'#5a3a18', s:'#f7d6b0', k:'#232323', b:'#e07fa8' },
  npc_grandpa:  { h:'#e8e8e8', s:'#e8bf95', k:'#232323', b:'#5a6b8a' },
  npc_boy:      { h:'#241c14', s:'#f2c9a0', k:'#232323', b:'#d8b23a' },
  npc_traveler: { h:'#2a2a2a', s:'#d9a878', k:'#232323', b:'#8a7548' },
  // 开场那一大段说明拆给这几位了，所以他们得看着不一样
  npc_guard:    { h:'#33302b', s:'#e8bf95', k:'#232323', b:'#4a6ea8' },
  npc_kid:      { h:'#3a2412', s:'#f9dcbb', k:'#232323', b:'#7fc4d8' },
  npc_granny:   { h:'#dedede', s:'#efc6a2', k:'#232323', b:'#9a6ba8' },
  npc_girl2:    { h:'#1f1a14', s:'#f7d6b0', k:'#232323', b:'#c8563a' },
  npc_carpenter:{ h:'#4a3520', s:'#dda878', k:'#232323', b:'#6f8a4a' },
  npc_guard2:   { h:'#2b2b33', s:'#e2b892', k:'#232323', b:'#7a4a8a' },
  npc_miner:    { h:'#3a2f22', s:'#d8a878', k:'#232323', b:'#8a7a4a' },
};

function hexInt(hex) { return parseInt(hex.slice(1), 16); }

function texFromMatrix(scene, key, rows, pal) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = pal[rows[y][x]];
      if (c) { g.fillStyle(hexInt(c), 1); g.fillRect(x, y, 1, 1); }
    }
  }
  g.generateTexture(key, rows[0].length, rows.length);
  g.destroy();
}

function makeTile(scene, key, base, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(hexInt(base), 1); g.fillRect(0, 0, 16, 16);
  if (draw) draw(g);
  g.generateTexture(key, 16, 16);
  g.destroy();
}

function dots(g, color, pts) {
  g.fillStyle(hexInt(color), 1);
  pts.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
}

function makeTextures(scene) {
  for (const key in SPRITES) texFromMatrix(scene, key, SPRITES[key].r, SPRITES[key].p);
  for (const key in NPC_PALETTES) texFromMatrix(scene, key, SPRITES.villager.r, NPC_PALETTES[key]);

  makeTile(scene, 't_grass', '#58a05a', g => {
    dots(g, '#6cb56e', [[2,3],[7,1],[12,5],[4,9],[9,12],[14,8],[1,13],[6,6],[11,14],[13,2]]);
    dots(g, '#4c8c4e', [[5,4],[10,9],[3,12],[13,11]]);
  });
  makeTile(scene, 't_sand', '#e3c078', g => {
    dots(g, '#d0a95e', [[3,2],[8,5],[13,3],[5,10],[11,12],[1,7],[14,14],[7,13]]);
    dots(g, '#f0d494', [[6,3],[12,8],[2,11],[9,1]]);
  });
  makeTile(scene, 't_path', '#c2a06a', g => {
    dots(g, '#a88752', [[2,2],[9,4],[13,9],[4,12],[7,8],[11,14],[1,10]]);
  });
  makeTile(scene, 't_tree', '#58a05a', g => {
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(7, 9, 2, 6);
    g.fillStyle(hexInt('#2e7d3b'), 1); g.fillCircle(8, 6, 5.5);
    g.fillStyle(hexInt('#3f9b4d'), 1); g.fillCircle(6, 4.5, 2.5);
  });
  makeTile(scene, 't_cactus', '#e3c078', g => {
    g.fillStyle(hexInt('#3f9b47'), 1);
    g.fillRect(7, 3, 3, 11);
    g.fillRect(4, 6, 3, 2); g.fillRect(4, 3, 2, 4);
    g.fillRect(10, 8, 3, 2); g.fillRect(11, 5, 2, 4);
    g.fillStyle(hexInt('#2e7d36'), 1); g.fillRect(8, 4, 1, 9);
  });
  makeTile(scene, 't_rock', '#e3c078', g => {
    g.fillStyle(hexInt('#8b8b93'), 1); g.fillCircle(8, 9, 5.5);
    g.fillStyle(hexInt('#a8a8b0'), 1); g.fillCircle(6, 7, 2.5);
    g.fillStyle(hexInt('#6e6e76'), 1); g.fillRect(4, 12, 9, 2);
  });
  makeTile(scene, 't_fence', '#58a05a', g => {
    g.fillStyle(hexInt('#9a6b3a'), 1); g.fillRect(0, 5, 16, 2); g.fillRect(0, 10, 16, 2);
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(2, 3, 2, 11); g.fillRect(12, 3, 2, 11);
  });
  makeTile(scene, 't_roof', '#b0402f', g => {
    g.fillStyle(hexInt('#8c3325'), 1); g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1); g.fillRect(0, 15, 16, 1);
  });
  makeTile(scene, 't_wall', '#e9dcae', g => {
    g.fillStyle(hexInt('#c9b98a'), 1); g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
    g.fillStyle(hexInt('#7fb2d8'), 1); g.fillRect(5, 5, 6, 5);
    g.fillStyle(hexInt('#8a7548'), 1); g.fillRect(4, 4, 8, 1); g.fillRect(4, 4, 1, 7); g.fillRect(11, 4, 1, 7); g.fillRect(4, 10, 8, 1);
  });
  makeTile(scene, 't_door', '#e9dcae', g => {
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(4, 3, 8, 13);
    g.fillStyle(hexInt('#5e3a17'), 1); g.fillRect(4, 3, 8, 1);
    g.fillStyle(hexInt('#f4c542'), 1); g.fillRect(10, 9, 1, 1);
  });

  // ---- 宝箱 / 碎片 / 石门 / 迷宫 ----
  makeTile(scene, 't_chest', '#e3c078', g => {
    g.fillStyle(hexInt('#8a5a24'), 1); g.fillRect(2, 6, 12, 8);
    g.fillStyle(hexInt('#a9713a'), 1); g.fillRect(2, 4, 12, 3);
    g.fillStyle(hexInt('#f4c542'), 1); g.fillRect(7, 8, 2, 3);
    g.fillStyle(hexInt('#5e3a17'), 1); g.fillRect(2, 13, 12, 1);
  });
  makeTile(scene, 't_chest_open', '#e3c078', g => {
    g.fillStyle(hexInt('#a9713a'), 1); g.fillRect(2, 2, 12, 3);
    g.fillStyle(hexInt('#3a2410'), 1); g.fillRect(2, 7, 12, 7);
    g.fillStyle(hexInt('#8a5a24'), 1); g.fillRect(2, 13, 12, 1);
  });
  makeTile(scene, 't_gate', '#8b8b93', g => {
    g.fillStyle(hexInt('#6e6e76'), 1); g.fillRect(0, 0, 16, 16);
    g.fillStyle(hexInt('#57575e'), 1);
    g.fillRect(0, 5, 16, 1); g.fillRect(0, 10, 16, 1); g.fillRect(8, 0, 1, 16);
    g.fillStyle(hexInt('#f4c542'), 1); g.fillRect(7, 7, 3, 3);
  });
  makeTile(scene, 't_dungeon', '#e3c078', g => {
    g.fillStyle(hexInt('#4a4a52'), 1); g.fillRect(2, 2, 12, 14);
    g.fillStyle(hexInt('#14141a'), 1); g.fillRect(4, 6, 8, 10);
    g.fillStyle(hexInt('#6e6e76'), 1); g.fillRect(2, 2, 12, 2);
  });
  // ---- 第三章：钟楼（木地板 + 楼梯，和前两章的沙/石区分开）----
  makeTile(scene, 't_wood', '#9a7b4a', g => {
    g.fillStyle(hexInt('#7f6238'), 1); g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
    g.fillStyle(hexInt('#b08f5c'), 1); g.fillRect(0, 0, 16, 1); g.fillRect(0, 6, 16, 1);
    g.fillStyle(hexInt('#6e5430'), 1); g.fillRect(4, 0, 1, 5); g.fillRect(11, 6, 1, 5); g.fillRect(7, 12, 1, 4);
  });
  makeTile(scene, 't_stair', '#8a8f9a', g => {
    g.fillStyle(hexInt('#b6bcc8'), 1); g.fillRect(0, 1, 16, 3); g.fillRect(0, 7, 16, 3); g.fillRect(0, 13, 16, 3);
    g.fillStyle(hexInt('#6a6f7a'), 1); g.fillRect(0, 4, 16, 1); g.fillRect(0, 10, 16, 1);
  });

  // ---- 第四章：矿洞（岩壁 + 碎石地面）----
  makeTile(scene, 't_mwall', '#4a3f38', g => {
    g.fillStyle(hexInt('#5e5048'), 1); g.fillRect(1, 1, 6, 5); g.fillRect(9, 3, 6, 6); g.fillRect(2, 9, 5, 6);
    g.fillStyle(hexInt('#37302a'), 1); g.fillRect(0, 7, 16, 1); g.fillRect(8, 0, 1, 16);
    g.fillStyle(hexInt('#8a7a5a'), 1); g.fillRect(11, 11, 2, 2);   // 矿脉
  });
  makeTile(scene, 't_mfloor', '#7a6a58', g => {
    dots(g, '#93826c', [[2,3],[7,5],[12,2],[4,11],[10,13],[14,8]]);
    dots(g, '#5f5245', [[5,8],[9,9],[13,4],[3,14]]);
  });

  // 迷宫内部地砖
  makeTile(scene, 't_dfloor', '#6b6b78', g => {
    dots(g, '#7a7a88', [[3,3],[9,6],[13,11],[5,13],[11,2]]);
    g.fillStyle(hexInt('#5c5c68'), 1); g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
  });
  makeTile(scene, 't_dwall', '#3a3a44', g => {
    g.fillStyle(hexInt('#4a4a56'), 1); g.fillRect(1, 1, 14, 6); g.fillRect(1, 9, 14, 6);
  });

  // 记忆碎片（发光纸片）
  const f = scene.make.graphics({ x: 0, y: 0, add: false });
  f.fillStyle(hexInt('#fff2c0'), 1);
  f.fillRect(3, 2, 10, 12);
  f.fillStyle(hexInt('#d8c48a'), 1);
  f.fillRect(3, 2, 10, 1); f.fillRect(3, 13, 10, 1);
  f.fillStyle(hexInt('#8a7548'), 1);
  f.fillRect(5, 5, 6, 1); f.fillRect(5, 7, 6, 1); f.fillRect(5, 9, 4, 1);
  f.generateTexture('frag', 16, 16);
  f.destroy();

  // 传送阵（地上的符文圆阵，画成八边形，像素味比正圆好）
  const pz = scene.make.graphics({ x: 0, y: 0, add: false });
  pz.fillStyle(hexInt('#5ad1e8'), 1);
  pz.fillRect(6, 1, 4, 1); pz.fillRect(6, 14, 4, 1);
  pz.fillRect(1, 6, 1, 4); pz.fillRect(14, 6, 1, 4);
  pz.fillRect(3, 3, 2, 1); pz.fillRect(11, 3, 2, 1);
  pz.fillRect(3, 12, 2, 1); pz.fillRect(11, 12, 2, 1);
  pz.fillRect(2, 4, 1, 2); pz.fillRect(13, 4, 1, 2);
  pz.fillRect(2, 10, 1, 2); pz.fillRect(13, 10, 1, 2);
  pz.fillRect(4, 2, 2, 1); pz.fillRect(10, 2, 2, 1);
  pz.fillRect(4, 13, 2, 1); pz.fillRect(10, 13, 2, 1);
  pz.fillStyle(hexInt('#9beaf7'), 1);          // 内圈符文
  pz.fillRect(7, 4, 2, 1); pz.fillRect(5, 6, 1, 4); pz.fillRect(10, 6, 1, 4); pz.fillRect(7, 11, 2, 1);
  pz.fillStyle(hexInt('#ffe08a'), 1);          // 中心光点
  pz.fillRect(7, 7, 2, 2);
  pz.generateTexture('portal', 16, 16);
  pz.destroy();

  // 闪光点（隐藏处，需放大镜）
  const sp = scene.make.graphics({ x: 0, y: 0, add: false });
  sp.fillStyle(hexInt('#fff9d0'), 1);
  sp.fillRect(7, 3, 2, 10); sp.fillRect(3, 7, 10, 2);
  sp.fillStyle(hexInt('#ffe08a'), 1);
  sp.fillRect(6, 6, 4, 4);
  sp.generateTexture('sparkle', 16, 16);
  sp.destroy();

  // 推箱子的木箱
  const bx = scene.make.graphics({ x: 0, y: 0, add: false });
  bx.fillStyle(hexInt('#b5813f'), 1); bx.fillRect(0, 0, 16, 16);
  bx.fillStyle(hexInt('#8a5a24'), 1);
  bx.fillRect(0, 0, 16, 2); bx.fillRect(0, 14, 16, 2);
  bx.fillRect(0, 0, 2, 16); bx.fillRect(14, 0, 2, 16);
  bx.fillStyle(hexInt('#d9a761'), 1); bx.fillRect(3, 3, 10, 10);
  bx.generateTexture('crate', 16, 16);
  bx.destroy();

  // 答案凹槽
  const pl = scene.make.graphics({ x: 0, y: 0, add: false });
  pl.fillStyle(hexInt('#4a4a56'), 1); pl.fillRect(0, 0, 16, 16);
  pl.fillStyle(hexInt('#2a2a34'), 1); pl.fillRect(2, 2, 12, 12);
  pl.fillStyle(hexInt('#ffd76a'), 1);
  pl.fillRect(2, 2, 12, 1); pl.fillRect(2, 13, 12, 1);
  pl.fillRect(2, 2, 1, 12); pl.fillRect(13, 2, 1, 12);
  pl.generateTexture('plate', 16, 16);
  pl.destroy();

  // 放大镜（工具图标）
  const ln = scene.make.graphics({ x: 0, y: 0, add: false });
  ln.lineStyle(2, hexInt('#f4c542'), 1); ln.strokeCircle(7, 6, 4);
  ln.fillStyle(hexInt('#a8d8f0'), 0.7); ln.fillCircle(7, 6, 3);
  ln.fillStyle(hexInt('#8a5a24'), 1); ln.fillRect(9, 9, 2, 6);
  ln.generateTexture('lens', 16, 16);
  ln.destroy();

  // ---- 第二章：石回廊 ----
  makeTile(scene, 't_stone', '#9a9a8a', g => {
    g.fillStyle(hexInt('#8a8a7a'), 1);
    g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1);
    g.fillRect(0, 0, 1, 8); g.fillRect(8, 8, 1, 8);
    dots(g, '#a8a898', [[4,4],[12,12],[3,11],[13,3]]);
  });
  makeTile(scene, 't_swall', '#5a5a4e', g => {
    g.fillStyle(hexInt('#6e6e60'), 1); g.fillRect(1, 1, 14, 6); g.fillRect(1, 9, 14, 6);
    dots(g, '#4a4a40', [[3,4],[11,12]]);
  });
  makeTile(scene, 't_pillar', '#9a9a8a', g => {
    g.fillStyle(hexInt('#c8c8b8'), 1); g.fillRect(3, 1, 10, 14);
    g.fillStyle(hexInt('#8a8a7a'), 1);
    g.fillRect(3, 1, 10, 2); g.fillRect(3, 13, 10, 2);
    g.fillRect(6, 3, 1, 10); g.fillRect(9, 3, 1, 10);
  });
  makeTile(scene, 't_water', '#3a6fa8', g => {
    g.fillStyle(hexInt('#4a86c8'), 1); g.fillRect(0, 2, 16, 3); g.fillRect(0, 9, 16, 3);
    dots(g, '#7ab8e8', [[3,3],[11,10],[6,4],[13,11]]);
  });
  // 糖果（分糖机关用）
  const cd = scene.make.graphics({ x: 0, y: 0, add: false });
  cd.fillStyle(hexInt('#f06a8a'), 1); cd.fillCircle(8, 8, 5);
  cd.fillStyle(hexInt('#ffb0c4'), 1); cd.fillCircle(6, 6, 2);
  cd.fillStyle(hexInt('#c04a68'), 1); cd.fillRect(1, 7, 3, 2); cd.fillRect(12, 7, 3, 2);
  cd.generateTexture('candy', 16, 16);
  cd.destroy();
  // 盘子
  makeTile(scene, 't_plate2', '#6b6b78', g => {
    g.fillStyle(hexInt('#d8d8e0'), 1); g.fillCircle(8, 9, 6);
    g.fillStyle(hexInt('#f0f0f8'), 1); g.fillCircle(8, 9, 4);
    g.fillStyle(hexInt('#a8a8b8'), 1); g.fillRect(2, 12, 12, 1);
  });

  // ---- 室内 ----
  makeTile(scene, 't_floor', '#c8a878', g => {
    g.fillStyle(hexInt('#b89868'), 1);
    g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1);
    g.fillRect(0, 0, 1, 16); g.fillRect(8, 8, 1, 8);
    dots(g, '#d4b688', [[4,4],[12,12],[3,11]]);
  });
  makeTile(scene, 't_iwall', '#8a6a48', g => {
    g.fillStyle(hexInt('#6e5236'), 1);
    g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
    g.fillRect(5, 0, 1, 5); g.fillRect(11, 6, 1, 5);
  });
  makeTile(scene, 't_cabinet', '#c8a878', g => {
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(2, 2, 12, 13);
    g.fillStyle(hexInt('#9a6b3a'), 1); g.fillRect(3, 3, 10, 5); g.fillRect(3, 9, 10, 5);
    g.fillStyle(hexInt('#f4c542'), 1); g.fillRect(7, 6, 2, 1); g.fillRect(7, 12, 2, 1);
  });
  makeTile(scene, 't_table', '#c8a878', g => {
    g.fillStyle(hexInt('#9a6b3a'), 1); g.fillRect(1, 5, 14, 4);
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(3, 9, 2, 5); g.fillRect(11, 9, 2, 5);
  });
  makeTile(scene, 't_plant', '#c8a878', g => {
    g.fillStyle(hexInt('#a9713a'), 1); g.fillRect(5, 10, 6, 5);
    g.fillStyle(hexInt('#3f9b47'), 1); g.fillCircle(8, 6, 4);
    g.fillStyle(hexInt('#5cc45c'), 1); g.fillCircle(6, 5, 2);
  });
  makeTile(scene, 't_bed', '#c8a878', g => {
    g.fillStyle(hexInt('#7a4e22'), 1); g.fillRect(1, 3, 14, 11);
    g.fillStyle(hexInt('#e8e0d0'), 1); g.fillRect(2, 4, 12, 5);
    g.fillStyle(hexInt('#c05a5a'), 1); g.fillRect(2, 9, 12, 4);
  });
  makeTile(scene, 't_exit', '#c8a878', g => {
    g.fillStyle(hexInt('#5e3a17'), 1); g.fillRect(3, 1, 10, 14);
    g.fillStyle(hexInt('#3a2410'), 1); g.fillRect(4, 2, 8, 12);
    g.fillStyle(hexInt('#f4c542'), 1); g.fillRect(10, 8, 1, 2);
  });

  // 水晶（透明背景菱形）
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  for (let y = 1; y <= 14; y++) {
    const hw = y <= 7 ? y - 1 : 14 - y;
    g.fillStyle(hexInt('#5fe0e8'), 1);
    g.fillRect(8 - hw, y, Math.max(hw * 2, 1), 1);
  }
  g.fillStyle(hexInt('#c8f8fa'), 1); g.fillRect(6, 3, 2, 6);
  g.generateTexture('crystal', 16, 16);
  g.destroy();

  // 1x1 白像素（画血条等）
  const p = scene.make.graphics({ x: 0, y: 0, add: false });
  p.fillStyle(0xffffff, 1); p.fillRect(0, 0, 1, 1);
  p.generateTexture('px', 1, 1);
  p.destroy();
}

// mark_check.js — 头顶标记正确性检查
// 传话委托要来回跑三趟，标记必须每一步都指对人，否则孩子不知道该找谁
const { CHAPTERS } = require('./js/data.js');

// 复刻 World.npcMark 的判定
function npcMark(npc, id, GS) {
  const talked = (GS.talked || []).includes(GS.chapter + ':' + id);
  switch (npc.role) {
    case 'clue': return GS.clues.includes(npc.clue) ? null : '!';
    case 'lore': return GS.chapter === 1 ? (GS.clues.includes('c2d') ? null : '!') : (talked ? null : '!');
    case 'quest': {
      if (GS.chapter === 1) {
        const st = GS.quest.step;
        if (!st) return '!';
        if (st === 'back_girl') return '!';
        if (st === 'done') return null;
        return '?';
      }
      const st = GS.quest.dodo;
      if (!st) return '!';
      if (st === 'found') return '!';
      if (st === 'done') return null;
      return '?';
    }
    case 'chat': {
      if (GS.chapter === 1) {
        const st = GS.quest.step;
        if (st === 'ask_boy' || st === 'back_boy') return '!';
        if (st === 'back_girl') return '?';
      }
      return talked ? null : '!';
    }
    case 'elder':
      if (GS.flags.boss && GS.chapter + 1 < CHAPTERS.length) return '!';
      return talked ? null : '!';
    default: return null;
  }
}

let bad = 0;
const check = (label, ch, GS, want) => {
  const got = {};
  Object.entries(CHAPTERS[ch].npcs).forEach(([id, npc]) => {
    const m = npcMark(npc, id, GS);
    if (m) got[npc.name] = m;
  });
  const g = JSON.stringify(got), w = JSON.stringify(want);
  const ok = g === w;
  console.log(`  ${ok ? '✓' : '✗'} ${label}`);
  if (!ok) { console.log(`      期望 ${w}`); console.log(`      实际 ${g}`); bad++; }
};

console.log('=== 第2章 传话委托：标记要一步步指对人 ===\n');
const base = { chapter: 1, clues: [], quest: {}, talked: [], flags: {} };
const T = ['1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7', '1:8', '1:9'];
const allClues = ['c2a', 'c2b', 'c2c', 'c2d'];

check('刚到镇上（谁都没聊过）', 1, { ...base },
  { 账房总管: '!', 账房先生: '!', 卖糖的姐姐: '!', 小满: '!', 扫地的老人: '!', 阿力: '!', 迷路的货郎: '!' });
check('接了委托 → 该去找阿力', 1,
  { ...base, talked: T, clues: allClues, quest: { step: 'ask_boy' } }, { 小满: '?', 阿力: '!' });
check('阿力说完 → 该回去找小满', 1,
  { ...base, talked: T, clues: allClues, quest: { step: 'back_girl' } }, { 小满: '!', 阿力: '?' });
check('小满托话 → 再去找阿力', 1,
  { ...base, talked: T, clues: allClues, quest: { step: 'back_boy' } }, { 小满: '?', 阿力: '!' });
check('和好了 → 都不用管', 1,
  { ...base, talked: T, clues: allClues, quest: { step: 'done' } }, {});

console.log('\n=== 线索 NPC：问过就不再标 ===\n');
check('只问了账房先生', 1,
  { ...base, talked: T, clues: ['c2a'], quest: { step: 'done' } },
  { 卖糖的姐姐: '!', 扫地的老人: '!', 迷路的货郎: '!' });
check('三句话都问齐', 1,
  { ...base, talked: T, clues: allClues, quest: { step: 'done' } }, {});

console.log('\n=== 第1章 ===\n');
const b1 = { chapter: 0, clues: [], quest: {}, talked: [], flags: {} };
const T1 = ['0:1', '0:2', '0:3', '0:4', '0:5', '0:6', '0:7', '0:8', '0:9'];
const c1 = ['code1', 'code2', 'bridge'];
check('刚开局', 0, { ...b1 },
  { 村长: '!', 铁匠老王: '!', 卖水的婶婶: '!', 朵朵: '!', 守林的爷爷: '!', 石头: '!', 沙漠旅人: '!' });
check('接了朵朵的委托 → 等你去找', 0,
  { ...b1, talked: T1, clues: c1, quest: { dodo: 'taken' } }, { 朵朵: '?' });
check('捡到作业本 → 回去交', 0,
  { ...b1, talked: T1, clues: c1, quest: { dodo: 'found' } }, { 朵朵: '!' });
check('打完Boss → 长老指路下一章', 0,
  { ...b1, talked: T1, clues: [...c1, 'code3'], quest: { dodo: 'done' }, flags: { boss: true } },
  { 村长: '!' });

// 纯服务 NPC 永远不标
[0, 1].forEach(ch => Object.entries(CHAPTERS[ch].npcs).forEach(([id, npc]) => {
  if (npc.role === 'shop' || npc.role === 'teacher') {
    const m = npcMark(npc, id, { chapter: ch, clues: [], quest: {}, talked: [], flags: {} });
    if (m) { console.log(`✗ ${npc.name}（纯服务）不该有标记，却是 ${m}`); bad++; }
  }
}));

if (bad) { console.log(`\n✗ ${bad} 处标记不对`); process.exit(1); }
console.log('\n✅ 两章所有 NPC 的标记在各进度下都指对了人');

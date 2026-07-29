#!/bin/bash
# 把开发目录的改动同步到本仓库并发布到 GitHub Pages
# 用法: ./publish.sh "提交说明"
set -e

SRC=/Users/husw/demo/skills/xinGame        # 开发目录
DEST="$(cd "$(dirname "$0")" && pwd)"      # 本仓库
MSG="${1:-chore: 更新}"

# 只同步游戏文件和校验脚本，避免把开发目录里的其他东西带上来
# 校验脚本必须全部同步：漏掉哪个，那个关卡就一直跑的是旧版本
cp "$SRC/index.html" "$SRC/DESIGN.md" "$DEST/"
cp "$SRC"/*_check.js "$SRC"/*_sim.js "$SRC/stub.js" "$DEST/"
cp "$SRC"/js/*.js "$DEST/js/"

cd "$DEST"

# 版本号写进 version.json，index.html 固定不变。
# GitHub Pages 给 index.html 发 max-age=600，版本戳写在里面会跟着一起变旧，
# 玩家就得手动改 URL 才拿得到新版。放进单独的 json 并带时间戳去取，永远是新的。
STAMP=$(date +%Y%m%d-%H%M)
printf '{"v":"%s"}\n' "$STAMP" > version.json
echo "版本号 $STAMP"

# 发布前必须过校验
echo "--- 启动自检（能不能跑起来）---"
node boot_check.js > /dev/null || { echo "✗ boot_check.js 未通过：游戏起不来，已中止发布"; exit 1; }
echo "✓ 通过"
echo "--- 战斗流程校验（含GM模式）---"
node battle_check.js > /dev/null || { echo "✗ battle_check.js 未通过：战斗流程会卡住"; exit 1; }
echo "✓ 通过"
echo "--- 数值平衡校验 ---"
node balance_sim.js  > /dev/null || { echo "✗ balance_sim.js 未通过，已中止发布"; exit 1; }
echo "✓ 通过"
echo "--- 技能/智力/速度加成平衡校验 ---"
node skill_check.js > /dev/null || { echo "✗ skill_check.js 未通过：新机制打穿了等级墙"; exit 1; }
echo "✓ 通过"
echo "--- 谜题可解性校验 ---"
node puzzle_check.js > /dev/null || { echo "✗ puzzle_check.js 未通过，已中止发布"; exit 1; }
echo "✓ 通过"
echo "--- 头顶标记校验 ---"
node mark_check.js > /dev/null || { echo "✗ mark_check.js 未通过：任务标记指错人"; exit 1; }
echo "✓ 通过"
echo "--- Boss触发/章节往返校验 ---"
node chapter_check.js > /dev/null || { echo "✗ chapter_check.js 未通过：Boss打不着、死后挡路、或章节往返丢进度"; exit 1; }
echo "✓ 通过"
echo "--- 传送阵交互校验 ---"
node portal_check.js > /dev/null || { echo "✗ portal_check.js 未通过：传送阵会卡死或丢进度"; exit 1; }
echo "✓ 通过"
echo "--- 学科覆盖校验（每章都要有语文题）---"
node subject_check.js > /dev/null || { echo "✗ subject_check.js 未通过：有章节缺语文题，或学科判定不对"; exit 1; }
echo "✓ 通过"
echo "--- 章节多样性校验 ---"
node variety_check.js > /dev/null || { echo "✗ variety_check.js 未通过：新章节太像旧章节"; exit 1; }
echo "✓ 通过"

# 用 status --porcelain：git diff 看不到新增的未追踪文件
if [ -z "$(git status --porcelain)" ]; then
  echo "没有改动，无需发布。"
  exit 0
fi

git add -A
git status --short
git commit -q -m "$MSG

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push -q origin main

echo
echo "✅ 已发布，版本号 ${STAMP}（约 1 分钟后生效）"
echo "   https://husw725.github.io/xinGame/"
echo "   打开后看右下角，应该显示 v$STAMP"

#!/bin/bash
# 把开发目录的改动同步到本仓库并发布到 GitHub Pages
# 用法: ./publish.sh "提交说明"
set -e

SRC=/Users/husw/demo/skills/xinGame        # 开发目录
DEST="$(cd "$(dirname "$0")" && pwd)"      # 本仓库
MSG="${1:-chore: 更新}"

# 只同步游戏文件，避免把开发目录里的其他东西带上来
cp "$SRC/index.html" "$SRC/DESIGN.md" "$SRC/balance_sim.js" "$SRC/puzzle_check.js" "$DEST/"
cp "$SRC"/js/*.js "$DEST/js/"

cd "$DEST"

# 发布前必须过校验：这两处错了会卡死玩家
echo "--- 数值平衡校验 ---"
node balance_sim.js  > /dev/null || { echo "✗ balance_sim.js 未通过，已中止发布"; exit 1; }
echo "✓ 通过"
echo "--- 推箱子可解性校验 ---"
node puzzle_check.js > /dev/null || { echo "✗ puzzle_check.js 未通过，已中止发布"; exit 1; }
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
echo "✅ 已发布。约 1 分钟后生效："
echo "   https://husw725.github.io/xinGame/"

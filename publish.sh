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

# 打版本戳：浏览器会缓存 js，不加这个的话玩家可能一直跑旧版本
STAMP=$(date +%Y%m%d%H%M%S)
python3 - "$STAMP" <<'PYEOF'
import re, sys, pathlib
stamp = sys.argv[1]
p = pathlib.Path('index.html')
s = p.read_text()
s = re.sub(r'(src="js/(?:data|art|game)\.js)(\?v=[^"]*)?"', r'\1?v=' + stamp + '"', s)
p.write_text(s)
PYEOF
echo "版本戳 $STAMP"

# 发布前必须过校验：这两处错了会卡死玩家
echo "--- 数值平衡校验 ---"
node balance_sim.js  > /dev/null || { echo "✗ balance_sim.js 未通过，已中止发布"; exit 1; }
echo "✓ 通过"
echo "--- 谜题可解性校验 ---"
node puzzle_check.js > /dev/null || { echo "✗ puzzle_check.js 未通过，已中止发布"; exit 1; }
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
echo "✅ 已发布。约 1 分钟后生效："
echo "   https://husw725.github.io/xinGame/"

#!/usr/bin/env bash
#
# build.sh — 打包 Iris 扩展为可上传 Chrome Web Store 的干净 zip
#
# 用法：
#   ./build.sh            # 用 manifest.json 里的版本号命名输出
#   ./build.sh 1.9.2      # 强制指定版本号（会顺带校验与 manifest 是否一致）
#
# 特性：
#   - 固定文件清单，杜绝漏掉 importScripts 依赖（trackers/contentSafety/citationLowTrust）
#   - 打包前校验：所有待打包文件存在 + background.js 的 importScripts 依赖齐全
#   - 只打包运行所需文件，排除 docs/、源图、.DS_Store 等
#   - 校验失败立即中止，不产出半成品

set -euo pipefail

cd "$(dirname "$0")"

# ── 运行所需文件清单（manifest 引用 + importScripts 依赖 + popup 依赖）──────────
FILES=(
  manifest.json
  background.js
  content.js
  inject.js
  trackers.js
  contentSafety.js
  citationLowTrust.js
  citationSourceType.js
  i18n.js
  popup.html
  popup.css
  popup.js
  _locales
  icons/icon16.png
  icons/icon32.png
  icons/icon48.png
  icons/icon128.png
)

# ── 1. 读取/校验版本号 ─────────────────────────────────────────────────────────
MANIFEST_VER="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' manifest.json \
  | head -1 | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/')"

if [ -z "$MANIFEST_VER" ]; then
  echo "✗ 无法从 manifest.json 解析版本号" >&2
  exit 1
fi

VERSION="${1:-$MANIFEST_VER}"
if [ "$VERSION" != "$MANIFEST_VER" ]; then
  echo "✗ 指定版本 ($VERSION) 与 manifest.json ($MANIFEST_VER) 不一致，请先更新 manifest" >&2
  exit 1
fi

# ── 2. 校验所有待打包文件存在 ──────────────────────────────────────────────────
echo "→ 校验文件清单…"
MISSING=0
for f in "${FILES[@]}"; do
  if [ ! -e "$f" ]; then
    echo "  ✗ 缺失：$f" >&2
    MISSING=1
  fi
done
[ "$MISSING" -eq 0 ] || { echo "✗ 有文件缺失，已中止" >&2; exit 1; }

# ── 3. 校验 background.js 的 importScripts 依赖都在清单里 ──────────────────────
echo "→ 校验 importScripts 依赖…"
DEPS="$(grep -oE 'importScripts\([^)]*\)' background.js \
  | grep -oE '"[^"]+\.js"' | tr -d '"')"
for dep in $DEPS; do
  FOUND=0
  for f in "${FILES[@]}"; do
    [ "$f" = "$dep" ] && FOUND=1 && break
  done
  if [ "$FOUND" -eq 0 ]; then
    echo "  ✗ background.js 依赖 $dep，但不在打包清单中！" >&2
    exit 1
  fi
  echo "  ✓ $dep"
done

# ── 4. 校验 popup.html 引用的本地脚本都在清单里 ───────────────────────────────
echo "→ 校验 popup.html 脚本引用…"
SCRIPTS="$(grep -oE '<script[^>]*src="[^"]+"' popup.html \
  | grep -oE 'src="[^"]+"' | sed -E 's/src="([^"]+)"/\1/' | grep -vE '^https?://' || true)"
for s in $SCRIPTS; do
  FOUND=0
  for f in "${FILES[@]}"; do
    [ "$f" = "$s" ] && FOUND=1 && break
  done
  if [ "$FOUND" -eq 0 ]; then
    echo "  ✗ popup.html 引用 $s，但不在打包清单中！" >&2
    exit 1
  fi
  echo "  ✓ $s"
done

# ── 5. JS 语法快速检查（若有 node）────────────────────────────────────────────
if command -v node >/dev/null 2>&1; then
  echo "→ JS 语法检查…"
  for f in "${FILES[@]}"; do
    case "$f" in
      *.js)
        if ! node --check "$f" 2>/dev/null; then
          echo "  ✗ 语法错误：$f" >&2
          exit 1
        fi
        ;;
    esac
  done
  echo "  ✓ 全部通过"
fi

# ── 6. 打包 ────────────────────────────────────────────────────────────────────
OUT="iris-extension-v${VERSION}.zip"
rm -f "$OUT"
echo "→ 打包 $OUT …"
zip -rq "$OUT" "${FILES[@]}" -x "*.DS_Store"

echo ""
echo "✓ 完成：$OUT"
echo "  大小：$(du -h "$OUT" | cut -f1)"
echo "  文件数：$(unzip -l "$OUT" | tail -1 | awk '{print $2}')"

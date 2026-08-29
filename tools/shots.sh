#!/usr/bin/env bash
# Capture the locale layout proofs into .shots/.
#
# The dev server's /__shot endpoint (vite.config.js) writes a PNG from a
# data URL, which is right for a <canvas> and wrong for a whole page — a
# page has no toDataURL(). These captures are of pages, so they come from
# headless Chrome instead, into the same .shots/ directory and for the
# same reason: so a layout change is reviewable as a file someone can
# open, not as pixel probes.
#
#   npm run dev     (launch config "currents", port 5183)
#   bash tools/shots.sh [locale]
set -u
LOCALE="${1:-de}"
ROOT="$(cd "$(dirname "$0")/.." && pwd -W 2>/dev/null || cd "$(dirname "$0")/.." && pwd)"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="http://localhost:5183"

shot () { # shot <path> <w> <h> <name>
  "$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --virtual-time-budget=9000 \
    --window-size="$2,$3" \
    --screenshot="${ROOT}\\.shots\\$4" \
    "${BASE}$1" 2>&1 | tail -1
}

for page in ti playground; do
  shot "/${page}/?lang=${LOCALE}" 1440 900  "${page}-${LOCALE}-1440.png"
  shot "/${page}/?lang=${LOCALE}" 375  812  "${page}-${LOCALE}-375.png"
done
echo "captures written to .shots/"

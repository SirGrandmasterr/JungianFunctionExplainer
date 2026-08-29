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
UNIX_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Chrome is a native Windows binary and needs a native path for --screenshot.
WIN_ROOT="$(cygpath -w "$UNIX_ROOT" 2>/dev/null || echo "$UNIX_ROOT")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="http://localhost:5183"
mkdir -p "$UNIX_ROOT/.shots"
fails=0

shot () { # shot <path> <w> <h> <name>
  "$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --virtual-time-budget=9000 \
    --window-size="$2,$3" \
    --screenshot="${WIN_ROOT}\\.shots\\$4" \
    "${BASE}$1" >/dev/null 2>&1
  if [ -s "$UNIX_ROOT/.shots/$4" ]; then
    echo "  ok  $4  ($(wc -c < "$UNIX_ROOT/.shots/$4") bytes)"
  else
    echo "  FAILED  $4"; fails=$((fails + 1))
  fi
}

for page in ti playground; do
  shot "/${page}/?lang=${LOCALE}" 1440 900  "${page}-${LOCALE}-1440.png"
  shot "/${page}/?lang=${LOCALE}" 375  812  "${page}-${LOCALE}-375.png"
done

if [ "$fails" -gt 0 ]; then
  echo "shots.sh: $fails capture(s) failed — is the dev server up on ${BASE}?" >&2
  exit 1
fi
echo "captures written to .shots/"

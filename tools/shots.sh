#!/usr/bin/env bash
# Capture the locale layout proofs into .shots/.
#
# Wraps tools/shot.mjs, which drives Chrome over the DevTools Protocol so
# the CSS viewport is exactly what is asked for — see the note at the top
# of that file for why `chrome --screenshot --window-size` cannot be used
# for the narrow captures on Windows.
#
#   npm run dev            (launch config "currents", port 5183)
#   bash tools/shots.sh de
set -eu
LOCALE="${1:-de}"
BASE="http://localhost:5183"
HERE="$(cd "$(dirname "$0")" && pwd)"

for page in ti playground; do
  node "$HERE/shot.mjs" "${BASE}/${page}/?lang=${LOCALE}" 1440 900 "${page}-${LOCALE}-1440.png"
  node "$HERE/shot.mjs" "${BASE}/${page}/?lang=${LOCALE}" 375  812 "${page}-${LOCALE}-375.png"
done
echo "captures written to .shots/"

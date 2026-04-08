#!/usr/bin/env bash
# 從 Google Calendar 私有 iCal 網址下載 .ics 至站內 data/，供「查詢空房」頁面讀取。
# 部署前或定期執行：bash scripts/sync-calendar-ics.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="https://calendar.google.com/calendar/ical/e7c5el8ddnb4tj9dbk87hmen3g%40group.calendar.google.com/private-1b99f3d770a404f82f61db11e06c9958/basic.ics"
OUT="$ROOT/data/calendar-basic.ics"
curl -fsSL "$URL" -o "$OUT"
echo "Updated: $OUT ($(wc -c < "$OUT" | tr -d ' ') bytes)"

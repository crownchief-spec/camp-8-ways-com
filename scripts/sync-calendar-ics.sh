#!/usr/bin/env bash
# 從 Google Calendar 私有 iCal 網址下載 .ics 至站內 data/，供「查詢空房」頁面讀取。
# 合併：露營區（熱氣球房、雲朵房）＋露營車 兩本日曆。
# 部署前或定期執行：bash scripts/sync-calendar-ics.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/calendar-basic.ics"
TMPDIR="${TMPDIR:-/tmp}"
CAMP_ICS="$TMPDIR/camp-calendar-camp.ics"
RV_ICS="$TMPDIR/camp-calendar-rv.ics"

CAMP_URL="https://calendar.google.com/calendar/ical/e7c5el8ddnb4tj9dbk87hmen3g%40group.calendar.google.com/private-1b99f3d770a404f82f61db11e06c9958/basic.ics"
RV_URL="https://calendar.google.com/calendar/ical/al2upmt9aegl0gc9uk6dms17k4%40group.calendar.google.com/private-96c6b258d3838a040c762d5a412aa839/basic.ics"

merge_ics() {
  local out="$1"
  shift
  local -a sources=("$@")

  awk '/^BEGIN:VEVENT/{exit} {print}' "${sources[0]}" >"$out"

  for src in "${sources[@]}"; do
    awk '
      /^BEGIN:VEVENT/ { in_event=1 }
      in_event { print }
      /^END:VEVENT/ { in_event=0 }
    ' "$src" >>"$out"
  done

  printf '%s\n' "END:VCALENDAR" >>"$out"
}

curl -fsSL "$CAMP_URL" -o "$CAMP_ICS"
curl -fsSL "$RV_URL" -o "$RV_ICS"
merge_ics "$OUT" "$CAMP_ICS" "$RV_ICS"
echo "Updated: $OUT ($(wc -c <"$OUT" | tr -d ' ') bytes, camp + rv merged)"

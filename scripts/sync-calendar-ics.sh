#!/usr/bin/env bash
# 從環境變數指定的 Google Calendar 私有 iCal 網址下載 .ics 至站內 data/。
# 執行前須設定 JOYFOREST_CAMP_ICS_URL 與 JOYFOREST_RV_ICS_URL。
set -euo pipefail

: "${JOYFOREST_CAMP_ICS_URL:?Missing JOYFOREST_CAMP_ICS_URL}"
: "${JOYFOREST_RV_ICS_URL:?Missing JOYFOREST_RV_ICS_URL}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/calendar-basic.ics"
TASK_TMP_DIR="${TMPDIR:-/tmp}"
CAMP_ICS="$TASK_TMP_DIR/camp-calendar-camp.ics"
RV_ICS="$TASK_TMP_DIR/camp-calendar-rv.ics"

merge_ics() {
  local out="$1"
  local camp_src="$2"
  local rv_src="$3"

  awk '/^BEGIN:VEVENT/{exit} {print}' "$camp_src" >"$out"
  awk '
    /^BEGIN:VEVENT/ { in_event=1 }
    in_event { print }
    /^END:VEVENT/ { in_event=0 }
  ' "$camp_src" >>"$out"
  awk '
    /^BEGIN:VEVENT/ { in_event=1; print; next }
    in_event && /^END:VEVENT/ { print "X-JOYFOREST-TAG:rv"; print; in_event=0; next }
    in_event { print }
  ' "$rv_src" >>"$out"
  printf '%s\n' "END:VCALENDAR" >>"$out"
}

curl -fsSL "$JOYFOREST_CAMP_ICS_URL" -o "$CAMP_ICS"
curl -fsSL "$JOYFOREST_RV_ICS_URL" -o "$RV_ICS"
merge_ics "$OUT" "$CAMP_ICS" "$RV_ICS"
echo "Updated: $OUT ($(wc -c <"$OUT" | tr -d ' ') bytes, camp + rv merged)"

#!/usr/bin/env bash
# 從 Cloudflare Functions 的去識別化空房端點下載前台安全版 .ics。
# 私人 Google Calendar 網址只存放在 Cloudflare 密鑰，不再交給前台或 GitHub Actions。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/calendar-basic.ics"
TASK_TMP_DIR="${TMPDIR:-/tmp}"
TMP_ICS="$TASK_TMP_DIR/joyforest-public-calendar.ics"
PUBLIC_CALENDAR_URL="${JOYFOREST_PUBLIC_CALENDAR_URL:-https://camp.8-ways.com/api/public-calendar}"

curl -fsSL --retry 3 --retry-delay 5 "$PUBLIC_CALENDAR_URL" -o "$TMP_ICS"

grep -q '^BEGIN:VCALENDAR' "$TMP_ICS"
grep -q '^X-JOYFOREST-PUBLIC:1' "$TMP_ICS"
if grep -Eq '^(DESCRIPTION|LOCATION|ATTENDEE|ORGANIZER|CONTACT):' "$TMP_ICS"; then
  echo "Refusing to publish a calendar containing private fields." >&2
  exit 1
fi

mv "$TMP_ICS" "$OUT"
echo "Updated sanitized public calendar: $OUT ($(wc -c <"$OUT" | tr -d ' ') bytes)"

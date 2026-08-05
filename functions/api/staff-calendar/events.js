import { fetchCalendarSources } from "../../_lib/calendar-fetch.js";
import {
  getStaffDisplayRangeYmd,
  mergeAndParseCalendars
} from "../../_lib/ics-parser.js";
import { jsonResponse } from "../../_lib/staff-auth.js";

function isValidYmd(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map((n) => parseInt(n, 10));
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const { campIcs, rvIcs } = await fetchCalendarSources(env);
    const events = mergeAndParseCalendars(campIcs, rvIcs);
    const url = new URL(request.url);
    const fromParam = url.searchParams.get("from");
    const untilParam = url.searchParams.get("until");

    let fromYmd;
    let untilYmd;
    if (isValidYmd(fromParam) && isValidYmd(untilParam) && fromParam <= untilParam) {
      fromYmd = fromParam;
      untilYmd = untilParam;
    } else {
      // 預設：只顯示入住日 昨天 ～ 今天起一個月內
      ({ fromYmd, untilYmd } = getStaffDisplayRangeYmd());
    }

    let filtered = events.filter(
      (ev) => ev.checkInYmd >= fromYmd && ev.checkInYmd <= untilYmd
    );

    const room = url.searchParams.get("room");

    if (room && room !== "all") {
      filtered = filtered.filter((ev) => ev.roomTags.indexOf(room) !== -1);
    }

    return jsonResponse({
      ok: true,
      fetchedAt: new Date().toISOString(),
      fromYmd,
      untilYmd,
      count: filtered.length,
      events: filtered
    });
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "無法載入行事曆資料，請稍後再試。",
        detail: err instanceof Error ? err.message : String(err)
      },
      502
    );
  }
}

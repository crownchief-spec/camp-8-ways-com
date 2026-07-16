import { fetchCalendarSources } from "../../_lib/calendar-fetch.js";
import {
  getYesterdayYmdTaipei,
  mergeAndParseCalendars
} from "../../_lib/ics-parser.js";
import { jsonResponse } from "../../_lib/staff-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const { campIcs, rvIcs } = await fetchCalendarSources(env);
    const events = mergeAndParseCalendars(campIcs, rvIcs);
    const fromYmd = getYesterdayYmdTaipei();

    // 只顯示入住日從昨天起的項目
    let filtered = events.filter((ev) => ev.checkInYmd >= fromYmd);

    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const room = url.searchParams.get("room");

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      filtered = filtered.filter((ev) => ev.checkInYm === month);
    }

    if (room && room !== "all") {
      filtered = filtered.filter((ev) => ev.roomTags.indexOf(room) !== -1);
    }

    return jsonResponse({
      ok: true,
      fetchedAt: new Date().toISOString(),
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

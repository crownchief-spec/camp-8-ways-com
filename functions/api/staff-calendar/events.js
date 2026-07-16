import { fetchCalendarSources } from "../../_lib/calendar-fetch.js";
import {
  getStaffDisplayRangeYmd,
  mergeAndParseCalendars
} from "../../_lib/ics-parser.js";
import { jsonResponse } from "../../_lib/staff-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const { campIcs, rvIcs } = await fetchCalendarSources(env);
    const events = mergeAndParseCalendars(campIcs, rvIcs);
    const { fromYmd, untilYmd } = getStaffDisplayRangeYmd();

    // 只顯示入住日：昨天 ～ 今天起一個月內
    let filtered = events.filter(
      (ev) => ev.checkInYmd >= fromYmd && ev.checkInYmd <= untilYmd
    );

    const url = new URL(request.url);
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

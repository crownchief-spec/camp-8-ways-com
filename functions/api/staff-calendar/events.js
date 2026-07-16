import { fetchCalendarSources } from "../../_lib/calendar-fetch.js";
import { mergeAndParseCalendars } from "../../_lib/ics-parser.js";
import { jsonResponse, requireStaffSession } from "../../_lib/staff-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const authenticated = await requireStaffSession(request, env);
  if (!authenticated) {
    return jsonResponse({ ok: false, error: "未登入或 session 已過期。" }, 401);
  }

  try {
    const { campIcs, rvIcs } = await fetchCalendarSources(env);
    const events = mergeAndParseCalendars(campIcs, rvIcs);

    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const room = url.searchParams.get("room");

    let filtered = events;

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

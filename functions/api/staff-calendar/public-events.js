import {
  fetchCalendarSources,
  fetchLiveCalendarSources
} from "../../_lib/calendar-fetch.js";
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

function toPublicStaffEvent(event, index) {
  const roomTags = event.roomTags.filter((tag) => ["cloud", "balloon", "rv"].includes(tag));
  const roomLabels = roomTags.map((tag) => ({
    cloud: "雲朵房",
    balloon: "熱氣球房",
    rv: "露營車"
  })[tag]);
  const guestCountsByRoom = {};
  for (const tag of roomTags) {
    const count = event.guestCountsByRoom?.[tag];
    if (Number.isInteger(count)) guestCountsByRoom[tag] = count;
  }

  return {
    id: `staff-${event.checkInYmd}-${roomTags.join("-")}-${index}`,
    roomTags,
    roomLabels,
    roomLabel: roomLabels.join("＋"),
    summary: event.summary || `已預訂 ${roomLabels.join("＋")}`,
    guestCount: Number.isInteger(event.guestCount) ? event.guestCount : null,
    guestCountsByRoom,
    checkInDate: event.checkInDate,
    checkInTime: event.checkInTime,
    checkOutDate: event.checkOutDate,
    checkOutTime: event.checkOutTime,
    nights: event.nights,
    stayStatus: event.stayStatus,
    isAllDay: event.isAllDay,
    hasStartTime: event.hasStartTime,
    hasEndTime: event.hasEndTime,
    checkInSort: event.checkInSort,
    checkInYmd: event.checkInYmd,
    checkOutYmd: event.checkOutYmd,
    checkInYm: event.checkInYm
  };
}

async function fetchSharedStaffSources(env) {
  try {
    return { ...(await fetchLiveCalendarSources(env)), source: "live" };
  } catch (error) {
    console.error("Shared staff calendar live fetch failed; using safe snapshot", error);
    return { ...(await fetchCalendarSources(env)), source: "snapshot" };
  }
}

export async function onRequestGet(context) {
  try {
    const { campIcs, rvIcs, source } = await fetchSharedStaffSources(context.env);
    const events = mergeAndParseCalendars(campIcs, rvIcs);
    const url = new URL(context.request.url);
    const fromParam = url.searchParams.get("from");
    const untilParam = url.searchParams.get("until");

    let fromYmd;
    let untilYmd;
    if (isValidYmd(fromParam) && isValidYmd(untilParam) && fromParam <= untilParam) {
      fromYmd = fromParam;
      untilYmd = untilParam;
    } else {
      ({ fromYmd, untilYmd } = getStaffDisplayRangeYmd());
    }

    let filtered = events.filter(
      (ev) => ev.checkInYmd >= fromYmd && ev.checkInYmd <= untilYmd
    );

    const room = url.searchParams.get("room");
    if (room && room !== "all") {
      filtered = filtered.filter((ev) => ev.roomTags.indexOf(room) !== -1);
    }

    return jsonResponse(
      {
        ok: true,
        fetchedAt: new Date().toISOString(),
        fromYmd,
        untilYmd,
        source,
        count: filtered.length,
        events: filtered.map(toPublicStaffEvent)
      },
      200,
      { "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet" }
    );
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "無法載入行事曆資料，請稍後再試。",
        detail: err instanceof Error ? err.message : String(err)
      },
      502,
      { "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet" }
    );
  }
}

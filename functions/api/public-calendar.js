import {
  fetchLiveCalendarSources,
  fetchPublicSnapshot
} from "../_lib/calendar-fetch.js";
import { buildPublicAvailabilityIcs } from "../_lib/public-calendar.js";

const headers = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
  "X-Content-Type-Options": "nosniff"
};

export async function onRequestGet({ env, request }) {
  const liveRefresh = new URL(request.url).searchParams.get("source") === "live";
  try {
    if (!liveRefresh) {
      return new Response(await fetchPublicSnapshot(env), { headers });
    }

    const { campIcs, rvIcs } = await fetchLiveCalendarSources(env);
    return new Response(buildPublicAvailabilityIcs({ campIcs, rvIcs }), {
      headers: {
        ...headers,
        "Cache-Control": "no-store",
        "X-Joyforest-Live-Refresh": "1"
      }
    });
  } catch (error) {
    console.error("Public availability calendar refresh failed", error);
    return new Response("Calendar temporarily unavailable.\n", {
      status: 503,
      headers: {
        ...headers,
        "Cache-Control": "no-store",
        "X-Joyforest-Live-Refresh": liveRefresh ? "0" : "not-requested"
      }
    });
  }
}

import { fetchCalendarSources } from "../_lib/calendar-fetch.js";
import { buildPublicAvailabilityIcs } from "../_lib/public-calendar.js";

const headers = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
  "X-Content-Type-Options": "nosniff"
};

export async function onRequestGet({ env }) {
  try {
    const { campIcs, rvIcs } = await fetchCalendarSources(env);
    const calendar = buildPublicAvailabilityIcs({ campIcs, rvIcs });
    return new Response(calendar, { headers });
  } catch (error) {
    console.error("Public availability calendar refresh failed", error);
    return new Response("Calendar temporarily unavailable.\n", {
      status: 503,
      headers: { ...headers, "Cache-Control": "no-store" }
    });
  }
}

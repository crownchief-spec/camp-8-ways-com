import { fetchRvCalendarSource } from "../_lib/calendar-fetch.js";
import { buildPublicCampervanAvailability } from "../_lib/campervan-availability.js";

const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Expires: "0",
  "Access-Control-Allow-Origin": "https://van.joyforest.tw",
  Vary: "Origin",
  "X-Content-Type-Options": "nosniff"
};

export async function onRequestGet({ env }) {
  try {
    const rvIcs = await fetchRvCalendarSource(env);
    const payload = buildPublicCampervanAvailability(rvIcs);
    payload.fetchedAt = new Date().toISOString();
    return new Response(JSON.stringify(payload), { headers: responseHeaders });
  } catch (error) {
    console.error("Public campervan availability refresh failed", error);
    return new Response(JSON.stringify({ error: "availability_refresh_failed" }), {
      status: 503,
      headers: responseHeaders
    });
  }
}

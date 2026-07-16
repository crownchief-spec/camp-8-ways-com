const DEFAULT_CAMP_URL =
  "https://calendar.google.com/calendar/ical/e7c5el8ddnb4tj9dbk87hmen3g%40group.calendar.google.com/private-1b99f3d770a404f82f61db11e06c9958/basic.ics";
const DEFAULT_RV_URL =
  "https://calendar.google.com/calendar/ical/al2upmt9aegl0gc9uk6dms17k4%40group.calendar.google.com/private-96c6b258d3838a040c762d5a412aa839/basic.ics";

export async function fetchCalendarSources(env) {
  const campUrl = env.JOYFOREST_CAMP_ICS_URL || DEFAULT_CAMP_URL;
  const rvUrl = env.JOYFOREST_RV_ICS_URL || DEFAULT_RV_URL;

  const [campRes, rvRes] = await Promise.all([
    fetch(campUrl, { cf: { cacheTtl: 0, cacheEverything: false } }),
    fetch(rvUrl, { cf: { cacheTtl: 0, cacheEverything: false } })
  ]);

  if (!campRes.ok) {
    throw new Error(`Camp calendar fetch failed: HTTP ${campRes.status}`);
  }
  if (!rvRes.ok) {
    throw new Error(`RV calendar fetch failed: HTTP ${rvRes.status}`);
  }

  return {
    campIcs: await campRes.text(),
    rvIcs: await rvRes.text()
  };
}

const PUBLIC_CALENDAR_FALLBACK_URL = "https://camp.8-ways.com/data/calendar-basic.ics";
const PUBLIC_CALENDAR_ASSET_URL = "https://assets.local/data/calendar-basic.ics";

async function fetchCalendar(url, label) {
  const response = await fetch(url, {
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  if (!response.ok) throw new Error(`${label} calendar fetch failed: HTTP ${response.status}`);
  return response.text();
}

async function readCalendarResponse(response, label) {
  if (!response.ok) throw new Error(`${label} calendar fetch failed: HTTP ${response.status}`);
  return response.text();
}

export async function fetchPublicSnapshot(env) {
  let ics;
  if (env?.ASSETS?.fetch) {
    const response = await env.ASSETS.fetch(PUBLIC_CALENDAR_ASSET_URL);
    ics = await readCalendarResponse(response, "Bundled public fallback");
  } else {
    ics = await fetchCalendar(PUBLIC_CALENDAR_FALLBACK_URL, "Public fallback");
  }
  if (!ics.includes("X-JOYFOREST-PUBLIC:1")) {
    throw new Error("Public fallback calendar is not a sanitized snapshot");
  }
  return ics;
}

export async function fetchRvCalendarSource(env) {
  const rvUrl = env?.JOYFOREST_RV_ICS_URL;
  if (rvUrl) {
    try {
      return await fetchCalendar(rvUrl, "RV");
    } catch (error) {
      console.warn("RV calendar unavailable; using sanitized public snapshot", error);
    }
  }
  return fetchPublicSnapshot(env);
}

export async function fetchCalendarSources(env) {
  const campUrl = env?.JOYFOREST_CAMP_ICS_URL;
  const rvUrl = env?.JOYFOREST_RV_ICS_URL;
  if (campUrl && rvUrl) {
    try {
      const [campIcs, rvIcs] = await Promise.all([
        fetchCalendar(campUrl, "Camp"),
        fetchCalendar(rvUrl, "RV")
      ]);
      return { campIcs, rvIcs };
    } catch (error) {
      console.warn("Private calendars unavailable; using sanitized public snapshot", error);
    }
  }

  const snapshot = await fetchPublicSnapshot(env);
  return { campIcs: snapshot, rvIcs: snapshot };
}

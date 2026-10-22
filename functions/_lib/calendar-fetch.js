const PUBLIC_CALENDAR_FALLBACK_URL = "https://camp.8-ways.com/data/calendar-basic.ics";
const PUBLIC_CALENDAR_ASSET_URL = "https://assets.local/data/calendar-basic.ics";

function requiredCalendarUrl(env, name) {
  const value = env?.[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

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
  return fetchPublicSnapshot(env);
}

export async function fetchCalendarSources(env) {
  const snapshot = await fetchPublicSnapshot(env);
  // 兩個欄位保持舊有呼叫介面；剖析器會辨識這是同一份已分類的公開快照，
  // 不會重複剖析，也不會把露營區事件誤當成露營車。
  return { campIcs: snapshot, rvIcs: snapshot };
}

export async function fetchLiveCalendarSources(env) {
  const campUrl = requiredCalendarUrl(env, "JOYFOREST_CAMP_ICS_URL");
  const rvUrl = requiredCalendarUrl(env, "JOYFOREST_RV_ICS_URL");
  const [campIcs, rvIcs] = await Promise.all([
    fetchCalendar(campUrl, "Camp"),
    fetchCalendar(rvUrl, "RV")
  ]);
  return { campIcs, rvIcs };
}

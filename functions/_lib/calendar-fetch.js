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

export async function fetchRvCalendarSource(env) {
  return fetchCalendar(requiredCalendarUrl(env, "JOYFOREST_RV_ICS_URL"), "RV");
}

export async function fetchCalendarSources(env) {
  const campUrl = requiredCalendarUrl(env, "JOYFOREST_CAMP_ICS_URL");
  const rvUrl = requiredCalendarUrl(env, "JOYFOREST_RV_ICS_URL");
  const [campIcs, rvIcs] = await Promise.all([
    fetchCalendar(campUrl, "Camp"),
    fetchCalendar(rvUrl, "RV")
  ]);
  return { campIcs, rvIcs };
}

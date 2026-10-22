import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchCalendarSources,
  fetchLiveCalendarSources,
  fetchPublicSnapshot,
  fetchRvCalendarSource
} from "../functions/_lib/calendar-fetch.js";

const snapshot = [
  "BEGIN:VCALENDAR",
  "X-JOYFOREST-PUBLIC:1",
  "BEGIN:VEVENT",
  "DTSTART;VALUE=DATE:20261101",
  "DTEND;VALUE=DATE:20261102",
  "SUMMARY:已預訂 露營車",
  "X-JOYFOREST-TAG:rv",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

function assetEnv() {
  return {
    ASSETS: {
      async fetch(url) {
        assert.equal(new URL(url).pathname, "/data/calendar-basic.ics");
        return new Response(snapshot, { status: 200 });
      }
    }
  };
}

test("uses the bundled sanitized snapshot when calendar bindings are absent", async () => {
  const env = assetEnv();
  assert.equal(await fetchPublicSnapshot(env), snapshot);
  assert.equal(await fetchRvCalendarSource(env), snapshot);
  assert.deepEqual(await fetchCalendarSources(env), { campIcs: snapshot, rvIcs: snapshot });
});

test("customer lookups stay on the bundled snapshot even when live bindings exist", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("customer lookup must not fetch a private calendar");
  };

  try {
    const env = {
      ...assetEnv(),
      JOYFOREST_CAMP_ICS_URL: "https://calendar.invalid/camp.ics",
      JOYFOREST_RV_ICS_URL: "https://calendar.invalid/rv.ics"
    };
    assert.deepEqual(await fetchCalendarSources(env), { campIcs: snapshot, rvIcs: snapshot });
    await assert.rejects(() => fetchLiveCalendarSources(env), /customer lookup must not fetch/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createSessionToken } from "../functions/_lib/staff-auth.js";
import { onRequestGet } from "../functions/api/staff-calendar/events.js";

test("internal revenue and staff pages use the authenticated full-calendar endpoint", async () => {
  const files = [
    "../assets/js/admin-revenue.js",
    "../assets/js/staff-availability.js"
  ];
  for (const path of files) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /\/staff-calendar\/events/);
    assert.doesNotMatch(source, /\/staff-calendar\/public-events/);
  }

  const pages = [
    "../pages/admin-revenue.html",
    "../pages/staff-availability.html"
  ];
  for (const path of pages) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /admin-gate\.js/);
  }
});

function calendar(summary, description, tag) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${tag}-test`,
    "DTSTART;VALUE=DATE:20261024",
    "DTEND;VALUE=DATE:20261025",
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `X-JOYFOREST-TAG:${tag}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

test("staff calendar rejects requests without a valid admin session", async () => {
  const response = await onRequestGet({
    request: new Request("https://camp.test/api/staff-calendar/events"),
    env: { STAFF_AVAILABILITY_PASSWORD: "test-password" }
  });
  assert.equal(response.status, 401);
});

test("authenticated staff calendar reads full live calendars for revenue data", async () => {
  const originalFetch = globalThis.fetch;
  const env = {
    STAFF_AVAILABILITY_PASSWORD: "test-password",
    JOYFOREST_CAMP_ICS_URL: "https://calendar.test/camp.ics",
    JOYFOREST_RV_ICS_URL: "https://calendar.test/rv.ics"
  };
  const campIcs = calendar("熱氣球測試訂房", "總金額：5800", "balloon");
  const rvIcs = calendar("露營車測試訂單", "總租金：11800", "rv");
  globalThis.fetch = async (url) => {
    if (String(url) === env.JOYFOREST_CAMP_ICS_URL) return new Response(campIcs);
    if (String(url) === env.JOYFOREST_RV_ICS_URL) return new Response(rvIcs);
    return new Response("not found", { status: 404 });
  };

  try {
    const token = await createSessionToken(env);
    const response = await onRequestGet({
      request: new Request(
        "https://camp.test/api/staff-calendar/events?from=2026-02-01&until=2026-12-31",
        { headers: { Cookie: `staff_availability_session=${encodeURIComponent(token)}` } }
      ),
      env
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.count, 2);
    assert.deepEqual(
      data.events.map((event) => event.statedPrice).sort((a, b) => a - b),
      [5800, 11800]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

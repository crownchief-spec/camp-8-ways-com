import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createSessionToken } from "../functions/_lib/staff-auth.js";
import { onRequestGet } from "../functions/api/staff-calendar/events.js";
import { onRequestGet as onPublicRequestGet } from "../functions/api/staff-calendar/public-events.js";

test("revenue stays private while the staff schedule uses sanitized public data", async () => {
  const revenueScript = await readFile(new URL("../assets/js/admin-revenue.js", import.meta.url), "utf8");
  assert.match(revenueScript, /\/staff-calendar\/events/);
  assert.doesNotMatch(revenueScript, /\/staff-calendar\/public-events/);

  const staffScript = await readFile(new URL("../assets/js/staff-availability.js", import.meta.url), "utf8");
  assert.match(staffScript, /\/staff-calendar\/public-events/);
  assert.doesNotMatch(staffScript, /\/staff-calendar\/events/);
  assert.doesNotMatch(staffScript, /requireAuth|clearLocalSession/);
  assert.match(staffScript, /人數未填/);

  const revenuePage = await readFile(new URL("../pages/admin-revenue.html", import.meta.url), "utf8");
  const staffPage = await readFile(new URL("../pages/staff-availability.html", import.meta.url), "utf8");
  assert.match(revenuePage, /admin-gate\.js/);
  assert.doesNotMatch(staffPage, /admin-gate\.js/);
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

test("shared staff calendar keeps original titles and counts but strips private detail fields", async () => {
  const originalFetch = globalThis.fetch;
  const env = {
    JOYFOREST_CAMP_ICS_URL: "https://calendar.test/camp.ics",
    JOYFOREST_RV_ICS_URL: "https://calendar.test/rv.ics"
  };
  const campIcs = calendar(
    "熱氣球房四人 Agoda N A O M I S A",
    "電話 0912-345-678；總金額 5800",
    "balloon"
  );
  const rvIcs = calendar("露營車測試訂單", "電話 0988-765-432", "rv");
  globalThis.fetch = async (url) => {
    if (String(url) === env.JOYFOREST_CAMP_ICS_URL) return new Response(campIcs);
    if (String(url) === env.JOYFOREST_RV_ICS_URL) return new Response(rvIcs);
    return new Response("not found", { status: 404 });
  };

  try {
    const response = await onPublicRequestGet({
      request: new Request(
        "https://camp.test/api/staff-calendar/public-events?from=2026-10-24&until=2026-10-24"
      ),
      env
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    const event = data.events.find((item) => item.roomTags.includes("balloon"));
    assert.equal(data.source, "live");
    assert.equal(event.summary, "熱氣球房四人 Agoda N A O M I S A");
    assert.equal(event.guestCount, 4);
    assert.deepEqual(event.guestCountsByRoom, { balloon: 4 });
    assert.doesNotMatch(event.id, /balloon-test/);
    for (const field of ["description", "comment", "location", "statedPrice", "bookingSource"]) {
      assert.equal(Object.hasOwn(event, field), false);
    }
    assert.doesNotMatch(JSON.stringify(data), /0912|0988|5800/);
  } finally {
    globalThis.fetch = originalFetch;
  }
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

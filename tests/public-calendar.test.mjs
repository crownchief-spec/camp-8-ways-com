import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicAvailabilityIcs } from "../functions/_lib/public-calendar.js";

const campIcs = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "UID:private-camp-id@example.com",
  "DTSTART;VALUE=DATE:20261108",
  "DTEND;VALUE=DATE:20261110",
  "SUMMARY:熱氣球房 王小明 0912-345-678",
  "DESCRIPTION:身分證字號 A123456789\\n住宿費 5800",
  "LOCATION:私人住址",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

const rvIcs = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "UID:private-rv-id@example.com",
  "DTSTART;VALUE=DATE:20261112",
  "DTEND;VALUE=DATE:20261115",
  "SUMMARY:露營車 李小華",
  "DESCRIPTION:電話 0988-765-432",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

test("public availability calendar keeps only dates, room types and status", () => {
  const publicIcs = buildPublicAvailabilityIcs({
    campIcs,
    rvIcs,
    now: new Date("2026-10-18T00:00:00+08:00")
  });

  assert.match(publicIcs, /X-JOYFOREST-PUBLIC:1/);
  assert.match(publicIcs, /SUMMARY:已預訂 熱氣球房/);
  assert.match(publicIcs, /SUMMARY:已預訂 露營車/);
  assert.doesNotMatch(publicIcs, /王小明|李小華|0912|0988|A123456789|私人住址|5800/);
  assert.doesNotMatch(publicIcs, /^(DESCRIPTION|LOCATION|ATTENDEE|ORGANIZER|CONTACT):/m);
});

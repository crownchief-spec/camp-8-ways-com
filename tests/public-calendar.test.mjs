import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicAvailabilityIcs } from "../functions/_lib/public-calendar.js";
import { mergeAndParseCalendars } from "../functions/_lib/ics-parser.js";

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

test("public calendar output is stable when Google changes event order", () => {
  const eventA = [
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261108",
    "DTEND;VALUE=DATE:20261109",
    "SUMMARY:熱氣球房 A",
    "END:VEVENT"
  ].join("\r\n");
  const eventB = [
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261110",
    "DTEND;VALUE=DATE:20261111",
    "SUMMARY:雲朵房 B",
    "END:VEVENT"
  ].join("\r\n");
  const wrap = (events) => ["BEGIN:VCALENDAR", ...events, "END:VCALENDAR"].join("\r\n");
  const args = { rvIcs: "BEGIN:VCALENDAR\r\nEND:VCALENDAR", now: new Date("2026-10-18T00:00:00+08:00") };

  const first = buildPublicAvailabilityIcs({ ...args, campIcs: wrap([eventA, eventB, eventA]) });
  const second = buildPublicAvailabilityIcs({ ...args, campIcs: wrap([eventB, eventA]) });

  assert.equal(first, second);
  assert.equal((first.match(/SUMMARY:已預訂 熱氣球房/g) || []).length, 1);
});

test("room counts stay separate and negated package text does not occupy both rooms", () => {
  const twoRooms = [
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261026",
    "DTEND;VALUE=DATE:20261027",
    "SUMMARY:雲朵房2、熱氣球房2",
    "END:VEVENT"
  ].join("\r\n");
  const cloudOnly = [
    "BEGIN:VEVENT",
    "DTSTART;VALUE=DATE:20261027",
    "DTEND;VALUE=DATE:20261028",
    "SUMMARY:雲朵房包區沒包場，兩個人",
    "END:VEVENT"
  ].join("\r\n");
  const source = ["BEGIN:VCALENDAR", twoRooms, cloudOnly, "END:VCALENDAR"].join("\r\n");
  const publicIcs = buildPublicAvailabilityIcs({
    campIcs: source,
    rvIcs: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
    now: new Date("2026-10-26T00:00:00+08:00")
  });
  const events = mergeAndParseCalendars(publicIcs, publicIcs);
  const oct26 = events.find((event) => event.checkInYmd === "2026-10-26");
  const oct27 = events.find((event) => event.checkInYmd === "2026-10-27");

  assert.deepEqual(oct26.roomTags.sort(), ["balloon", "cloud"]);
  assert.deepEqual(oct26.guestCountsByRoom, { balloon: 2, cloud: 2 });
  assert.equal(oct26.guestCount, 4);
  assert.deepEqual(oct27.roomTags, ["cloud"]);
  assert.deepEqual(oct27.guestCountsByRoom, { cloud: 2 });
  assert.equal(oct27.guestCount, 2);
  assert.doesNotMatch(publicIcs, /沒包場/);
});

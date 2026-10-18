import { buildPublicCampervanAvailability } from "./campervan-availability.js";
import { mergeAndParseCalendars } from "./ics-parser.js";

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function addDays(value, amount) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount, 12)).toISOString().slice(0, 10);
}

function toIcsDate(value) {
  return String(value || "").replaceAll("-", "");
}

function roomLabel(tags) {
  const labels = [];
  if (tags.includes("balloon")) labels.push("熱氣球房");
  if (tags.includes("cloud")) labels.push("雲朵房");
  if (tags.includes("rv")) labels.push("露營車");
  return labels.join("＋");
}

function eventLines({ id, startDate, endDate, tags, state = "booked" }) {
  const prefix = state === "waitlist" ? "？候補" : state === "unavailable" ? "暫不開放" : "已預訂";
  const summary = `${prefix} ${roomLabel(tags)}`;
  return [
    "BEGIN:VEVENT",
    `UID:${id}@joyforest-public`,
    `DTSTART;VALUE=DATE:${toIcsDate(startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(endDate)}`,
    `SUMMARY:${summary}`,
    ...tags.map((tag) => `X-JOYFOREST-TAG:${tag}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT"
  ];
}

function publicRange(now) {
  const today = taipeiDateFormatter.format(now);
  return {
    min: addDays(today, -370),
    max: addDays(today, 1460)
  };
}

function inRange(startDate, endDate, range) {
  return startDate < range.max && endDate > range.min;
}

function safeEndDate(startDate, endDate) {
  return endDate && endDate > startDate ? endDate : addDays(startDate, 1);
}

function buildHeader() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Joyforest//Public Availability//ZH",
    "X-WR-CALNAME:Joyforest 空房狀態",
    "X-WR-TIMEZONE:Asia/Taipei",
    "X-JOYFOREST-PUBLIC:1"
  ];
}

function finish(lines) {
  return `${[...lines, "END:VCALENDAR"].join("\r\n")}\r\n`;
}

/**
 * 將私人 Google 日曆轉為前台安全版本，只保留日期、房型與空房狀態。
 * 不輸出姓名、電話、身分證字號、備註、地點、原始 UID 或金額。
 */
export function buildPublicAvailabilityIcs({ campIcs, rvIcs, now = new Date() }) {
  const range = publicRange(now);
  const lines = buildHeader();
  const campEvents = mergeAndParseCalendars(campIcs, "");
  let index = 0;

  for (const event of campEvents) {
    const tags = event.roomTags.filter((tag) => tag === "balloon" || tag === "cloud");
    if (!tags.length || /^[？?]/.test(String(event.summary || "").trim())) continue;
    const endDate = safeEndDate(event.checkInYmd, event.checkOutYmd);
    if (!inRange(event.checkInYmd, endDate, range)) continue;
    lines.push(...eventLines({
      id: `camp-${event.checkInYmd}-${endDate}-${tags.join("-")}-${index++}`,
      startDate: event.checkInYmd,
      endDate,
      tags
    }));
  }

  const rv = buildPublicCampervanAvailability(rvIcs, now);
  for (const [state, dates] of [
    ["booked", rv.bookedDates],
    ["unavailable", rv.unavailableDates],
    ["waitlist", rv.waitlistDates]
  ]) {
    for (const date of dates) {
      if (!inRange(date, addDays(date, 1), range)) continue;
      lines.push(...eventLines({
        id: `rv-${state}-${date}`,
        startDate: date,
        endDate: addDays(date, 1),
        tags: ["rv"],
        state
      }));
    }
  }

  return finish(lines);
}

/** 只供一次性清理舊的合併檔案；仍只輸出日期與房型。 */
export function sanitizeLegacyCombinedIcs(ics, now = new Date()) {
  const range = publicRange(now);
  const lines = buildHeader();
  const events = mergeAndParseCalendars(ics, "");
  let index = 0;

  for (const event of events) {
    const tags = event.roomTags.filter((tag) => ["balloon", "cloud", "rv"].includes(tag));
    if (!tags.length || /^[？?]/.test(String(event.summary || "").trim())) continue;
    const endDate = safeEndDate(event.checkInYmd, event.checkOutYmd);
    if (!inRange(event.checkInYmd, endDate, range)) continue;
    lines.push(...eventLines({
      id: `legacy-${event.checkInYmd}-${endDate}-${tags.join("-")}-${index++}`,
      startDate: event.checkInYmd,
      endDate,
      tags
    }));
  }

  return finish(lines);
}

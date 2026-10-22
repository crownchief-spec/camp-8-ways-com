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

function unfoldIcs(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\n[\t ]/g, "");
}

function eventBlocks(ics) {
  const blocks = [];
  const input = unfoldIcs(ics);
  const pattern = /BEGIN:VEVENT\n([\s\S]*?)\nEND:VEVENT/g;
  let match;
  while ((match = pattern.exec(input))) blocks.push(match[1]);
  return blocks;
}

function propertyValues(block, name) {
  const prefix = `${name.toUpperCase()}`;
  const values = [];
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).split(";", 1)[0].toUpperCase();
    if (key === prefix) values.push(line.slice(colon + 1));
  }
  return values;
}

function firstProperty(block, name) {
  return propertyValues(block, name)[0] || "";
}

function propertyDate(block, name) {
  const match = firstProperty(block, name).match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function campTags(block) {
  const text = [
    firstProperty(block, "SUMMARY"),
    firstProperty(block, "DESCRIPTION")
  ].join("\n");
  const tags = new Set(propertyValues(block, "X-JOYFOREST-TAG"));
  if (text.includes("包場")) {
    tags.add("balloon");
    tags.add("cloud");
  }
  if (text.includes("熱氣球")) tags.add("balloon");
  if (text.includes("雲朵")) tags.add("cloud");
  return [...tags].filter((tag) => tag === "balloon" || tag === "cloud");
}

function expandDates(startDate, endDate) {
  if (!startDate) return [];
  const end = safeEndDate(startDate, endDate);
  const dates = [];
  for (let cursor = startDate; cursor < end; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

function classifyRvBlock(block, dates) {
  const title = firstProperty(block, "SUMMARY").trim();
  const text = [
    title,
    firstProperty(block, "DESCRIPTION"),
    firstProperty(block, "COMMENT")
  ].filter(Boolean).join("\n");
  const hasCampervanWord = /露營車|camper\s*van|campervan|\brv\b/i.test(text);
  const isPending = /^[？?]/.test(title);
  const isExplicitBlackout = /不可預訂|不可预约|停租|暫停出租|暂停出租|停止出租|自用不外租/i.test(text);
  const isRoutineReminder = /驗車|验车|車檢|车检|檢查|检查|整理|清潔|清洁|洗車|洗车|維修|维修|保養|保养|整備|整备|收納|收纳|補給|补给|加油|換油|换油|設備檢查|设备检查/i.test(title);
  const isUnrelatedTravel = !hasCampervanWord && /酒店|飯店|饭店|旅館|旅馆|住宿|機票|机票|航班|出國|出国|石垣島|石垣岛|日本旅遊|日本旅游/i.test(title);

  if (isExplicitBlackout) return "unavailable";
  if (isRoutineReminder || isUnrelatedTravel) return "ignore";
  if (isPending) return "waitlist";
  if (hasCampervanWord || dates.length >= 2) return "booked";
  return "ignore";
}

function collectRvDates(rvIcs, today) {
  const isPublicSnapshot = unfoldIcs(rvIcs).includes("X-JOYFOREST-PUBLIC:1");
  const states = {
    booked: new Set(),
    unavailable: new Set(),
    waitlist: new Set()
  };

  for (const block of eventBlocks(rvIcs)) {
    if (isPublicSnapshot && !propertyValues(block, "X-JOYFOREST-TAG").includes("rv")) continue;
    const dates = expandDates(propertyDate(block, "DTSTART"), propertyDate(block, "DTEND"))
      .filter((date) => date >= today);
    if (!dates.length) continue;
    const state = classifyRvBlock(block, dates);
    if (!states[state]) continue;
    for (const date of dates) states[state].add(date);
  }

  for (const date of states.unavailable) {
    states.booked.delete(date);
    states.waitlist.delete(date);
  }
  for (const date of states.booked) states.waitlist.delete(date);
  return states;
}

/**
 * 將私人 Google 日曆轉為前台安全版本，只保留日期、房型與空房狀態。
 * 不輸出姓名、電話、身分證字號、備註、地點、原始 UID 或金額。
 */
export function buildPublicAvailabilityIcs({ campIcs, rvIcs, now = new Date() }) {
  const range = publicRange(now);
  const lines = buildHeader();
  const campRanges = new Map();

  // 這條路徑會在 Cloudflare Worker 內處理完整 Google Calendar。
  // 只擷取公開檔期必要欄位，避免逐筆 Intl/客戶資料剖析導致 CPU 1102。
  for (const block of eventBlocks(campIcs)) {
    const summary = firstProperty(block, "SUMMARY").trim();
    const tags = campTags(block);
    const startDate = propertyDate(block, "DTSTART");
    if (!startDate || !tags.length || /^[？?]/.test(summary)) continue;
    const endDate = safeEndDate(startDate, propertyDate(block, "DTEND"));
    if (!inRange(startDate, endDate, range)) continue;
    tags.sort();
    const key = `${startDate}|${endDate}|${tags.join("-")}`;
    campRanges.set(key, { startDate, endDate, tags });
  }

  for (const [key, event] of [...campRanges].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(...eventLines({
      id: `camp-${key.replaceAll("|", "-")}`,
      startDate: event.startDate,
      endDate: event.endDate,
      tags: event.tags
    }));
  }

  const rvStates = collectRvDates(rvIcs, taipeiDateFormatter.format(now));
  for (const state of ["booked", "unavailable", "waitlist"]) {
    for (const date of [...rvStates[state]].sort()) {
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

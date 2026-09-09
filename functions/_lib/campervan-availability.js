import { mergeAndParseCalendars } from "./ics-parser.js";

const taipeiDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount, 12)).toISOString().slice(0, 10);
}

function expandEventDates(event) {
  const start = event.checkInYmd;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "")) return [];
  const end = /^\d{4}-\d{2}-\d{2}$/.test(event.checkOutYmd || "") ? event.checkOutYmd : addDays(start, 1);
  const lastDate = end > start ? addDays(end, -1) : start;
  const dates = [];
  for (let cursor = start; cursor <= lastDate; cursor = addDays(cursor, 1)) dates.push(cursor);
  return dates;
}

function classifyEvent(event, dates) {
  const title = (event.summary || "").trim();
  const text = [title, event.description, event.comment].filter(Boolean).join("\n");
  const hasCampervanWord = /露營車|camper\s*van|campervan|\brv\b/i.test(text);
  const isPending = /^[？?]/.test(title);
  const isExplicitBlackout = /不可預訂|不可预约|停租|暫停出租|暂停出租|停止出租|自用不外租/i.test(text);
  // 只有「標題本身」是整理、清潔、驗車等才視為不佔檔提醒。
  // 客人預訂的備註常會包含清潔或整備交付內容，不可因此忽略整筆行程。
  const isRoutineReminder = /驗車|验车|車檢|车检|檢查|检查|整理|清潔|清洁|洗車|洗车|維修|维修|保養|保养|整備|整备|收納|收纳|補給|补给|加油|換油|换油|設備檢查|设备检查/i.test(title);
  const isUnrelatedTravel = !hasCampervanWord && /酒店|飯店|饭店|旅館|旅馆|住宿|機票|机票|航班|出國|出国|石垣島|石垣岛|日本旅遊|日本旅游/i.test(title);

  if (isExplicitBlackout) return "unavailable";
  if (isRoutineReminder || isUnrelatedTravel) return "ignore";
  if (isPending) return "waitlist";
  if (hasCampervanWord || dates.length >= 2) return "booked";
  return "ignore";
}

export function buildPublicCampervanAvailability(rvIcs, now = new Date()) {
  const today = taipeiDateFormatter.format(now);
  const events = mergeAndParseCalendars("", rvIcs).filter((event) => event.roomTags.includes("rv"));
  const bookedDates = new Set();
  const waitlistDates = new Set();
  const unavailableDates = new Set();

  for (const event of events) {
    const dates = expandEventDates(event).filter((date) => date >= today);
    if (!dates.length) continue;
    const status = classifyEvent(event, dates);
    const target = status === "booked"
      ? bookedDates
      : status === "waitlist"
        ? waitlistDates
        : status === "unavailable"
          ? unavailableDates
          : null;
    if (!target) continue;
    for (const date of dates) target.add(date);
  }

  for (const date of unavailableDates) {
    bookedDates.delete(date);
    waitlistDates.delete(date);
  }
  for (const date of bookedDates) waitlistDates.delete(date);

  return {
    calendar: "露營車",
    timeZone: "Asia/Taipei",
    bookedDates: [...bookedDates].sort(),
    waitlistDates: [...waitlistDates].sort(),
    unavailableDates: [...unavailableDates].sort()
  };
}

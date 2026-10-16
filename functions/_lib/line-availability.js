import { buildPublicCampervanAvailability } from "./campervan-availability.js";
import { fetchCalendarSources } from "./calendar-fetch.js";
import { mergeAndParseCalendars } from "./ics-parser.js";

const MAX_RANGE_DAYS = 31;

function isValidYmd(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function addDays(value, amount) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount, 12)).toISOString().slice(0, 10);
}

function dateRange(startDate, endDate) {
  const dates = [];
  for (let cursor = startDate; cursor < endDate && dates.length <= MAX_RANGE_DAYS; cursor = addDays(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

function normalizeRange(startDate, endDate) {
  if (!isValidYmd(startDate)) return { error: "start_date_invalid" };
  const normalizedEnd = endDate || addDays(startDate, 1);
  if (!isValidYmd(normalizedEnd) || normalizedEnd <= startDate) return { error: "end_date_invalid" };
  const dates = dateRange(startDate, normalizedEnd);
  if (!dates.length || dates.length > MAX_RANGE_DAYS) return { error: "date_range_too_long" };
  return { startDate, endDate: normalizedEnd, dates };
}

function overlaps(event, startDate, endDate) {
  const eventStart = event.checkInYmd;
  let eventEnd = event.checkOutYmd;
  if (!eventEnd || eventEnd <= eventStart) eventEnd = addDays(eventStart, 1);
  return eventStart < endDate && eventEnd > startDate;
}

function campsiteRoomStatus(events, room, startDate, endDate) {
  const relevant = events.filter(
    (event) => event.roomTags.includes(room) && overlaps(event, startDate, endDate)
  );
  if (!relevant.length) return "available";

  const titles = relevant.map((event) => String(event.summary || "").trim());
  const combined = relevant
    .map((event) => [event.summary, event.description, event.comment].filter(Boolean).join("\n"))
    .join("\n");
  if (/不可預訂|不可预约|停租|暫停出租|暂停出租|停止出租|自用不外租/i.test(combined)) {
    return "unavailable";
  }
  if (titles.every((title) => /^[？?]/.test(title))) return "provisional";
  return "booked";
}

export function buildAvailabilityResult({ service, room, startDate, endDate, campIcs, rvIcs }) {
  const range = normalizeRange(startDate, endDate);
  if (range.error) {
    return {
      ok: false,
      error: range.error,
      instruction: "請客人提供有效的完整日期，格式為 YYYY-MM-DD。"
    };
  }

  if (service === "campervan") {
    const publicStatus = buildPublicCampervanAvailability(rvIcs);
    const booked = new Set(publicStatus.bookedDates);
    const waitlist = new Set(publicStatus.waitlistDates);
    const unavailable = new Set(publicStatus.unavailableDates);
    let status = "calendar_clear";
    if (range.dates.some((date) => unavailable.has(date))) status = "unavailable";
    else if (range.dates.some((date) => booked.has(date))) status = "booked";
    else if (range.dates.some((date) => waitlist.has(date))) status = "waitlist";

    return {
      ok: true,
      service,
      startDate: range.startDate,
      endDate: range.endDate,
      status,
      publicAvailabilityUrl: "https://van.joyforest.tw/pages/availability",
      note: "結果只含日期狀態，不含任何客人名稱或行事曆私人內容。"
    };
  }

  const events = mergeAndParseCalendars(campIcs, "");
  const selectedRooms = room === "balloon" || room === "cloud" ? [room] : ["balloon", "cloud"];
  const roomStatus = Object.fromEntries(
    selectedRooms.map((roomId) => [
      roomId,
      campsiteRoomStatus(events, roomId, range.startDate, range.endDate)
    ])
  );
  return {
    ok: true,
    service: "campsite",
    startDate: range.startDate,
    endDate: range.endDate,
    roomStatus,
    availabilityUrl: "https://camp.8-ways.com/pages/availability.html",
    note: "結果只含房型日期狀態，不含任何客人名稱或行事曆私人內容。"
  };
}

export async function checkAvailability(env, args) {
  const { campIcs, rvIcs } = await fetchCalendarSources(env);
  return buildAvailabilityResult({
    service: args.service,
    room: args.room,
    startDate: args.start_date,
    endDate: args.end_date,
    campIcs,
    rvIcs
  });
}

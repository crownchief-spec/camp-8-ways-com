import { buildPublicCampervanAvailability } from "./campervan-availability.js";
import { fetchCalendarSources } from "./calendar-fetch.js";
import { mergeAndParseCalendars } from "./ics-parser.js";

const MAX_RANGE_DAYS = 31;
const CAMPERVAN_AVAILABILITY_URL = "https://van.joyforest.tw/pages/availability";
const CAMPSITE_AVAILABILITY_URL = "https://camp.8-ways.com/pages/availability.html";

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

function diffDays(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  return Math.round(
    (Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) /
      86400000
  );
}

function taipeiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function toYmd(year, month, day) {
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isValidYmd(value) ? value : null;
}

function inferFirstYear(month, day, today) {
  const currentYear = Number(today.slice(0, 4));
  const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return monthDay < today.slice(5) ? currentYear + 1 : currentYear;
}

function normalizeDateToken(token, today, previousDate = null) {
  const explicitYear = token.year ? Number(token.year) : null;
  const month = Number(token.month);
  const day = Number(token.day);
  let year = explicitYear || inferFirstYear(month, day, today);

  if (!explicitYear && previousDate) {
    year = Number(previousDate.slice(0, 4));
    let value = toYmd(year, month, day);
    if (value && value <= previousDate && month < Number(previousDate.slice(5, 7))) {
      year += 1;
    }
  }
  return toYmd(year, month, day);
}

export function parseAvailabilityDates(text, today = taipeiToday()) {
  const value = String(text || "")
    .replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10))
    .replace(/[～－—]/g, "-");
  const tokenPattern = /(?:(20\d{2})\s*[年\/.-]\s*)?(\d{1,2})\s*(?:月|[\/.-])\s*(\d{1,2})\s*(?:日|號)?/g;
  const tokens = [];
  let match;
  while ((match = tokenPattern.exec(value)) && tokens.length < 2) {
    tokens.push({ year: match[1] || null, month: match[2], day: match[3] });
  }

  if (tokens.length === 1) {
    const shortEnd = value.match(/\d{1,2}\s*月\s*\d{1,2}\s*(?:日|號)?\s*(?:到|至|~|-)\s*(\d{1,2})\s*(?:日|號)/);
    if (shortEnd) {
      tokens.push({ year: tokens[0].year, month: tokens[0].month, day: shortEnd[1] });
    }
  }

  const startDate = tokens[0] ? normalizeDateToken(tokens[0], today) : null;
  const endDate = tokens[1] && startDate ? normalizeDateToken(tokens[1], today, startDate) : null;
  return {
    startDate,
    endDate,
    dateCount: [startDate, endDate].filter(Boolean).length,
    invalid: tokens.length > 0 && (!startDate || (tokens.length > 1 && !endDate))
  };
}

export function inferCampsiteRoom(text) {
  const value = String(text || "");
  if (/熱氣球/.test(value)) return "balloon";
  if (/雲朵/.test(value)) return "cloud";
  return "either";
}

function formatDate(value) {
  const [, month, day] = value.split("-").map(Number);
  return `${month} 月 ${day} 日`;
}

function friendlyLead() {
  return "您好～很高興收到您的訊息！";
}

function incompleteDateReply(service, parsed) {
  const knownDate = parsed.startDate ? `收到您提到的 ${formatDate(parsed.startDate)}，` : "";
  if (service === "campervan") {
    return `${friendlyLead()}\n${knownDate}露營車最低租期為 3 天 2 夜，請問預計幾月幾日取車、幾月幾日還車呢？\n\n您也可以先查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`;
  }
  if (service === "campsite") {
    return `${friendlyLead()}\n${knownDate}請問預計幾月幾日入住、幾月幾日退房，以及想查熱氣球房還是雲朵房呢？\n\n即時空房：${CAMPSITE_AVAILABILITY_URL}`;
  }
  return `${friendlyLead()}\n請問想查詢露營區還是露營車呢？也請告訴我們完整的入住／取車與退房／還車日期，我們就能立即幫您查看。\n\n露營區空房：${CAMPSITE_AVAILABILITY_URL}\n露營車檔期：${CAMPERVAN_AVAILABILITY_URL}`;
}

function campervanReply(result) {
  const rangeLabel = `${formatDate(result.startDate)}到 ${formatDate(result.endDate)}`;
  if (result.status === "calendar_clear") {
    return `${friendlyLead()}\n您詢問的 ${rangeLabel}，目前即時日曆顯示尚有檔期，可以繼續詢問喔！若您想進一步預訂，請告訴我們人數、交車地點與預計行程，我們會再確認完整資料。\n\n查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`;
  }
  if (result.status === "waitlist") {
    return `${friendlyLead()}\n您詢問的 ${rangeLabel}，目前已有其他客人詢問、尚待確認，因此屬於可候補狀態。您也可以提供其他日期，我們很樂意再幫您查看。\n\n查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`;
  }
  if (result.status === "unavailable") {
    return `${friendlyLead()}\n您詢問的 ${rangeLabel}，目前日曆顯示暫不開放出租。您可以提供前後其他日期，我們很樂意再幫您查看。\n\n查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`;
  }
  return `${friendlyLead()}\n您詢問的 ${rangeLabel}，目前已有預訂，這段期間暫時沒有空檔。您可以提供前後其他日期，我們很樂意再幫您查看。\n\n查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`;
}

function campsiteRoomLabel(room) {
  return room === "balloon" ? "熱氣球房" : "雲朵房";
}

function campsiteStatusLabel(status) {
  if (status === "available") return "目前尚有空房";
  if (status === "provisional") return "已有其他客人詢問、目前可候補";
  if (status === "unavailable") return "目前暫不開放預訂";
  return "目前已有預訂";
}

function campsiteReply(result) {
  const rangeLabel = `${formatDate(result.startDate)}入住、${formatDate(result.endDate)}退房`;
  const lines = Object.entries(result.roomStatus).map(
    ([room, status]) => `${campsiteRoomLabel(room)}：${campsiteStatusLabel(status)}`
  );
  return `${friendlyLead()}\n您詢問的 ${rangeLabel}，即時空房如下：\n${lines.join("\n")}\n\n如果您告訴我們入住人數與喜歡的房型，我們也可以接著為您介紹最適合的安排。\n\n查看即時空房：${CAMPSITE_AVAILABILITY_URL}`;
}

export async function answerAvailabilityQuestion(env, { text, service, today }) {
  const parsed = parseAvailabilityDates(text, today || taipeiToday());
  if (parsed.invalid) {
    return {
      reply: `${friendlyLead()}\n日期好像有一點不完整，請再告訴我們完整的月份與日期，我們就能立即幫您查看。`,
      pause: false,
      service
    };
  }
  if (!service || !parsed.startDate || !parsed.endDate) {
    return { reply: incompleteDateReply(service, parsed), pause: false, service };
  }
  if (parsed.endDate <= parsed.startDate) {
    return { reply: incompleteDateReply(service, parsed), pause: false, service };
  }
  if (service === "campervan" && diffDays(parsed.startDate, parsed.endDate) < 2) {
    return {
      reply: `${friendlyLead()}\n您提供的日期未滿 3 天 2 夜；露營車最低租期為 3 天 2 夜，請再告訴我們新的取車與還車日期，我們就能立即幫您查看。\n\n查看即時檔期：${CAMPERVAN_AVAILABILITY_URL}`,
      pause: false,
      service
    };
  }

  try {
    const result = await checkAvailability(env, {
      service,
      room: service === "campsite" ? inferCampsiteRoom(text) : "not_applicable",
      start_date: parsed.startDate,
      end_date: parsed.endDate
    });
    return {
      reply: service === "campervan" ? campervanReply(result) : campsiteReply(result),
      pause: false,
      service
    };
  } catch (error) {
    console.error("Availability lookup failed", error);
    return {
      reply: `${friendlyLead()}\n已收到您想查詢的日期，我們會先確認最新檔期，再回覆您，謝謝稍候。`,
      pause: true,
      pauseReason: "availability_lookup_failed",
      service
    };
  }
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
      publicAvailabilityUrl: CAMPERVAN_AVAILABILITY_URL,
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
    availabilityUrl: CAMPSITE_AVAILABILITY_URL,
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

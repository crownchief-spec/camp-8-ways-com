const TZ = "Asia/Taipei";

const CAMP_CALENDAR_NAME = "Joyforest露營區";
const RV_CALENDAR_NAME = "露營車";

const ROOM_META = {
  balloon: { id: "balloon", label: "熱氣球房", css: "balloon" },
  cloud: { id: "cloud", label: "雲朵房", css: "cloud" },
  rv: { id: "rv", label: "露營車", css: "rv" }
};

function unfoldIcs(text) {
  return text.replace(/\r\n/g, "\n").replace(/\n[\t ]/g, "");
}

function unescapeIcsText(value) {
  if (!value) return "";
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\N/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsDateProp(prop) {
  if (!prop) return { date: null, hasTime: false, isAllDay: false };
  const keyPart = prop.keyPart;
  const value = prop.value.trim();
  const isAllDay = keyPart.indexOf("VALUE=DATE") !== -1;

  if (isAllDay) {
    const y = parseInt(value.slice(0, 4), 10);
    const m = parseInt(value.slice(4, 6), 10) - 1;
    const d = parseInt(value.slice(6, 8), 10);
    return { date: new Date(y, m, d, 0, 0, 0, 0), hasTime: false, isAllDay: true };
  }

  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    const ds = value.slice(0, 8);
    const ts = value.slice(9, 15);
    const iso =
      ds.slice(0, 4) +
      "-" +
      ds.slice(4, 6) +
      "-" +
      ds.slice(6, 8) +
      "T" +
      ts.slice(0, 2) +
      ":" +
      ts.slice(2, 4) +
      ":" +
      ts.slice(4, 6) +
      (value.endsWith("Z") ? "Z" : "");
    return { date: new Date(iso), hasTime: true, isAllDay: false };
  }

  const parsed = Date.parse(value);
  if (isNaN(parsed)) return { date: null, hasTime: false, isAllDay: false };
  return { date: new Date(parsed), hasTime: true, isAllDay: false };
}

function parseEventBlock(chunk) {
  const props = {};
  const lines = chunk.split("\n");
  let nestedDepth = 0;

  for (const line of lines) {
    if (line.startsWith("BEGIN:")) {
      nestedDepth += 1;
      continue;
    }
    if (line.startsWith("END:")) {
      nestedDepth -= 1;
      continue;
    }
    if (nestedDepth !== 0) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const keyPart = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = keyPart.split(";")[0];
    if (!props[key]) props[key] = { keyPart, value };
  }

  return props;
}

function classifyTags(summary, description, isRvCalendar, xTag) {
  const text = (summary || "") + "\n" + (description || "");
  const tags = [];
  if (text.indexOf("包場") !== -1) {
    tags.push("balloon");
    tags.push("cloud");
  }
  if (text.indexOf("熱氣球") !== -1) tags.push("balloon");
  if (text.indexOf("雲朵") !== -1) tags.push("cloud");
  if (text.indexOf("露營車") !== -1) tags.push("rv");
  if (isRvCalendar || (xTag && xTag.value === "rv")) {
    if (tags.indexOf("rv") === -1) tags.push("rv");
  }
  return [...new Set(tags)];
}

function parseGuestInfo(text) {
  const info = {
    totalGuests: null,
    adults: null,
    children: null
  };
  if (!text) return info;

  const bigSmall = text.match(/(\d+)\s*大\s*(\d+)\s*小/);
  if (bigSmall) {
    info.adults = parseInt(bigSmall[1], 10);
    info.children = parseInt(bigSmall[2], 10);
    info.totalGuests = info.adults + info.children;
    return info;
  }

  const bigOnly = text.match(/(\d+)\s*大(?!\s*\d)/);
  if (bigOnly) {
    info.adults = parseInt(bigOnly[1], 10);
    info.totalGuests = info.adults;
  }

  const ren = text.match(/(\d+)\s*人/);
  const wei = text.match(/(\d+)\s*位/);
  if (ren && info.totalGuests == null) info.totalGuests = parseInt(ren[1], 10);
  if (wei && info.totalGuests == null) info.totalGuests = parseInt(wei[1], 10);

  const adultLabel = text.match(/成人\s*[:：]?\s*(\d+)/);
  const childLabel = text.match(/兒童\s*[:：]?\s*(\d+)/);
  if (adultLabel) info.adults = parseInt(adultLabel[1], 10);
  if (childLabel) info.children = parseInt(childLabel[1], 10);
  if (info.adults != null && info.children != null) {
    info.totalGuests = info.adults + info.children;
  }

  return info;
}

function parseBookingSource(text) {
  if (!text) return null;
  const sources = [
    { re: /airbnb/i, label: "Airbnb" },
    { re: /agoda/i, label: "Agoda" },
    { re: /booking\.com|booking/i, label: "Booking.com" },
    { re: /whatsapp/i, label: "WhatsApp" },
    { re: /line/i, label: "LINE" },
    { re: /粉專|facebook/i, label: "Facebook 粉專" },
    { re: /官網|網站/i, label: "官網" },
    { re: /電話/i, label: "電話" },
    { re: /直接/i, label: "直接訂房" }
  ];
  for (const s of sources) {
    if (s.re.test(text)) return s.label;
  }
  return null;
}

/** 標題／內容含「私訂／私定／私下」等，視為私下預訂 */
export function isPrivateBookingText(text) {
  if (!text) return false;
  return /私[訂定]|私下|(?:^|[\s　])私(?:$|[\s　])/.test(text);
}

function normalizeMoneyToken(raw, minAmount = 1000) {
  if (!raw) return null;
  let s = String(raw).replace(/[,\s　]/g, "").replace(/[元塊]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < minAmount || n > 5000000) return null;
  return n;
}

/**
 * 從行事曆「費用：」列解析實際收入。
 * Agoda / Airbnb 通常不寫價格，略過。
 * 優先：等號右側總額 → 共 NT$… → 明確 $／NT$ 加總 → 簡單加減乘 → 第一個合理金額。
 */
export function parseStatedPriceFromText(text, bookingSource) {
  if (!text) return null;
  if (
    bookingSource === "Airbnb" ||
    bookingSource === "Agoda" ||
    /airbnb/i.test(text) ||
    /agoda/i.test(text)
  ) {
    return null;
  }

  const feeMatch = text.match(/費用[：:]\s*([^\n\r]+)/);
  if (!feeMatch) return null;

  let expr = feeMatch[1]
    .replace(/\u2028|\u2029/g, " ")
    .replace(/（[^）]*）/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .trim();

  if (!expr || /^[0０]+$/.test(expr)) return null;
  // 僅有「每小時 $300」這類時數費，不是整筆收入
  if (/每小時/.test(expr) && !/\d{4,}/.test(expr.replace(/[,\s　]/g, ""))) {
    return null;
  }

  // 等號右側總額（含 *18,600* 這類）
  if (/=/.test(expr)) {
    const rhs = expr.split("=").pop().replace(/\*/g, " ").trim();
    const spaced = rhs.match(/(?:\d{1,3}(?:[,\s　]\d{3})+|\d{4,})/);
    const n = normalizeMoneyToken(spaced ? spaced[0] : rhs);
    if (n) return n;
  }

  // 「共 NT$2,600」
  const totalShare = expr.match(/共\s*(?:NT\$?|\$)?\s*([\d,\s　]{3,})/i);
  if (totalShare) {
    const n = normalizeMoneyToken(totalShare[1]);
    if (n) return n;
  }

  // 以 +／＋ 分段加總（略過「加時 12*300」這類非整筆段落）
  if (/[＋+]/.test(expr)) {
    const parts = expr.split(/[＋+]/);
    const nums = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/加時/.test(part) && !/\d{4,}/.test(part.replace(/[,\s　]/g, ""))) {
        continue;
      }
      // 加總時允許較小附加費（如車馬費 800）
      const m = part.match(/(?:NT\$?|\$)?\s*(\d{1,3}(?:[,\s　]\d{3})+|\d{3,})/i);
      if (m) {
        const n = normalizeMoneyToken(m[1], nums.length ? 100 : 1000);
        if (n) nums.push(n);
      }
    }
    if (nums.length >= 2) {
      return nums.reduce((a, b) => a + b, 0);
    }
    if (nums.length === 1) return nums[0];
  }

  // 單一 $ / NT$ 金額
  const cashTokens = [];
  const cashRe = /(?:NT\$?|\$)\s*([\d,\s　]+)/gi;
  let cm;
  while ((cm = cashRe.exec(expr)) !== null) {
    const n = normalizeMoneyToken(cm[1]);
    if (n) cashTokens.push(n);
  }
  if (cashTokens.length) {
    return Math.max(...cashTokens);
  }

  // 簡單 8800*3
  const mul = expr.match(/(\d{4,})\s*\*\s*(\d{1,2})\b/);
  if (mul) {
    const a = parseInt(mul[1], 10);
    const b = parseInt(mul[2], 10);
    if (a >= 1000 && b >= 2 && b <= 30) return a * b;
  }

  // 13,400 或 13400 或 13 400（空白千分位）
  const plain = expr.match(/(\d{1,3}(?:[,\s　]\d{3})+|\d{4,})/);
  if (plain) {
    const n = normalizeMoneyToken(plain[1]);
    if (n) return n;
  }

  return null;
}

function localDateParts(date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = fmt.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    y: parseInt(get("year"), 10),
    m: parseInt(get("month"), 10) - 1,
    d: parseInt(get("day"), 10)
  };
}

function diffLocalDays(startDate, endDate) {
  const s = localDateParts(startDate);
  const e = localDateParts(endDate);
  const sUtc = Date.UTC(s.y, s.m, s.d);
  const eUtc = Date.UTC(e.y, e.m, e.d);
  return Math.round((eUtc - sUtc) / 86400000);
}

function countNights(start, end, isAllDay) {
  if (!start || !end) return null;
  if (isAllDay) {
    const nights = diffLocalDays(start, end);
    return Math.max(nights, 0);
  }
  let nights = diffLocalDays(start, end);
  if (nights < 1 && end > start) nights = 1;
  return nights;
}

function formatDateTaipei(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatTimeTaipei(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatIsoTaipei(date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function getStayStatus(now, start, end) {
  const t = now.getTime();
  const s = start.getTime();
  const e = end.getTime();
  if (t >= e) return "checked-out";
  if (t >= s && t < e) return "staying";
  return "check-in";
}

function parseIcsEvents(icsText, calendarName, isRvCalendar) {
  const raw = unfoldIcs(icsText);
  const parts = raw.split(/BEGIN:VEVENT\r?\n/);
  const events = [];

  for (let p = 1; p < parts.length; p++) {
    const chunk = parts[p].split(/END:VEVENT/)[0];
    const props = parseEventBlock(chunk);

    const summary = unescapeIcsText(props.SUMMARY ? props.SUMMARY.value : "");
    const description = unescapeIcsText(props.DESCRIPTION ? props.DESCRIPTION.value : "");
    const location = unescapeIcsText(props.LOCATION ? props.LOCATION.value : "");
    const comment = unescapeIcsText(props.COMMENT ? props.COMMENT.value : "");

    const tags = classifyTags(
      summary,
      description,
      isRvCalendar,
      props["X-JOYFOREST-TAG"]
    );
    if (!tags.length) continue;

    const startInfo = parseIcsDateProp(props.DTSTART);
    const endInfo = parseIcsDateProp(props.DTEND);
    if (!startInfo.date) continue;

    let start = startInfo.date;
    let end = endInfo.date;
    const isAllDay = startInfo.isAllDay;
    const hasStartTime = startInfo.hasTime;
    const hasEndTime = endInfo.hasTime;

    if (!end) {
      end = new Date(start.getTime());
      if (isAllDay) end.setDate(end.getDate() + 1);
    }

    const combinedText = [summary, description, comment].filter(Boolean).join("\n");
    const guestInfo = parseGuestInfo(combinedText);
    const bookingSource = parseBookingSource(combinedText);
    const statedPrice = parseStatedPriceFromText(combinedText, bookingSource);
    const isPrivate = isPrivateBookingText(combinedText);
    const nights = countNights(start, end, isAllDay);
    const now = new Date();

    const roomLabels = tags.map((t) => ROOM_META[t]?.label).filter(Boolean);

    events.push({
      id: props.UID ? props.UID.value : `${calendarName}-${p}`,
      roomTags: tags,
      roomLabels,
      roomLabel: roomLabels.join("＋"),
      summary,
      description,
      comment,
      location,
      status: props.STATUS ? props.STATUS.value : "",
      bookingSource,
      statedPrice,
      isPrivate,
      guestCount: guestInfo.totalGuests,
      adults: guestInfo.adults,
      children: guestInfo.children,
      checkInDate: formatDateTaipei(start),
      checkInTime: hasStartTime ? formatTimeTaipei(start) : "",
      checkOutDate: formatDateTaipei(end),
      checkOutTime: hasEndTime ? formatTimeTaipei(end) : "",
      nights,
      stayStatus: getStayStatus(now, start, end),
      isAllDay,
      hasStartTime,
      hasEndTime,
      checkInSort: start.getTime(),
      checkInYmd: (() => {
        const lp = localDateParts(start);
        return `${lp.y}-${String(lp.m + 1).padStart(2, "0")}-${String(lp.d).padStart(2, "0")}`;
      })(),
      checkOutYmd: (() => {
        const lp = localDateParts(end);
        return `${lp.y}-${String(lp.m + 1).padStart(2, "0")}-${String(lp.d).padStart(2, "0")}`;
      })(),
      checkInYm: (() => {
        const lp = localDateParts(start);
        return `${lp.y}-${String(lp.m + 1).padStart(2, "0")}`;
      })()
    });
  }

  return events;
}

/** 台北時區「昨天」的 YYYY-MM-DD */
export function getYesterdayYmdTaipei(now = new Date()) {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const [y, m, d] = todayStr.split("-").map((n) => parseInt(n, 10));
  const yesterday = new Date(Date.UTC(y, m - 1, d) - 86400000);
  return (
    yesterday.getUTCFullYear() +
    "-" +
    String(yesterday.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(yesterday.getUTCDate()).padStart(2, "0")
  );
}

/** 台北時區「今天起一個月後」的 YYYY-MM-DD（含當日） */
export function getOneMonthAheadYmdTaipei(now = new Date()) {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  const [y, m, d] = todayStr.split("-").map((n) => parseInt(n, 10));
  const ahead = new Date(Date.UTC(y, m - 1 + 1, d));
  return (
    ahead.getUTCFullYear() +
    "-" +
    String(ahead.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(ahead.getUTCDate()).padStart(2, "0")
  );
}

/** 顯示區間：昨天 ～ 今天起一個月內 */
export function getStaffDisplayRangeYmd(now = new Date()) {
  return {
    fromYmd: getYesterdayYmdTaipei(now),
    untilYmd: getOneMonthAheadYmdTaipei(now)
  };
}

export function mergeAndParseCalendars(campIcs, rvIcs) {
  const campEvents = parseIcsEvents(campIcs, CAMP_CALENDAR_NAME, false);
  const rvEvents = parseIcsEvents(rvIcs, RV_CALENDAR_NAME, true);
  const all = campEvents.concat(rvEvents);
  all.sort((a, b) => a.checkInSort - b.checkInSort);
  return all;
}

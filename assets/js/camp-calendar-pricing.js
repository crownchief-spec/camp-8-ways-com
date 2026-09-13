"use strict";
(() => {
  // src/data/calendar/calendarHolidayBlocks2026.ts
  var calendarHolidayBlocks2026 = [
    { start: "2026-02-14", end: "2026-02-22" },
    { start: "2026-02-27", end: "2026-03-01" },
    { start: "2026-04-03", end: "2026-04-06" },
    { start: "2026-05-01", end: "2026-05-03" },
    { start: "2026-06-19", end: "2026-06-21" },
    { start: "2026-09-25", end: "2026-09-28" },
    { start: "2026-10-09", end: "2026-10-11" },
    { start: "2026-10-24", end: "2026-10-26" },
    { start: "2026-12-25", end: "2026-12-27" }
  ];

  // src/data/calendar/calendarHolidayBlocks2027.ts
  var calendarHolidayBlocks2027 = [
    { start: "2027-01-01", end: "2027-01-03" },
    { start: "2027-02-04", end: "2027-02-10" },
    { start: "2027-02-27", end: "2027-03-01" },
    { start: "2027-04-03", end: "2027-04-06" },
    { start: "2027-04-30", end: "2027-05-02" },
    { start: "2027-10-09", end: "2027-10-11" },
    { start: "2027-10-23", end: "2027-10-25" },
    { start: "2027-12-24", end: "2027-12-26" },
    { start: "2027-12-31", end: "2028-01-02" }
  ];

  // src/lib/calendar/calendarHolidayUtils.ts
  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }
  function parseYmdLocal(ymd) {
    const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  function formatYmdLocal(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function addLocalDays(base, delta) {
    const x = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
    x.setDate(x.getDate() + delta);
    return x;
  }
  function holidayBlockToPriceOverrideDates(block) {
    const rawStart = parseYmdLocal(block.start);
    const rawEnd = parseYmdLocal(block.end);
    const priceEnd = addLocalDays(rawEnd, -1);
    return enumerateInclusiveLocalYmd(rawStart, priceEnd);
  }
  function enumerateInclusiveLocalYmd(start, end) {
    const out = [];
    if (start > end) return out;
    for (let cur = new Date(start); cur <= end; cur = addLocalDays(cur, 1)) {
      out.push(formatYmdLocal(cur));
      if (out.length > 400) break;
    }
    return out;
  }
  function holidayBlocksToSortedUniqueYmds(blocks) {
    const set = /* @__PURE__ */ new Set();
    for (const b of blocks) {
      for (const ymd of holidayBlockToPriceOverrideDates(b)) {
        set.add(ymd);
      }
    }
    return [...set].sort();
  }
  function buildHolidayOverrideDateSet(blocks2026, blocks2027) {
    const s = /* @__PURE__ */ new Set();
    holidayBlocksToSortedUniqueYmds(blocks2026).forEach((x) => s.add(x));
    holidayBlocksToSortedUniqueYmds(blocks2027).forEach((x) => s.add(x));
    return s;
  }

  // src/data/calendar/calendarPricing.ts
  var calendarResourcePricing = {
    balloon: {
      label: "\u71B1\u6C23\u7403\u623F",
      shortLabel: "\u71B1\u6C23\u7403",
      originalPrice: 7800,
      weekday: 5e3,
      weekend: 5e3,
      longHoliday: 6e3,
      showPrice: true
    },
    cloud: {
      label: "\u96F2\u6735\u623F",
      shortLabel: "\u96F2\u6735",
      originalPrice: 7800,
      weekday: 5e3,
      weekend: 5e3,
      longHoliday: 6e3,
      showPrice: true
    },
    rv: {
      label: "\u9732\u71DF\u8ECA",
      shortLabel: "\u9732\u71DF\u8ECA",
      showPrice: false
    }
  };

  // src/data/calendar/calendarSpecialNightlyPrices.ts
  var calendarSpecialNightlyPrices = {
    "2027-02-03": 8e3,
    "2027-02-04": 8e3,
    "2027-02-05": 8e3,
    "2027-02-06": 8e3,
    "2027-02-07": 8e3,
    "2027-02-08": 8e3
  };

  // src/lib/date/datePricingUtils.ts
  var BOOKING_WINDOW_MONTHS = 6;
  function isFridayOrSaturdayLocal(y, m, d) {
    const dow = new Date(y, m, d).getDay();
    return dow === 5 || dow === 6;
  }
  function formatPriceNt(amount) {
    return "$" + amount.toLocaleString("zh-TW");
  }
  function formatDiscountPriceDisplay(_original, discount) {
    return '<span class="availability-line__promo-label">\u6253\u5361\u512A\u60E0</span> <strong>' + formatPriceNt(discount) + "</strong>";
  }
  function resolveResourceRowDisplay(resourceId, y, m, d, isBooked, holidayOverrideSet) {
    const cfg = calendarResourcePricing[resourceId];
    if (isBooked) {
      return { kind: "booked", label: cfg.label, shortLabel: cfg.shortLabel };
    }
    if (!cfg.showPrice) {
      return { kind: "hidden" };
    }
    const key = formatYmdLocal(new Date(y, m, d, 0, 0, 0, 0));
    const specialPrice = calendarSpecialNightlyPrices[key];
    const amount = specialPrice ?? (holidayOverrideSet.has(key) ? cfg.longHoliday : isFridayOrSaturdayLocal(y, m, d) ? cfg.weekend : cfg.weekday);
    return {
      kind: "price",
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      formattedPrice: formatDiscountPriceDisplay(cfg.originalPrice, amount)
    };
  }
  function startOfToday(now = /* @__PURE__ */ new Date()) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  function computeCalendarMonthRange(_events, now = /* @__PURE__ */ new Date()) {
    const startYm = { y: now.getFullYear(), m: now.getMonth() };
    const cutoff = bookingWindowCutoff(now);
    return { startYm, endYm: { y: cutoff.getFullYear(), m: cutoff.getMonth() } };
  }
  function bookingWindowCutoff(now = /* @__PURE__ */ new Date()) {
    const source = startOfToday(now);
    const targetMonth = new Date(
      source.getFullYear(),
      source.getMonth() + BOOKING_WINDOW_MONTHS,
      1
    );
    const lastDay = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0
    ).getDate();
    return new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      Math.min(source.getDate(), lastDay),
      0,
      0,
      0,
      0
    );
  }
  function isWithinBookingWindow(y, m, d, now = /* @__PURE__ */ new Date()) {
    const day = new Date(y, m, d, 0, 0, 0, 0);
    return day >= startOfToday(now) && day <= bookingWindowCutoff(now);
  }

  // src/bundle/campCalendarPricing.ts
  var holidayOverrideDateSet = buildHolidayOverrideDateSet(
    calendarHolidayBlocks2026,
    calendarHolidayBlocks2027
  );
  var CampCalendarPricing = {
    RESOURCE_ORDER: ["balloon", "cloud", "rv"],
    holidayOverrideDateSet,
    computeCalendarMonthRange,
    isWithinBookingWindow,
    resolveResourceRowDisplay(resourceId, y, m, d, isBooked) {
      return resolveResourceRowDisplay(
        resourceId,
        y,
        m,
        d,
        isBooked,
        holidayOverrideDateSet
      );
    }
  };
  window.CampCalendarPricing = CampCalendarPricing;
})();

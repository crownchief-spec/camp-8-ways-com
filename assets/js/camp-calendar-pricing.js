"use strict";
(() => {
  // src/data/calendar/calendarHolidayBlocks2026.ts
  var calendarHolidayBlocks2026 = [
    { start: "2026-05-01", end: "2026-05-03" },
    { start: "2026-06-19", end: "2026-06-22" },
    { start: "2026-09-25", end: "2026-09-28" },
    { start: "2026-10-09", end: "2026-10-11" },
    { start: "2026-10-24", end: "2026-10-26" },
    { start: "2026-12-25", end: "2026-12-27" }
  ];

  // src/data/calendar/calendarHolidayBlocks2027.ts
  var calendarHolidayBlocks2027 = [];

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
    const priceStart = addLocalDays(rawStart, -1);
    const priceEnd = addLocalDays(rawEnd, -1);
    return enumerateInclusiveLocalYmd(priceStart, priceEnd);
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
      showPrice: true
    },
    cloud: {
      label: "\u96F2\u6735\u623F",
      shortLabel: "\u96F2\u6735",
      originalPrice: 7800,
      weekday: 5e3,
      weekend: 5e3,
      showPrice: true
    },
    rv: {
      label: "\u9732\u71DF\u8ECA",
      shortLabel: "\u9732\u71DF\u8ECA",
      showPrice: false
    }
  };

  // src/lib/date/datePricingUtils.ts
  function isFridayOrSaturdayLocal(y, m, d) {
    const dow = new Date(y, m, d).getDay();
    return dow === 5 || dow === 6;
  }
  function isHolidayPriceNight(y, m, d, holidayOverrideSet) {
    const key = formatYmdLocal(new Date(y, m, d, 0, 0, 0, 0));
    if (holidayOverrideSet.has(key)) return true;
    return isFridayOrSaturdayLocal(y, m, d);
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
    const holidayNight = isHolidayPriceNight(y, m, d, holidayOverrideSet);
    const amount = holidayNight ? cfg.weekend : cfg.weekday;
    return {
      kind: "price",
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      formattedPrice: formatDiscountPriceDisplay(cfg.originalPrice, amount)
    };
  }
  var RELEVANT = /* @__PURE__ */ new Set(["balloon", "cloud", "rv"]);
  function startOfToday(now = /* @__PURE__ */ new Date()) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  function eventOverlapsLocalDay(ev, y, m, day) {
    const dayStart = new Date(y, m, day, 0, 0, 0, 0);
    const dayEnd = new Date(y, m, day + 1, 0, 0, 0, 0);
    return ev.end > dayStart && ev.start < dayEnd;
  }
  function computeCalendarMonthRange(events, now = /* @__PURE__ */ new Date()) {
    const todayStart = startOfToday(now);
    const startYm = { y: now.getFullYear(), m: now.getMonth() };
    let maxY = startYm.y;
    let maxM = startYm.m;
    for (const ev of events) {
      if (!ev.tags.some((t) => RELEVANT.has(t))) continue;
      if (ev.end <= todayStart) continue;
      let cur = new Date(
        ev.start < todayStart ? todayStart.getTime() : ev.start.getTime()
      );
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0, 0);
      while (cur < ev.end) {
        if (cur >= todayStart && eventOverlapsLocalDay(ev, cur.getFullYear(), cur.getMonth(), cur.getDate())) {
          const cy = cur.getFullYear();
          const cm = cur.getMonth();
          if (cy > maxY || cy === maxY && cm > maxM) {
            maxY = cy;
            maxM = cm;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return { startYm, endYm: { y: maxY, m: maxM } };
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

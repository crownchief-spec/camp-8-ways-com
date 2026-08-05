(function () {
  var Gate = window.JoyforestAdminGate;
  if (!Gate || !Gate.requireAuth("admin.html")) return;

  var API_BASE = "/api";
  var RULES_KEY = "joyforest_admin_pricing_rules";
  var OVERRIDES_KEY = "joyforest_admin_price_overrides";
  var WEEKDAY_HEAD = ["一", "二", "三", "四", "五", "六", "日"];

  var DEFAULT_RULES = {
    tentNightly: 5000,
    rvBase: 13800,
    rvExtraDay: 2800,
    rvBaseNights: 2
  };

  var eventsCache = [];
  var rangeFromYmd = "";
  var rangeUntilYmd = "";

  var statusEl = document.getElementById("revenue-status");
  var fetchError = document.getElementById("revenue-fetch-error");
  var eventsEl = document.getElementById("revenue-events");
  var refreshBtn = document.getElementById("revenue-refresh-btn");
  var rangeLabel = document.getElementById("revenue-range-label");
  var monthTableEl = document.getElementById("revenue-month-table");
  var sumTotal = document.getElementById("sum-total");
  var sumTent = document.getElementById("sum-tent");
  var sumRv = document.getElementById("sum-rv");
  var tentNightInput = document.getElementById("price-tent-night");
  var rvBaseInput = document.getElementById("price-rv-base");
  var rvExtraInput = document.getElementById("price-rv-extra");
  var applyBtn = document.getElementById("price-apply-btn");
  var resetOverridesBtn = document.getElementById("price-reset-overrides-btn");

  function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showFetchError(msg) {
    fetchError.textContent = msg || "";
    fetchError.hidden = !msg;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function monthRange(y, m0) {
    var fromYmd = y + "-" + pad2(m0 + 1) + "-01";
    var lastDay = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
    var untilYmd = y + "-" + pad2(m0 + 1) + "-" + pad2(lastDay);
    return { fromYmd: fromYmd, untilYmd: untilYmd };
  }

  /** 今年二月一日 ～ 今年年底（含未來已訂月份） */
  function getReportRange() {
    var now = new Date();
    var year = now.getFullYear();
    var fromYmd = year + "-02-01";
    var untilYmd = year + "-12-31";
    return { fromYmd: fromYmd, untilYmd: untilYmd, year: year };
  }

  function parseYmdParts(ymd) {
    if (!ymd) return null;
    var parts = ymd.split("-").map(function (n) {
      return parseInt(n, 10);
    });
    if (parts.length < 3 || !parts[0]) return null;
    return { y: parts[0], m: parts[1] - 1, d: parts[2] };
  }

  /** 自二月列到「本月」與「最後一筆入住月」較晚者 */
  function listReportMonths(events, reportYear) {
    var now = new Date();
    var endY = now.getFullYear();
    var endM = now.getMonth();
    revenueEvents(events).forEach(function (ev) {
      var p = parseYmdParts(ev.checkInYmd);
      if (!p) return;
      if (p.y > endY || (p.y === endY && p.m > endM)) {
        endY = p.y;
        endM = p.m;
      }
    });
    if (endY < reportYear || (endY === reportYear && endM < 1)) {
      endY = reportYear;
      endM = 1;
    }
    var months = [];
    var y = reportYear;
    var m = 1; // February
    while (y < endY || (y === endY && m <= endM)) {
      months.push({ y: y, m: m });
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    return months;
  }

  function toYmd(y, m0, d) {
    return y + "-" + pad2(m0 + 1) + "-" + pad2(d);
  }

  function formatMoney(n) {
    var num = Math.round(Number(n) || 0);
    return "$" + num.toLocaleString("en-US");
  }

  function loadRules() {
    try {
      var raw = localStorage.getItem(RULES_KEY);
      if (!raw) return Object.assign({}, DEFAULT_RULES);
      var parsed = JSON.parse(raw);
      return {
        tentNightly: Number(parsed.tentNightly) || DEFAULT_RULES.tentNightly,
        rvBase: Number(parsed.rvBase) || DEFAULT_RULES.rvBase,
        rvExtraDay: Number(parsed.rvExtraDay) || DEFAULT_RULES.rvExtraDay,
        rvBaseNights: DEFAULT_RULES.rvBaseNights
      };
    } catch (err) {
      return Object.assign({}, DEFAULT_RULES);
    }
  }

  function saveRules(rules) {
    localStorage.setItem(
      RULES_KEY,
      JSON.stringify({
        tentNightly: rules.tentNightly,
        rvBase: rules.rvBase,
        rvExtraDay: rules.rvExtraDay
      })
    );
  }

  function loadOverrides() {
    try {
      var raw = localStorage.getItem(OVERRIDES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  function saveOverrides(map) {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
  }

  function fillRulesInputs(rules) {
    tentNightInput.value = rules.tentNightly;
    rvBaseInput.value = rules.rvBase;
    rvExtraInput.value = rules.rvExtraDay;
  }

  function readRulesFromInputs() {
    return {
      tentNightly: Math.max(0, Number(tentNightInput.value) || 0),
      rvBase: Math.max(0, Number(rvBaseInput.value) || 0),
      rvExtraDay: Math.max(0, Number(rvExtraInput.value) || 0),
      rvBaseNights: DEFAULT_RULES.rvBaseNights
    };
  }

  function isRvEvent(ev) {
    return ev.roomTags && ev.roomTags.indexOf("rv") !== -1;
  }

  /**
   * 露營車單日／備註事件（還車、驗車、洗車等）不是租車行程，不計收入。
   * 真正出租一定是連續多日（三天兩夜起，nights >= 2）。
   */
  function isRvNonRentalNote(ev) {
    if (!isRvEvent(ev)) return false;
    var nights = eventNights(ev);
    if (nights < 2) return true;
    var summary = ev.summary || "";
    if (/驗車/.test(summary)) return true;
    if (
      /還車|還露營車/.test(summary) &&
      !/租/.test(summary) &&
      !/方案費用|費用[：:]/.test(eventText(ev))
    ) {
      return true;
    }
    return false;
  }

  function isRevenueEvent(ev) {
    return !isRvNonRentalNote(ev);
  }

  function revenueEvents(list) {
    return (list || []).filter(isRevenueEvent);
  }

  function normalizeMoneyToken(raw, minAmount) {
    if (minAmount == null) minAmount = 1000;
    if (!raw) return null;
    var s = String(raw).replace(/[,\s　]/g, "").replace(/[元塊]/g, "");
    if (!/^\d+$/.test(s)) return null;
    var n = parseInt(s, 10);
    if (!isFinite(n) || n < minAmount || n > 5000000) return null;
    return n;
  }

  /**
   * 從 Google 行事曆內容的「費用：」解析實際收入。
   * Agoda／Airbnb 通常不寫價格 → 回傳 null，改走預設定價。
   */
  function parseStatedPriceFromText(text, bookingSource) {
    if (!text) return null;
    if (
      bookingSource === "Airbnb" ||
      bookingSource === "Agoda" ||
      /airbnb/i.test(text) ||
      /agoda/i.test(text)
    ) {
      return null;
    }

    var feeMatch = text.match(/費用[：:]\s*([^\n\r]+)/);
    if (!feeMatch) return null;

    var expr = feeMatch[1]
      .replace(/\u2028|\u2029/g, " ")
      .replace(/（[^）]*）/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .trim();

    if (!expr || /^[0０]+$/.test(expr)) return null;
    if (/每小時/.test(expr) && !/\d{4,}/.test(expr.replace(/[,\s　]/g, ""))) {
      return null;
    }

    if (/=/.test(expr)) {
      var rhs = expr.split("=").pop().replace(/\*/g, " ").trim();
      var spaced = rhs.match(/(?:\d{1,3}(?:[,\s　]\d{3})+|\d{4,})/);
      var nEq = normalizeMoneyToken(spaced ? spaced[0] : rhs);
      if (nEq) return nEq;
    }

    var totalShare = expr.match(/共\s*(?:NT\$?|\$)?\s*([\d,\s　]{3,})/i);
    if (totalShare) {
      var nShare = normalizeMoneyToken(totalShare[1]);
      if (nShare) return nShare;
    }

    if (/[＋+]/.test(expr)) {
      var parts = expr.split(/[＋+]/);
      var nums = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (/加時/.test(part) && !/\d{4,}/.test(part.replace(/[,\s　]/g, ""))) {
          continue;
        }
        var mPlus = part.match(/(?:NT\$?|\$)?\s*(\d{1,3}(?:[,\s　]\d{3})+|\d{3,})/i);
        if (mPlus) {
          var nPlus = normalizeMoneyToken(mPlus[1], nums.length ? 100 : 1000);
          if (nPlus) nums.push(nPlus);
        }
      }
      if (nums.length >= 2) {
        return nums.reduce(function (a, b) {
          return a + b;
        }, 0);
      }
      if (nums.length === 1) return nums[0];
    }

    var cashTokens = [];
    var cashRe = /(?:NT\$?|\$)\s*([\d,\s　]+)/gi;
    var cm;
    while ((cm = cashRe.exec(expr)) !== null) {
      var nCash = normalizeMoneyToken(cm[1]);
      if (nCash) cashTokens.push(nCash);
    }
    if (cashTokens.length) return Math.max.apply(null, cashTokens);

    var mul = expr.match(/(\d{4,})\s*\*\s*(\d{1,2})\b/);
    if (mul) {
      var a = parseInt(mul[1], 10);
      var b = parseInt(mul[2], 10);
      if (a >= 1000 && b >= 2 && b <= 30) return a * b;
    }

    var plain = expr.match(/(\d{1,3}(?:[,\s　]\d{3})+|\d{4,})/);
    if (plain) {
      var nPlain = normalizeMoneyToken(plain[1]);
      if (nPlain) return nPlain;
    }

    return null;
  }

  function eventText(ev) {
    return [ev.summary, ev.description, ev.comment].filter(Boolean).join("\n");
  }

  function resolveCalendarPrice(ev) {
    if (typeof ev.statedPrice === "number" && ev.statedPrice > 0) {
      return ev.statedPrice;
    }
    return parseStatedPriceFromText(eventText(ev), ev.bookingSource);
  }

  function isPrivateEvent(ev) {
    if (ev.isPrivate) return true;
    return /私[訂定]|私下|(?:^|[\s　])私(?:$|[\s　])/.test(eventText(ev));
  }

  function tentRoomCount(ev) {
    var count = 0;
    if (ev.roomTags.indexOf("cloud") !== -1) count += 1;
    if (ev.roomTags.indexOf("balloon") !== -1) count += 1;
    return Math.max(count, 1);
  }

  function eventNights(ev) {
    var nights = ev.nights != null ? Number(ev.nights) : 1;
    if (!nights || nights < 1) nights = 1;
    return nights;
  }

  /** 帳篷：單間每晚 × 間數 × 晚數；露營車：三天兩夜基本價，每多一天 +extra */
  function computeDefaultPrice(ev, rules) {
    var nights = eventNights(ev);
    if (isRvEvent(ev)) {
      if (nights <= rules.rvBaseNights) return rules.rvBase;
      return rules.rvBase + (nights - rules.rvBaseNights) * rules.rvExtraDay;
    }
    return tentRoomCount(ev) * nights * rules.tentNightly;
  }

  function eventKind(ev) {
    return isRvEvent(ev) ? "rv" : "tent";
  }

  function roomCss(ev) {
    if (isRvEvent(ev)) return "rv";
    if (
      ev.roomTags.indexOf("balloon") !== -1 &&
      ev.roomTags.indexOf("cloud") === -1
    ) {
      return "balloon";
    }
    if (
      ev.roomTags.indexOf("cloud") !== -1 &&
      ev.roomTags.indexOf("balloon") === -1
    ) {
      return "cloud";
    }
    if (
      ev.roomTags.indexOf("cloud") !== -1 &&
      ev.roomTags.indexOf("balloon") !== -1
    ) {
      return "balloon";
    }
    return "cloud";
  }

  function roomLabelShort(ev) {
    if (isRvEvent(ev)) return "露營車";
    var labels = [];
    if (ev.roomTags.indexOf("cloud") !== -1) labels.push("雲朵");
    if (ev.roomTags.indexOf("balloon") !== -1) labels.push("熱氣球");
    return labels.join("＋") || "住宿";
  }

  function getEventPrice(ev, rules, overrides) {
    if (isRvNonRentalNote(ev)) {
      return {
        amount: 0,
        source: "note",
        overridden: false
      };
    }
    if (Object.prototype.hasOwnProperty.call(overrides, ev.id)) {
      return {
        amount: Math.max(0, Number(overrides[ev.id]) || 0),
        source: "manual",
        overridden: true
      };
    }
    var calendarPrice = resolveCalendarPrice(ev);
    if (calendarPrice != null) {
      return {
        amount: calendarPrice,
        source: "calendar",
        overridden: false
      };
    }
    return {
      amount: computeDefaultPrice(ev, rules),
      source: "estimate",
      overridden: false
    };
  }

  function apiFetch(path) {
    return fetch(API_BASE + path, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" }
    }).then(function (res) {
      return res.json().then(function (data) {
        return { res: res, data: data };
      });
    });
  }

  function updateRangeLabel() {
    if (!rangeLabel) return;
    rangeLabel.textContent =
      "載入區間：" +
      (rangeFromYmd || "—") +
      " ～ " +
      (rangeUntilYmd || "—") +
      "（自今年二月起）";
  }

  function summarizeEvents(events, rules, overrides) {
    var total = 0;
    var tent = 0;
    var rv = 0;
    revenueEvents(events).forEach(function (ev) {
      var price = getEventPrice(ev, rules, overrides).amount;
      total += price;
      if (eventKind(ev) === "rv") rv += price;
      else tent += price;
    });
    return { total: total, tent: tent, rv: rv };
  }

  function updateSummary(events, rules, overrides) {
    var sum = summarizeEvents(events, rules, overrides);
    sumTotal.textContent = formatMoney(sum.total);
    sumTent.textContent = formatMoney(sum.tent);
    sumRv.textContent = formatMoney(sum.rv);
  }

  function eventsInMonth(events, year, month0) {
    var prefix = year + "-" + pad2(month0 + 1);
    return events.filter(function (ev) {
      return ev.checkInYmd && ev.checkInYmd.indexOf(prefix) === 0;
    });
  }

  function renderMonthBreakdown(months, rules, overrides) {
    if (!monthTableEl) return;
    if (!months.length) {
      monthTableEl.innerHTML = '<p class="staff-empty">尚無月份資料。</p>';
      return;
    }
    var rows = months
      .map(function (mo) {
        var monthEvents = eventsInMonth(eventsCache, mo.y, mo.m);
        var sum = summarizeEvents(monthEvents, rules, overrides);
        var count = revenueEvents(monthEvents).length;
        var id = "revenue-month-" + mo.y + "-" + pad2(mo.m + 1);
        return (
          "<tr>" +
          '<td><a href="#' +
          id +
          '">' +
          escapeHtml(String(mo.y)) +
          " 年 " +
          escapeHtml(String(mo.m + 1)) +
          " 月</a></td>" +
          "<td>" +
          count +
          "</td>" +
          "<td>" +
          escapeHtml(formatMoney(sum.tent)) +
          "</td>" +
          "<td>" +
          escapeHtml(formatMoney(sum.rv)) +
          "</td>" +
          '<td class="admin-month-table__total">' +
          escapeHtml(formatMoney(sum.total)) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    monthTableEl.innerHTML =
      '<table class="admin-month-table">' +
      "<thead><tr>" +
      "<th>月份</th><th>案件</th><th>住宿</th><th>露營車</th><th>合計</th>" +
      "</tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table>";
  }

  /** 一週自週一開始（欄位 0＝週一 … 欄位 6＝週日） */
  function buildMonthCells(year, month) {
    var first = new Date(year, month, 1);
    var pad = (first.getDay() + 6) % 7;
    var dim = new Date(year, month + 1, 0).getDate();
    var cells = [];
    var i;
    var pm = month - 1;
    var py = year;
    if (pm < 0) {
      pm = 11;
      py--;
    }
    var pDim = new Date(py, pm + 1, 0).getDate();
    for (i = 0; i < pad; i++) {
      cells.push({ y: py, m: pm, d: pDim - pad + i + 1, inMonth: false });
    }
    for (var d = 1; d <= dim; d++) {
      cells.push({ y: year, m: month, d: d, inMonth: true });
    }
    var nd = 1;
    var nm = month + 1;
    var ny = year;
    if (nm > 11) {
      nm = 0;
      ny++;
    }
    while (cells.length % 7 !== 0) {
      cells.push({ y: ny, m: nm, d: nd++, inMonth: false });
    }
    return cells;
  }

  function eventsByCheckInYmd(events) {
    var map = {};
    revenueEvents(events).forEach(function (ev) {
      var key = ev.checkInYmd || "";
      if (!key) return;
      if (!map[key]) map[key] = [];
      if (
        map[key].some(function (existing) {
          return existing.id === ev.id;
        })
      ) {
        return;
      }
      map[key].push(ev);
    });
    return map;
  }

  function renderRevenueLine(ev, rules, overrides) {
    var priceInfo = getEventPrice(ev, rules, overrides);
    var css = roomCss(ev);
    var nights = eventNights(ev);
    var title = (ev.summary || "").replace(/\s+/g, " ").trim();
    if (title.length > 18) title = title.slice(0, 18) + "…";
    var sourceLabel =
      priceInfo.source === "manual"
        ? "手動"
        : priceInfo.source === "calendar"
          ? "行事曆"
          : "估算";
    var sourceClass =
      priceInfo.source === "manual"
        ? " admin-revenue-line--manual"
        : priceInfo.source === "calendar"
          ? " admin-revenue-line--calendar"
          : " admin-revenue-line--estimate";
    if (isPrivateEvent(ev)) sourceClass += " admin-revenue-line--private";

    return (
      '<div class="availability-line availability-line--booked availability-line--' +
      escapeHtml(css) +
      " admin-revenue-line" +
      sourceClass +
      '" data-event-id="' +
      escapeHtml(ev.id) +
      '" title="' +
      escapeHtml(
        (ev.summary || "") +
          "｜" +
          nights +
          " 晚｜" +
          formatMoney(priceInfo.amount) +
          "（" +
          sourceLabel +
          "）"
      ) +
      '">' +
      '<span class="availability-line__bar" aria-hidden="true"></span>' +
      '<div class="availability-line__inner admin-revenue-line__inner">' +
      '<span class="availability-line__name">' +
      escapeHtml(roomLabelShort(ev)) +
      (isPrivateEvent(ev) ? "·私" : "") +
      "</span>" +
      '<span class="admin-revenue-source">' +
      escapeHtml(sourceLabel) +
      "</span>" +
      '<label class="admin-revenue-line__price">' +
      '<span class="visually-hidden">收入金額</span>' +
      '<span class="admin-revenue-line__currency">$</span>' +
      '<input type="number" min="0" step="100" class="admin-price-input" value="' +
      escapeHtml(String(priceInfo.amount)) +
      '">' +
      "</label>" +
      "</div>" +
      (title
        ? '<p class="admin-revenue-line__title">' + escapeHtml(title) + "</p>"
        : "") +
      "</div>"
    );
  }

  function renderDayCell(cell, byCheckIn, rules, overrides) {
    if (!cell.inMonth) {
      return (
        '<div class="availability-cal-cell availability-cal-cell--pad">' +
        '<span class="availability-cal-daynum">' +
        cell.d +
        "</span>" +
        "</div>"
      );
    }

    var ymd = toYmd(cell.y, cell.m, cell.d);
    var dayEvents = byCheckIn[ymd] || [];
    var now = new Date();
    var isToday =
      now.getFullYear() === cell.y &&
      now.getMonth() === cell.m &&
      now.getDate() === cell.d;
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var cellDate = new Date(cell.y, cell.m, cell.d);
    var isPast = cellDate < todayStart;

    var dayTotal = dayEvents.reduce(function (sum, ev) {
      return sum + getEventPrice(ev, rules, overrides).amount;
    }, 0);

    var cls = "availability-cal-cell availability-cal-cell--day";
    if (isToday) cls += " availability-cal-cell--today";
    if (isPast) cls += " availability-cal-cell--past";
    if (dayEvents.length) cls += " availability-cal-cell--has-lines admin-revenue-cell--has-booking";

    var linesHtml = dayEvents
      .map(function (ev) {
        return renderRevenueLine(ev, rules, overrides);
      })
      .join("");

    return (
      '<div class="' +
      cls +
      '">' +
      '<div class="admin-revenue-cell__top">' +
      '<span class="availability-cal-daynum">' +
      cell.d +
      "</span>" +
      (dayEvents.length
        ? '<span class="admin-revenue-cell__day-total">' +
          escapeHtml(formatMoney(dayTotal)) +
          "</span>"
        : "") +
      "</div>" +
      (linesHtml
        ? '<div class="availability-cal-lines">' + linesHtml + "</div>"
        : "") +
      "</div>"
    );
  }

  function renderOneMonth(year, month, byCheckIn, rules, overrides) {
    var cells = buildMonthCells(year, month);
    var headHtml = WEEKDAY_HEAD.map(function (h) {
      return '<div class="availability-cal-headcell">' + h + "</div>";
    }).join("");
    var bodyHtml = cells
      .map(function (cell) {
        return renderDayCell(cell, byCheckIn, rules, overrides);
      })
      .join("");
    var monthEvents = eventsInMonth(eventsCache, year, month);
    var sum = summarizeEvents(monthEvents, rules, overrides);
    var id = "revenue-month-" + year + "-" + pad2(month + 1);

    return (
      '<div class="availability-month" id="' +
      id +
      '">' +
      '<h3 class="availability-month-title">' +
      escapeHtml(String(year)) +
      " 年 " +
      escapeHtml(String(month + 1)) +
      " 月</h3>" +
      '<p class="admin-month-subtotal">本月合計 ' +
      escapeHtml(formatMoney(sum.total)) +
      "（住宿 " +
      escapeHtml(formatMoney(sum.tent)) +
      "／露營車 " +
      escapeHtml(formatMoney(sum.rv)) +
      "）</p>" +
      '<div class="availability-cal" aria-label="' +
      escapeHtml(String(year)) +
      " 年 " +
      escapeHtml(String(month + 1)) +
      ' 月營業額">' +
      '<div class="availability-cal-head">' +
      headHtml +
      "</div>" +
      '<div class="availability-cal-body">' +
      bodyHtml +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function renderMonthCalendar() {
    var rules = loadRules();
    var overrides = loadOverrides();
    var report = getReportRange();
    updateSummary(eventsCache, rules, overrides);

    var months = listReportMonths(eventsCache, report.year);
    renderMonthBreakdown(months, rules, overrides);

    var byCheckIn = eventsByCheckInYmd(eventsCache);
    var calendarsHtml = months
      .map(function (mo) {
        return renderOneMonth(mo.y, mo.m, byCheckIn, rules, overrides);
      })
      .join("");

    eventsEl.innerHTML =
      '<div class="availability-calendars admin-revenue-calendars">' +
      calendarsHtml +
      "</div>";
  }

  function bindPriceInputs() {
    eventsEl.querySelectorAll(".admin-price-input").forEach(function (input) {
      input.addEventListener("change", function () {
        var line = input.closest("[data-event-id]");
        if (!line) return;
        var id = line.getAttribute("data-event-id");
        var amount = Math.max(0, Number(input.value) || 0);
        var overrides = loadOverrides();
        overrides[id] = amount;
        saveOverrides(overrides);
        renderAll();
      });
      input.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
  }

  function renderAll() {
    renderMonthCalendar();
    bindPriceInputs();
  }

  function loadEvents() {
    var report = getReportRange();
    rangeFromYmd = report.fromYmd;
    rangeUntilYmd = report.untilYmd;
    statusEl.textContent = "載入中…";
    showFetchError("");
    updateRangeLabel();

    return apiFetch(
      "/staff-calendar/events?from=" +
        encodeURIComponent(rangeFromYmd) +
        "&until=" +
        encodeURIComponent(rangeUntilYmd)
    )
      .then(function (result) {
        if (!result.data.ok) {
          throw new Error(result.data.error || "載入失敗");
        }
        eventsCache = result.data.events || [];
        var counted = revenueEvents(eventsCache).length;
        var skipped = eventsCache.length - counted;
        statusEl.textContent =
          "計入案件 " +
          counted +
          " 筆" +
          (skipped
            ? "（略過露營車備註／單日 " + skipped + " 筆）"
            : "") +
          "（更新時間：" +
          (result.data.fetchedAt || "") +
          "）";
        renderAll();
      })
      .catch(function (err) {
        statusEl.textContent = "";
        showFetchError(err.message || "無法載入資料");
      });
  }

  fillRulesInputs(loadRules());

  applyBtn.addEventListener("click", function () {
    var rules = readRulesFromInputs();
    saveRules(rules);
    fillRulesInputs(rules);
    renderAll();
  });

  resetOverridesBtn.addEventListener("click", function () {
    var overrides = loadOverrides();
    var changed = false;
    eventsCache.forEach(function (ev) {
      if (Object.prototype.hasOwnProperty.call(overrides, ev.id)) {
        delete overrides[ev.id];
        changed = true;
      }
    });
    if (changed) saveOverrides(overrides);
    renderAll();
  });

  refreshBtn.addEventListener("click", function () {
    loadEvents();
  });

  loadEvents();
})();

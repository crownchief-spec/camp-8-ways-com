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
  var viewYear = 0;
  var viewMonth = 0; // 0-11

  var statusEl = document.getElementById("revenue-status");
  var fetchError = document.getElementById("revenue-fetch-error");
  var eventsEl = document.getElementById("revenue-events");
  var refreshBtn = document.getElementById("revenue-refresh-btn");
  var monthLabel = document.getElementById("month-label");
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
    if (Object.prototype.hasOwnProperty.call(overrides, ev.id)) {
      return {
        amount: Math.max(0, Number(overrides[ev.id]) || 0),
        overridden: true
      };
    }
    return {
      amount: computeDefaultPrice(ev, rules),
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

  function updateMonthLabel() {
    monthLabel.textContent = viewYear + " 年 " + (viewMonth + 1) + " 月";
  }

  function updateSummary(events, rules, overrides) {
    var total = 0;
    var tent = 0;
    var rv = 0;
    events.forEach(function (ev) {
      var price = getEventPrice(ev, rules, overrides).amount;
      total += price;
      if (eventKind(ev) === "rv") rv += price;
      else tent += price;
    });
    sumTotal.textContent = formatMoney(total);
    sumTent.textContent = formatMoney(tent);
    sumRv.textContent = formatMoney(rv);
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
    events.forEach(function (ev) {
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

    return (
      '<div class="availability-line availability-line--booked availability-line--' +
      escapeHtml(css) +
      ' admin-revenue-line' +
      (priceInfo.overridden ? " admin-revenue-line--override" : "") +
      '" data-event-id="' +
      escapeHtml(ev.id) +
      '" title="' +
      escapeHtml(
        (ev.summary || "") +
          "｜" +
          nights +
          " 晚｜" +
          formatMoney(priceInfo.amount) +
          (priceInfo.overridden ? "（已覆寫）" : "")
      ) +
      '">' +
      '<span class="availability-line__bar" aria-hidden="true"></span>' +
      '<div class="availability-line__inner admin-revenue-line__inner">' +
      '<span class="availability-line__name">' +
      escapeHtml(roomLabelShort(ev)) +
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

  function renderMonthCalendar() {
    var rules = loadRules();
    var overrides = loadOverrides();
    updateSummary(eventsCache, rules, overrides);

    var byCheckIn = eventsByCheckInYmd(eventsCache);
    var cells = buildMonthCells(viewYear, viewMonth);
    var headHtml = WEEKDAY_HEAD.map(function (h) {
      return '<div class="availability-cal-headcell">' + h + "</div>";
    }).join("");
    var bodyHtml = cells
      .map(function (cell) {
        return renderDayCell(cell, byCheckIn, rules, overrides);
      })
      .join("");

    eventsEl.innerHTML =
      '<div class="availability-calendars admin-revenue-calendars">' +
      '<div class="availability-month">' +
      '<div class="availability-cal" aria-label="營業額月曆">' +
      '<div class="availability-cal-head">' +
      headHtml +
      "</div>" +
      '<div class="availability-cal-body">' +
      bodyHtml +
      "</div>" +
      "</div>" +
      "</div>" +
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
    var range = monthRange(viewYear, viewMonth);
    statusEl.textContent = "載入中…";
    showFetchError("");
    updateMonthLabel();

    return apiFetch(
      "/staff-calendar/events?from=" +
        encodeURIComponent(range.fromYmd) +
        "&until=" +
        encodeURIComponent(range.untilYmd)
    )
      .then(function (result) {
        if (!result.data.ok) {
          throw new Error(result.data.error || "載入失敗");
        }
        eventsCache = result.data.events || [];
        statusEl.textContent =
          "本月入住案件 " +
          eventsCache.length +
          " 筆（更新時間：" +
          (result.data.fetchedAt || "") +
          "）";
        renderAll();
      })
      .catch(function (err) {
        statusEl.textContent = "";
        showFetchError(err.message || "無法載入資料");
      });
  }

  function shiftMonth(delta) {
    var d = new Date(viewYear, viewMonth + delta, 1);
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    loadEvents();
  }

  (function initMonth() {
    var now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
  })();

  fillRulesInputs(loadRules());

  document.getElementById("month-prev-btn").addEventListener("click", function () {
    shiftMonth(-1);
  });
  document.getElementById("month-next-btn").addEventListener("click", function () {
    shiftMonth(1);
  });
  document.getElementById("month-today-btn").addEventListener("click", function () {
    var now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    loadEvents();
  });

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

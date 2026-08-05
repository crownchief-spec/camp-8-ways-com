(function () {
  var Gate = window.JoyforestAdminGate;
  if (!Gate || !Gate.requireAuth("admin.html")) return;

  var API_BASE = "/api";
  var RULES_KEY = "joyforest_admin_pricing_rules";
  var OVERRIDES_KEY = "joyforest_admin_price_overrides";
  var WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

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

  function formatMultiline(text) {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }

  function showFetchError(msg) {
    fetchError.textContent = msg || "";
    fetchError.hidden = !msg;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function ymKey(y, m0) {
    return y + "-" + pad2(m0 + 1);
  }

  function monthRange(y, m0) {
    var fromYmd = y + "-" + pad2(m0 + 1) + "-01";
    var lastDay = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
    var untilYmd = y + "-" + pad2(m0 + 1) + "-" + pad2(lastDay);
    return { fromYmd: fromYmd, untilYmd: untilYmd };
  }

  function formatMoney(n) {
    var num = Math.round(Number(n) || 0);
    return "$" + num.toLocaleString("en-US");
  }

  function formatYmdLabel(ymd) {
    if (!ymd) return "";
    var parts = ymd.split("-");
    return parseInt(parts[1], 10) + " 月 " + parseInt(parts[2], 10) + " 日";
  }

  function weekdayLabel(ymd) {
    var parts = ymd.split("-").map(function (n) {
      return parseInt(n, 10);
    });
    var dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return WEEKDAYS[dt.getDay()];
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

  function roomLabelText(ev) {
    if (isRvEvent(ev)) return "露營車";
    var labels = [];
    if (ev.roomTags.indexOf("cloud") !== -1) labels.push("雲朵房");
    if (ev.roomTags.indexOf("balloon") !== -1) labels.push("熱氣球房");
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

  function groupByCheckIn(events) {
    var map = {};
    events.forEach(function (ev) {
      var key = ev.checkInYmd || "";
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return Object.keys(map)
      .sort()
      .map(function (ymd) {
        return { ymd: ymd, events: map[ymd] };
      });
  }

  function renderBookingCard(ev, rules, overrides) {
    var priceInfo = getEventPrice(ev, rules, overrides);
    var nights = eventNights(ev);
    var kind = eventKind(ev);
    var formulaHint =
      kind === "rv"
        ? nights <= rules.rvBaseNights
          ? "露營車基本價（≤" + rules.rvBaseNights + " 晚）"
          : "基本價 + " + (nights - rules.rvBaseNights) + " 天 × $" + rules.rvExtraDay
        : tentRoomCount(ev) +
          " 間 × " +
          nights +
          " 晚 × $" +
          rules.tentNightly;

    return (
      '<article class="staff-day-booking admin-revenue-booking" data-event-id="' +
      escapeHtml(ev.id) +
      '">' +
      '<div class="staff-day-booking__top">' +
      '<span class="staff-tag staff-tag--' +
      escapeHtml(kind === "rv" ? "rv" : ev.roomTags.indexOf("balloon") !== -1 && ev.roomTags.indexOf("cloud") === -1 ? "balloon" : "cloud") +
      '">' +
      escapeHtml(roomLabelText(ev)) +
      "</span>" +
      '<span class="staff-day-booking__nights">' +
      escapeHtml(String(nights)) +
      " 晚</span>" +
      "</div>" +
      '<h3 class="staff-day-booking__title">' +
      formatMultiline(ev.summary || "（無標題）") +
      "</h3>" +
      '<p class="staff-day-booking__meta">退房：' +
      escapeHtml(ev.checkOutYmd || "—") +
      (ev.bookingSource
        ? "｜來源：" + escapeHtml(ev.bookingSource)
        : "") +
      "</p>" +
      '<p class="admin-price-hint">' +
      escapeHtml(formulaHint) +
      (priceInfo.overridden ? "｜已手動覆寫" : "") +
      "</p>" +
      '<label class="admin-price-edit">' +
      "<span>收入金額</span>" +
      '<input type="number" min="0" step="100" class="admin-price-input" value="' +
      escapeHtml(String(priceInfo.amount)) +
      '">' +
      "</label>" +
      "</article>"
    );
  }

  function renderDayGrid() {
    var rules = loadRules();
    var overrides = loadOverrides();
    updateSummary(eventsCache, rules, overrides);

    if (!eventsCache.length) {
      eventsEl.innerHTML =
        '<p class="staff-empty">本月尚無入住案件。</p>';
      return;
    }

    var tentEvents = eventsCache.filter(function (ev) {
      return !isRvEvent(ev);
    });
    var rvEvents = eventsCache.filter(isRvEvent);
    var groups = groupByCheckIn(tentEvents);

    var rows = groups.map(function (group) {
      var cloud = group.events.filter(function (ev) {
        return ev.roomTags.indexOf("cloud") !== -1;
      });
      var balloon = group.events.filter(function (ev) {
        return ev.roomTags.indexOf("balloon") !== -1;
      });
      // 包場（同時有兩標籤）只算一次收入，放在「兩邊」列顯示
      var seen = {};
      var unique = [];
      group.events.forEach(function (ev) {
        if (seen[ev.id]) return;
        seen[ev.id] = true;
        unique.push(ev);
      });

      var both =
        unique.some(function (ev) {
          return (
            ev.roomTags.indexOf("cloud") !== -1 &&
            ev.roomTags.indexOf("balloon") !== -1
          );
        }) ||
        (cloud.length && balloon.length);

      return (
        '<div class="staff-day-row' +
        (both ? " staff-day-row--both" : "") +
        '">' +
        '<div class="staff-day-col staff-day-col--date">' +
        '<p class="staff-day-date">' +
        escapeHtml(formatYmdLabel(group.ymd)) +
        "</p>" +
        '<p class="staff-day-weekday">週' +
        escapeHtml(weekdayLabel(group.ymd)) +
        "</p>" +
        '<p class="admin-day-subtotal">當日住宿 ' +
        escapeHtml(
          formatMoney(
            unique.reduce(function (sum, ev) {
              return sum + getEventPrice(ev, rules, overrides).amount;
            }, 0)
          )
        ) +
        "</p>" +
        "</div>" +
        '<div class="staff-day-col staff-day-col--bookings">' +
        unique.map(function (ev) {
          return renderBookingCard(ev, rules, overrides);
        }).join("") +
        "</div>" +
        "</div>"
      );
    });

    var rvHtml = "";
    if (rvEvents.length) {
      var rvGroups = groupByCheckIn(rvEvents);
      rvHtml =
        '<section class="staff-rv-section">' +
        "<h2>露營車</h2>" +
        '<div class="staff-rv-list">' +
        rvGroups
          .map(function (group) {
            return (
              '<div class="admin-rv-day">' +
              '<p class="admin-rv-day__date">' +
              escapeHtml(formatYmdLabel(group.ymd)) +
              "（週" +
              escapeHtml(weekdayLabel(group.ymd)) +
              "）</p>" +
              group.events
                .map(function (ev) {
                  return renderBookingCard(ev, rules, overrides);
                })
                .join("") +
              "</div>"
            );
          })
          .join("") +
        "</div>" +
        "</section>";
    }

    eventsEl.innerHTML =
      '<div class="staff-day-table admin-revenue-table" role="table" aria-label="本月住宿收入">' +
      (rows.length
        ? '<div class="staff-day-head admin-revenue-head" role="row">' +
          '<div class="staff-day-col staff-day-col--date" role="columnheader">入住日</div>' +
          '<div class="staff-day-col staff-day-col--bookings" role="columnheader">住宿案件與收入</div>' +
          "</div>" +
          rows.join("")
        : '<p class="staff-empty">本月無帳篷住宿案件。</p>') +
      "</div>" +
      rvHtml;
  }

  function bindPriceInputs() {
    eventsEl.querySelectorAll(".admin-price-input").forEach(function (input) {
      input.addEventListener("change", function () {
        var card = input.closest("[data-event-id]");
        if (!card) return;
        var id = card.getAttribute("data-event-id");
        var amount = Math.max(0, Number(input.value) || 0);
        var overrides = loadOverrides();
        overrides[id] = amount;
        saveOverrides(overrides);
        renderDayGrid();
        bindPriceInputs();
      });
    });
  }

  function renderAll() {
    renderDayGrid();
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

  // init month = current
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

/**
 * 讀取站內 Google Calendar iCal（.ics），依標題與說明內部分類（不對外顯示原文）：
 * 含「熱氣球」→ 熱氣球房｜含「雲朵」→ 雲朵房｜含「露營車」→ 露營車
 *
 * 價格／連假規則由 assets/js/camp-calendar-pricing.js（TypeScript 編譯）提供 window.CampCalendarPricing。
 */
(function () {
  var ROOM_ORDER = [
    { id: "balloon", label: "熱氣球房", css: "balloon" },
    { id: "cloud", label: "雲朵房", css: "cloud" },
    { id: "rv", label: "露營車", css: "rv" }
  ];

  function unfoldIcs(text) {
    return text.replace(/\r\n/g, "\n").replace(/\n[\t ]/g, "");
  }

  function parseProps(block) {
    var props = {};
    var lines = block.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var idx = line.indexOf(":");
      if (idx === -1) continue;
      var keyPart = line.slice(0, idx);
      var value = line.slice(idx + 1);
      var key = keyPart.split(";")[0];
      if (!props[key]) props[key] = { keyPart: keyPart, value: value };
    }
    return props;
  }

  function parseIcsDate(prop) {
    if (!prop) return null;
    var keyPart = prop.keyPart;
    var value = prop.value.trim();
    if (keyPart.indexOf("VALUE=DATE") !== -1) {
      var y = parseInt(value.slice(0, 4), 10);
      var m = parseInt(value.slice(4, 6), 10) - 1;
      var d = parseInt(value.slice(6, 8), 10);
      return new Date(y, m, d, 0, 0, 0, 0);
    }
    if (/^\d{8}T\d{6}Z?$/.test(value)) {
      var ds = value.slice(0, 8);
      var ts = value.slice(9, 15);
      var iso =
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
        (value.indexOf("Z") !== -1 ? "Z" : "");
      return new Date(iso);
    }
    var t = Date.parse(value);
    return isNaN(t) ? null : new Date(t);
  }

  function classifyTags(summary, description) {
    var text = (summary || "") + "\n" + (description || "");
    var tags = [];
    if (text.indexOf("熱氣球") !== -1) tags.push("balloon");
    if (text.indexOf("雲朵") !== -1) tags.push("cloud");
    if (text.indexOf("露營車") !== -1) tags.push("rv");
    return tags;
  }

  function parseEvents(icsText) {
    var raw = unfoldIcs(icsText);
    var parts = raw.split(/BEGIN:VEVENT\r?\n/);
    var events = [];
    for (var p = 1; p < parts.length; p++) {
      var chunk = parts[p].split(/END:VEVENT/)[0];
      var props = parseProps(chunk);
      var summary = props.SUMMARY ? props.SUMMARY.value : "";
      var description = props.DESCRIPTION ? props.DESCRIPTION.value : "";
      var tags = classifyTags(summary, description);
      if (!tags.length) continue;

      var dtStart = props.DTSTART ? parseIcsDate(props.DTSTART) : null;
      var dtEnd = props.DTEND ? parseIcsDate(props.DTEND) : null;
      if (!dtStart) continue;

      var isAllDay = props.DTSTART && props.DTSTART.keyPart.indexOf("VALUE=DATE") !== -1;
      if (!dtEnd) {
        dtEnd = new Date(dtStart.getTime());
        if (isAllDay) dtEnd.setDate(dtEnd.getDate() + 1);
      }

      events.push({
        tags: tags,
        start: dtStart,
        end: dtEnd,
        isAllDay: isAllDay
      });
    }
    return events;
  }

  /** 保留足夠時間範圍供月份範圍與預訂重疊計算 */
  function filterWindow(events) {
    var now = new Date();
    var past = new Date(now.getFullYear() - 1, 0, 1);
    var future = new Date(now.getFullYear() + 3, 11, 31);
    return events.filter(function (ev) {
      return ev.end > past && ev.start < future;
    });
  }

  function eventOverlapsLocalDay(ev, y, m, day) {
    var dayStart = new Date(y, m, day, 0, 0, 0, 0);
    var dayEnd = new Date(y, m, day + 1, 0, 0, 0, 0);
    return ev.end > dayStart && ev.start < dayEnd;
  }

  function dayStatusForRoom(events, y, m, day, roomId) {
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev.tags.indexOf(roomId) === -1) continue;
      if (eventOverlapsLocalDay(ev, y, m, day)) return true;
    }
    return false;
  }

  function buildMonthCells(year, month) {
    var first = new Date(year, month, 1);
    var pad = first.getDay();
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

  function isSameLocalDate(a, y, m, d) {
    return a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;
  }

  function renderBookedRow(roomCss, label) {
    return (
      '<div class="availability-booking-row availability-booking-row--booked availability-booking-row--' +
      roomCss +
      '">' +
      '<span class="availability-booking-swatch" aria-hidden="true"></span>' +
      '<span class="availability-booking-text">' +
      '<span class="availability-booking-name">' +
      label +
      "</span>" +
      '<span class="availability-booking-status">已預訂</span>' +
      "</span>" +
      "</div>"
    );
  }

  function renderPriceRow(roomCss, label, formattedPrice) {
    return (
      '<div class="availability-booking-row availability-booking-row--price availability-booking-row--' +
      roomCss +
      '">' +
      '<span class="availability-booking-swatch" aria-hidden="true"></span>' +
      '<span class="availability-booking-text">' +
      '<span class="availability-booking-name">' +
      label +
      "</span>" +
      '<span class="availability-booking-price">' +
      formattedPrice +
      "</span>" +
      "</span>" +
      "</div>"
    );
  }

  function renderDayLines(y, m, d, events, inMonth, api) {
    if (!inMonth) {
      return (
        '<div class="availability-cal-cell availability-cal-cell--pad">' +
        '<span class="availability-cal-daynum">' +
        d +
        "</span>" +
        "</div>"
      );
    }

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var cellDate = new Date(y, m, d);
    var showPrices = cellDate >= todayStart;

    var rowsHtml = "";
    var hasBooking = false;
    var hasPrice = false;
    var ri;
    for (ri = 0; ri < ROOM_ORDER.length; ri++) {
      var room = ROOM_ORDER[ri];
      var booked = dayStatusForRoom(events, y, m, d, room.id);
      if (booked) hasBooking = true;

      var disp = api.resolveResourceRowDisplay(room.id, y, m, d, booked);
      if (disp.kind === "booked") {
        rowsHtml += renderBookedRow(room.css, disp.label);
      } else if (disp.kind === "price" && showPrices) {
        hasPrice = true;
        rowsHtml += renderPriceRow(room.css, disp.label, disp.formattedPrice);
      }
    }

    var isToday = isSameLocalDate(now, y, m, d);
    var isPast = cellDate < todayStart;

    var cls = "availability-cal-cell";
    if (isToday) cls += " availability-cal-cell--today";
    if (isPast) cls += " availability-cal-cell--past";
    if (hasBooking) cls += " availability-cal-cell--booked";
    if (hasPrice) cls += " availability-cal-cell--priced";

    var linesWrap = rowsHtml
      ? '<div class="availability-cal-lines">' + rowsHtml + "</div>"
      : "";

    return (
      '<div class="' +
      cls +
      '">' +
      '<span class="availability-cal-daynum">' +
      d +
      "</span>" +
      linesWrap +
      "</div>"
    );
  }

  function renderOneMonth(year, month, events, api) {
    var title = year + " 年 " + (month + 1) + " 月";
    var cells = buildMonthCells(year, month);
    var head = ["日", "一", "二", "三", "四", "五", "六"];
    var headHtml = head
      .map(function (h) {
        return '<div class="availability-cal-headcell">' + h + "</div>";
      })
      .join("");
    var body = cells
      .map(function (cell) {
        return renderDayLines(cell.y, cell.m, cell.d, events, cell.inMonth, api);
      })
      .join("");
    return (
      '<div class="availability-month">' +
      '<h3 class="availability-month-title">' +
      title +
      "</h3>" +
      '<div class="availability-cal">' +
      '<div class="availability-cal-head">' +
      headHtml +
      "</div>" +
      '<div class="availability-cal-body">' +
      body +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function forEachMonthInRange(startYm, endYm, fn) {
    var y = startYm.y;
    var m = startYm.m;
    while (y < endYm.y || (y === endYm.y && m <= endYm.m)) {
      fn(y, m);
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  }

  function renderCalendars(container, events, api) {
    var range = api.computeCalendarMonthRange(events);
    var parts = [];
    forEachMonthInRange(range.startYm, range.endYm, function (y, m) {
      parts.push(renderOneMonth(y, m, events, api));
    });
    var html = '<div class="availability-calendars">' + parts.join("") + "</div>";
    container.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("availability-app");
    if (!root) return;
    var statusEl = root.querySelector("[data-availability-status]");
    var errEl = root.querySelector("[data-availability-error]");
    var tableMount = root.querySelector("[data-availability-table]");
    var icsUrl = root.getAttribute("data-ics-url") || "../data/calendar-basic.ics";

    if (typeof window.CampCalendarPricing === "undefined") {
      if (statusEl) statusEl.textContent = "";
      if (errEl) {
        errEl.style.display = "block";
        errEl.textContent =
          "價格模組未載入。請確認頁面已引入 camp-calendar-pricing.js，或重新整理後再試。";
      }
      console.error("CampCalendarPricing 未載入，請確認已引入 camp-calendar-pricing.js");
      return;
    }
    var api = window.CampCalendarPricing;

    statusEl.textContent = "載入中…";
    errEl.style.display = "none";
    errEl.textContent = "";

    fetch(icsUrl, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        var all = filterWindow(parseEvents(text));
        statusEl.textContent = "";
        renderCalendars(tableMount, all, api);
      })
      .catch(function (e) {
        statusEl.textContent = "";
        errEl.style.display = "block";
        errEl.innerHTML =
          "無法載入空房資料。請稍後再試，或請營主確認網站已部署日曆檔案。";
        console.warn(e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

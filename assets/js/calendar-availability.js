/**
 * 讀取站內 Google Calendar iCal（.ics），依標題與說明內部分類（不對外顯示原文）：
 * 含「熱氣球」→ 熱氣球房｜含「雲朵」→ 雲朵房｜含「露營車」→ 露營車
 * 僅以月曆呈現每日：有人／沒人、已出租／未出租。
 */
(function () {
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

  function filterWindow(events) {
    var now = new Date();
    var past = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    var future = new Date(now.getFullYear(), now.getMonth() + 5, 1);
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

  function renderDayLines(y, m, d, events, inMonth) {
    var balloon = dayStatusForRoom(events, y, m, d, "balloon");
    var cloud = dayStatusForRoom(events, y, m, d, "cloud");
    var rv = dayStatusForRoom(events, y, m, d, "rv");

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
    var isToday = isSameLocalDate(now, y, m, d);
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var cellDate = new Date(y, m, d);
    var isPast = cellDate < todayStart;

    var cls = "availability-cal-cell";
    if (isToday) cls += " availability-cal-cell--today";
    if (isPast) cls += " availability-cal-cell--past";

    function line(label, booked, mode) {
      var isFree = !booked;
      var rowCls = "availability-day-line";
      if (isFree) rowCls += " availability-day-line--free";
      else rowCls += " availability-day-line--busy";
      var val =
        mode === "rv"
          ? booked
            ? "已出租"
            : "未出租"
          : booked
            ? "有人"
            : "沒人";
      return (
        '<div class="' +
        rowCls +
        '"><span class="availability-day-label">' +
        label +
        '</span><span class="availability-day-val">' +
        val +
        "</span></div>"
      );
    }

    return (
      '<div class="' +
      cls +
      '">' +
      '<span class="availability-cal-daynum">' +
      d +
      "</span>" +
      '<div class="availability-cal-lines">' +
      line("熱氣球房", balloon, "tent") +
      line("雲朵房", cloud, "tent") +
      line("露營車", rv, "rv") +
      "</div>" +
      "</div>"
    );
  }

  function renderOneMonth(year, month, events) {
    var title =
      year +
      " 年 " +
      (month + 1) +
      " 月";
    var cells = buildMonthCells(year, month);
    var head = ["日", "一", "二", "三", "四", "五", "六"];
    var headHtml = head
      .map(function (h) {
        return '<div class="availability-cal-headcell">' + h + "</div>";
      })
      .join("");
    var body = cells
      .map(function (cell) {
        return renderDayLines(cell.y, cell.m, cell.d, events, cell.inMonth);
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

  function filterEventsForTwoMonths(events, y0, m0) {
    var rangeStart = new Date(y0, m0, 1, 0, 0, 0, 0);
    var rangeEnd = new Date(y0, m0 + 2, 1, 0, 0, 0, 0);
    return events.filter(function (ev) {
      return ev.end > rangeStart && ev.start < rangeEnd;
    });
  }

  function renderCalendars(container, events) {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    var y2 = y;
    var m2 = m + 1;
    if (m2 > 11) {
      m2 = 0;
      y2++;
    }
    var scoped = filterEventsForTwoMonths(events, y, m);
    var html =
      '<div class="availability-calendars">' +
      renderOneMonth(y, m, scoped) +
      renderOneMonth(y2, m2, scoped) +
      "</div>";
    container.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("availability-app");
    if (!root) return;
    var statusEl = root.querySelector("[data-availability-status]");
    var errEl = root.querySelector("[data-availability-error]");
    var tableMount = root.querySelector("[data-availability-table]");
    var icsUrl = root.getAttribute("data-ics-url") || "../data/calendar-basic.ics";

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
        renderCalendars(tableMount, all);
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

/**
 * 讀取站內同步的 Google Calendar iCal（.ics），依標題與說明文字判斷房型：
 * 含「熱氣球」→ 熱氣球房｜含「雲朵」→ 雲朵房｜含「露營車」→ 露營車
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
    if (text.indexOf("熱氣球") !== -1) tags.push({ id: "balloon", label: "熱氣球房" });
    if (text.indexOf("雲朵") !== -1) tags.push({ id: "cloud", label: "雲朵房" });
    if (text.indexOf("露營車") !== -1) tags.push({ id: "rv", label: "露營車" });
    return tags;
  }

  function formatRange(start, end, isAllDay) {
    if (!start) return "—";
    var opts = { year: "numeric", month: "numeric", day: "numeric" };
    if (!isAllDay && end && start.getTime() !== end.getTime()) {
      return (
        start.toLocaleString("zh-TW", opts) +
        " — " +
        end.toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
      );
    }
    if (isAllDay && end) {
      var endIncl = new Date(end.getTime());
      endIncl.setDate(endIncl.getDate() - 1);
      if (start.toDateString() === endIncl.toDateString()) {
        return start.toLocaleDateString("zh-TW", opts);
      }
      return start.toLocaleDateString("zh-TW", opts) + " — " + endIncl.toLocaleDateString("zh-TW", opts) + "（跨日）";
    }
    return start.toLocaleString("zh-TW", opts);
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
        summary: summary.replace(/\\,/g, ",").replace(/\\n/g, " "),
        tags: tags,
        start: dtStart,
        end: dtEnd,
        isAllDay: isAllDay,
        uid: props.UID ? props.UID.value : ""
      });
    }
    return events;
  }

  function filterWindow(events) {
    var now = new Date();
    var past = new Date(now.getTime());
    past.setDate(past.getDate() - 120);
    var future = new Date(now.getTime());
    future.setDate(future.getDate() + 600);
    return events.filter(function (ev) {
      return ev.end >= past && ev.start <= future;
    });
  }

  function sortByStartAsc(a, b) {
    return a.start - b.start;
  }

  function renderTable(container, events) {
    if (!events.length) {
      container.innerHTML = "<p class=\"availability-empty\">目前區間內沒有符合關鍵字的行程，或日曆尚未同步。</p>";
      return;
    }
    var rows = events
      .sort(sortByStartAsc)
      .map(function (ev) {
        var tagHtml = ev.tags
          .map(function (t) {
            return "<span class=\"availability-tag availability-tag--" + t.id + "\">" + t.label + "</span>";
          })
          .join(" ");
        return (
          "<tr><td>" +
          formatRange(ev.start, ev.end, ev.isAllDay) +
          "</td><td>" +
          tagHtml +
          "</td><td>" +
          escapeHtml(ev.summary) +
          "</td></tr>"
        );
      })
      .join("");
    container.innerHTML =
      "<div class=\"availability-table-wrap\"><table class=\"availability-table\"><thead><tr><th>日期／時間</th><th>房型</th><th>行程標題</th></tr></thead><tbody>" +
      rows +
      "</tbody></table></div>";
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function init() {
    var root = document.getElementById("availability-app");
    if (!root) return;
    var statusEl = root.querySelector("[data-availability-status]");
    var errEl = root.querySelector("[data-availability-error]");
    var tableMount = root.querySelector("[data-availability-table]");
    var icsUrl = root.getAttribute("data-ics-url") || "../data/calendar-basic.ics";

    statusEl.textContent = "載入日曆資料中…";
    errEl.style.display = "none";
    errEl.textContent = "";

    fetch(icsUrl, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (text) {
        var all = parseEvents(text);
        var filtered = filterWindow(all);
        statusEl.textContent =
          "共 " +
          filtered.length +
          " 筆與露營區房型相關的行程（已依日期篩選）。實際訂房請以 LINE 確認為準。";
        renderTable(tableMount, filtered);
      })
      .catch(function (e) {
        statusEl.textContent = "";
        errEl.style.display = "block";
        errEl.innerHTML =
          "無法載入日曆檔案。若您剛更新過專案，請確認已部署 <code>data/calendar-basic.ics</code>，或請營主執行 <code>scripts/sync-calendar-ics.sh</code> 後再上架。";
        console.warn(e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

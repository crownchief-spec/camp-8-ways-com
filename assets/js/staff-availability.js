(function () {
  var API_BASE = "/api";
  var eventsCache = [];
  var rangeFrom = "";
  var rangeUntil = "";
  var WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  var statusEl = document.getElementById("staff-status");
  var fetchError = document.getElementById("staff-fetch-error");
  var eventsEl = document.getElementById("staff-events");
  var refreshBtn = document.getElementById("staff-refresh-btn");

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

  function stayStatusLabel(status) {
    if (status === "check-in") return "入住";
    if (status === "staying") return "住宿中";
    if (status === "checked-out") return "退房";
    return status;
  }

  function formatYmdLabel(ymd) {
    if (!ymd) return "";
    var parts = ymd.split("-");
    return parseInt(parts[1], 10) + " 月 " + parseInt(parts[2], 10) + " 日";
  }

  function addDaysYmd(ymd, days) {
    var parts = ymd.split("-").map(function (n) {
      return parseInt(n, 10);
    });
    var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    return (
      dt.getUTCFullYear() +
      "-" +
      String(dt.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(dt.getUTCDate()).padStart(2, "0")
    );
  }

  function eachYmdInRange(fromYmd, untilYmd, fn) {
    var cur = fromYmd;
    while (cur <= untilYmd) {
      fn(cur);
      cur = addDaysYmd(cur, 1);
    }
  }

  function weekdayLabel(ymd) {
    var parts = ymd.split("-").map(function (n) {
      return parseInt(n, 10);
    });
    var dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return WEEKDAYS[dt.getDay()];
  }

  /** 以入住晚數占據日期：入住日起連續 nights 晚 */
  function eventOccupiesYmd(ev, ymd) {
    if (!ev.checkInYmd) return false;
    var nights = ev.nights != null ? ev.nights : 1;
    if (nights < 1) nights = 1;
    var lastNight = addDaysYmd(ev.checkInYmd, nights - 1);
    return ymd >= ev.checkInYmd && ymd <= lastNight;
  }

  function renderGuestInfo(ev) {
    var parts = [];
    if (ev.guestCount != null) parts.push(ev.guestCount + " 人");
    if (ev.adults != null || ev.children != null) {
      var sub = [];
      if (ev.adults != null) sub.push("成人 " + ev.adults);
      if (ev.children != null) sub.push("兒童 " + ev.children);
      parts.push(sub.join("／"));
    }
    if (!parts.length) return "";
    return (
      '<p class="staff-day-booking__guest">' +
      escapeHtml(parts.join("｜")) +
      "</p>"
    );
  }

  function renderBookingBlock(ev) {
    var statusClass =
      ev.stayStatus === "checked-out" ? " staff-day-booking--past" : "";
    var notesParts = [];
    if (ev.description) notesParts.push(ev.description);
    if (ev.comment) notesParts.push(ev.comment);
    var notesHtml = notesParts.length
      ? '<details class="staff-day-booking__details"><summary>完整備註</summary><div class="staff-day-booking__notes">' +
        formatMultiline(notesParts.join("\n\n---\n\n")) +
        "</div></details>"
      : "";

    return (
      '<article class="staff-day-booking' +
      statusClass +
      '">' +
      '<div class="staff-day-booking__top">' +
      '<span class="staff-card__status staff-card__status--' +
      escapeHtml(ev.stayStatus) +
      '">' +
      escapeHtml(stayStatusLabel(ev.stayStatus)) +
      "</span>" +
      '<span class="staff-day-booking__nights">' +
      escapeHtml(String(ev.nights != null ? ev.nights : "—")) +
      " 晚</span>" +
      "</div>" +
      '<h3 class="staff-day-booking__title">' +
      formatMultiline(ev.summary || "（無標題）") +
      "</h3>" +
      (ev.checkInTime || ev.checkOutTime
        ? '<p class="staff-day-booking__time">' +
          (ev.checkInTime
            ? "入住 " + escapeHtml(ev.checkInTime)
            : "") +
          (ev.checkInTime && ev.checkOutTime ? "｜" : "") +
          (ev.checkOutTime
            ? "退房 " + escapeHtml(ev.checkOutTime)
            : "") +
          "</p>"
        : "") +
      '<p class="staff-day-booking__range">' +
      escapeHtml(ev.checkInDate) +
      " → " +
      escapeHtml(ev.checkOutDate) +
      "</p>" +
      renderGuestInfo(ev) +
      (ev.bookingSource
        ? '<p class="staff-day-booking__meta">來源：' +
          escapeHtml(ev.bookingSource) +
          "</p>"
        : "") +
      (ev.location
        ? '<p class="staff-day-booking__meta">地點：' +
          formatMultiline(ev.location) +
          "</p>"
        : "") +
      notesHtml +
      "</article>"
    );
  }

  function renderRoomCell(events) {
    if (!events.length) {
      return '<p class="staff-day-empty">空房</p>';
    }
    return events.map(renderBookingBlock).join("");
  }

  function renderRvSection(rvEvents) {
    if (!rvEvents.length) return "";
    return (
      '<section class="staff-rv-section">' +
      "<h2>露營車（同期間）</h2>" +
      '<div class="staff-rv-list">' +
      rvEvents.map(renderBookingBlock).join("") +
      "</div>" +
      "</section>"
    );
  }

  function renderDayGrid() {
    if (!rangeFrom || !rangeUntil) {
      eventsEl.innerHTML = '<p class="staff-empty">無法取得顯示區間。</p>';
      return;
    }

    var tentEvents = eventsCache.filter(function (ev) {
      return (
        ev.roomTags.indexOf("cloud") !== -1 ||
        ev.roomTags.indexOf("balloon") !== -1
      );
    });
    var rvEvents = eventsCache.filter(function (ev) {
      return ev.roomTags.indexOf("rv") !== -1;
    });

    var rows = [];
    eachYmdInRange(rangeFrom, rangeUntil, function (ymd) {
      var cloud = tentEvents.filter(function (ev) {
        return (
          ev.roomTags.indexOf("cloud") !== -1 && eventOccupiesYmd(ev, ymd)
        );
      });
      var balloon = tentEvents.filter(function (ev) {
        return (
          ev.roomTags.indexOf("balloon") !== -1 && eventOccupiesYmd(ev, ymd)
        );
      });

      var both = cloud.length && balloon.length;
      var onlyCloud = cloud.length && !balloon.length;
      var onlyBalloon = balloon.length && !cloud.length;
      var rowClass = "staff-day-row";
      if (both) rowClass += " staff-day-row--both";
      else if (onlyCloud) rowClass += " staff-day-row--cloud-only";
      else if (onlyBalloon) rowClass += " staff-day-row--balloon-only";

      rows.push(
        '<div class="' +
          rowClass +
          '">' +
          '<div class="staff-day-col staff-day-col--date">' +
          '<p class="staff-day-date">' +
          escapeHtml(formatYmdLabel(ymd)) +
          "</p>" +
          '<p class="staff-day-weekday">週' +
          escapeHtml(weekdayLabel(ymd)) +
          "</p>" +
          (both
            ? '<p class="staff-day-flag">兩邊都有</p>'
            : onlyBalloon
              ? '<p class="staff-day-flag staff-day-flag--right">只有右邊</p>'
              : onlyCloud
                ? '<p class="staff-day-flag staff-day-flag--left">只有左邊</p>'
                : '<p class="staff-day-flag staff-day-flag--empty">兩邊空</p>') +
          "</div>" +
          '<div class="staff-day-col staff-day-col--cloud">' +
          '<p class="staff-day-col-label">雲朵房（左邊帳篷）</p>' +
          renderRoomCell(cloud) +
          "</div>" +
          '<div class="staff-day-col staff-day-col--balloon">' +
          '<p class="staff-day-col-label">熱氣球房（右邊帳篷）</p>' +
          renderRoomCell(balloon) +
          "</div>" +
          "</div>"
      );
    });

    eventsEl.innerHTML =
      '<div class="staff-day-table" role="table" aria-label="左右帳篷對照">' +
      '<div class="staff-day-head" role="row">' +
      '<div class="staff-day-col staff-day-col--date" role="columnheader">日期</div>' +
      '<div class="staff-day-col staff-day-col--cloud" role="columnheader">雲朵房<br><span>左邊帳篷</span></div>' +
      '<div class="staff-day-col staff-day-col--balloon" role="columnheader">熱氣球房<br><span>右邊帳篷</span></div>' +
      "</div>" +
      rows.join("") +
      "</div>" +
      renderRvSection(rvEvents);
  }

  function loadEvents() {
    statusEl.textContent = "載入中…";
    showFetchError("");

    return apiFetch("/staff-calendar/events")
      .then(function (result) {
        if (!result.data.ok) {
          throw new Error(result.data.error || "載入失敗");
        }
        eventsCache = result.data.events || [];
        rangeFrom = result.data.fromYmd || "";
        rangeUntil = result.data.untilYmd || "";
        var rangeText = "";
        if (rangeFrom && rangeUntil) {
          rangeText =
            "｜區間：" +
            formatYmdLabel(rangeFrom) +
            "～" +
            formatYmdLabel(rangeUntil);
        }
        statusEl.textContent =
          "共 " +
          eventsCache.length +
          " 筆" +
          rangeText +
          "（更新時間：" +
          (result.data.fetchedAt || "") +
          "）";
        renderDayGrid();
      })
      .catch(function (err) {
        statusEl.textContent = "";
        showFetchError(err.message || "無法載入資料");
      });
  }

  refreshBtn.addEventListener("click", function () {
    loadEvents();
  });

  loadEvents();
})();

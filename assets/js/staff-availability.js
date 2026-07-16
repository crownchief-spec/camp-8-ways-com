(function () {
  var API_BASE = "/api";
  var selectedRoom = "all";
  var eventsCache = [];

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

  function apiFetch(path, options) {
    return fetch(API_BASE + path, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...(options || {})
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
    return (
      parseInt(parts[1], 10) + " 月 " + parseInt(parts[2], 10) + " 日"
    );
  }

  function renderTagPills(ev) {
    return ev.roomTags
      .map(function (tag) {
        var label =
          tag === "cloud"
            ? "雲朵房（左邊帳篷）"
            : tag === "balloon"
              ? "熱氣球房（右邊帳篷）"
              : "露營車";
        return (
          '<span class="staff-tag staff-tag--' +
          escapeHtml(tag) +
          '">' +
          escapeHtml(label) +
          "</span>"
        );
      })
      .join("");
  }

  function renderGuestInfo(ev) {
    var parts = [];
    if (ev.guestCount != null) {
      parts.push("入住人數：" + ev.guestCount + " 人");
    }
    if (ev.adults != null || ev.children != null) {
      var sub = [];
      if (ev.adults != null) sub.push("成人 " + ev.adults);
      if (ev.children != null) sub.push("兒童 " + ev.children);
      parts.push(sub.join("／"));
    }
    if (!parts.length) return "";
    return (
      '<p class="staff-card__guest">' + escapeHtml(parts.join("｜")) + "</p>"
    );
  }

  function renderEventCard(ev) {
    var statusClass =
      ev.stayStatus === "checked-out" ? " staff-card--past" : "";
    var notesParts = [];
    if (ev.description) notesParts.push(ev.description);
    if (ev.comment) notesParts.push(ev.comment);

    var notesHtml = notesParts.length
      ? '<details class="staff-card__details"><summary>完整備註</summary><div class="staff-card__notes">' +
        formatMultiline(notesParts.join("\n\n---\n\n")) +
        "</div></details>"
      : "";

    return (
      '<article class="staff-card' +
      statusClass +
      '">' +
      '<div class="staff-card__head">' +
      renderTagPills(ev) +
      '<span class="staff-card__status staff-card__status--' +
      escapeHtml(ev.stayStatus) +
      '">' +
      escapeHtml(stayStatusLabel(ev.stayStatus)) +
      "</span>" +
      "</div>" +
      '<h2 class="staff-card__title">' +
      formatMultiline(ev.summary || "（無標題）") +
      "</h2>" +
      '<div class="staff-card__dates">' +
      "<p><strong>入住</strong> " +
      escapeHtml(ev.checkInDate) +
      " " +
      escapeHtml(ev.checkInTime) +
      "</p>" +
      "<p><strong>退房</strong> " +
      escapeHtml(ev.checkOutDate) +
      " " +
      escapeHtml(ev.checkOutTime) +
      "</p>" +
      '<p class="staff-card__nights">共 ' +
      escapeHtml(String(ev.nights != null ? ev.nights : "—")) +
      " 晚</p>" +
      "</div>" +
      renderGuestInfo(ev) +
      (ev.bookingSource
        ? '<p class="staff-card__source">訂房來源：' +
          escapeHtml(ev.bookingSource) +
          "</p>"
        : "") +
      (ev.location
        ? '<p class="staff-card__location">地點：' +
          formatMultiline(ev.location) +
          "</p>"
        : "") +
      '<p class="staff-card__meta">所屬行事曆：' +
      escapeHtml(ev.calendarName) +
      "</p>" +
      (ev.lastModified
        ? '<p class="staff-card__meta">最後更新：' +
          escapeHtml(ev.lastModified) +
          "</p>"
        : "") +
      notesHtml +
      "</article>"
    );
  }

  function filterEvents() {
    return eventsCache.filter(function (ev) {
      if (selectedRoom !== "all" && ev.roomTags.indexOf(selectedRoom) === -1) {
        return false;
      }
      return true;
    });
  }

  function renderEvents() {
    var filtered = filterEvents();
    if (!filtered.length) {
      eventsEl.innerHTML =
        '<p class="staff-empty">此篩選條件下沒有訂房資料。</p>';
      return;
    }
    eventsEl.innerHTML = filtered.map(renderEventCard).join("");
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
        var rangeText = "";
        if (result.data.fromYmd && result.data.untilYmd) {
          rangeText =
            "｜區間：" +
            formatYmdLabel(result.data.fromYmd) +
            "～" +
            formatYmdLabel(result.data.untilYmd);
        }
        statusEl.textContent =
          "共 " +
          filterEvents().length +
          " 筆" +
          rangeText +
          "（更新時間：" +
          (result.data.fetchedAt || "") +
          "）";
        renderEvents();
      })
      .catch(function (err) {
        statusEl.textContent = "";
        showFetchError(err.message || "無法載入資料");
      });
  }

  document.querySelectorAll(".staff-filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".staff-filter-btn").forEach(function (b) {
        b.classList.remove("is-active");
      });
      btn.classList.add("is-active");
      selectedRoom = btn.getAttribute("data-room") || "all";
      renderEvents();
      statusEl.textContent = statusEl.textContent.replace(
        /共 \d+ 筆/,
        "共 " + filterEvents().length + " 筆"
      );
    });
  });

  refreshBtn.addEventListener("click", function () {
    loadEvents();
  });

  loadEvents();
})();

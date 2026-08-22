(function (root) {
  "use strict";

  function textOf(event) {
    return [event.summary, event.description, event.comment].filter(Boolean).join("\n");
  }

  function isRvEvent(event) {
    return Boolean(event.roomTags && event.roomTags.indexOf("rv") !== -1);
  }

  function eventNights(event) {
    var nights = event.nights != null ? Number(event.nights) : 1;
    return nights > 0 ? nights : 1;
  }

  function exclusionReason(event) {
    var summary = String(event.summary || "").trim();
    var text = textOf(event);

    if (/^[?？]/.test(summary)) return "尚未確認";
    if (/取消|作廢/.test(summary)) return "已取消／作廢";
    if (/互惠|補償|免費合作|留空房|保留空房/.test(summary)) return "非收費住宿";
    if (/網紅\s*(?:IG|合作)/i.test(summary) && !(event.statedPrice > 0)) {
      return "網紅合作未列收入";
    }
    if (/^包場[!！]?$|包場唱歌|唱歌.*(?:熱氣球|雲朵)|非包場\s*舊方案/.test(summary)) {
      return "設備／方案備註";
    }
    if (/^[!！]/.test(summary) && !(event.statedPrice > 0) && !event.bookingSource) {
      return "提醒備註";
    }

    if (isRvEvent(event)) {
      if (eventNights(event) < 2) return "露營車單日備註";
      if (/驗車|還車|還露營車|洗車|保養|維修|修車|看車|教學/.test(summary)) {
        return "露營車作業備註";
      }
      if (!String(event.description || "").trim() && !(event.statedPrice > 0)) {
        return "露營車資料不足";
      }
      if (/還車|還露營車/.test(summary) && !/租/.test(summary) && !/方案費用|費用[：:]/.test(text)) {
        return "露營車還車備註";
      }
    }

    return "";
  }

  function normalizeBookingSummary(summary) {
    return String(summary || "")
      .toLowerCase()
      .replace(/熱氣球房?|雲朵房?|露營區|包場|住宿|私訂?|私下|露營車/g, "")
      .replace(/(?:\d+|[一二三四五六七八九十]+)\s*(?:大|小|人|位|晚|天|房|帳)/g, "")
      .replace(/airbnb|agoda|bnb|line|facebook|粉專/gi, "")
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim();
  }

  function comparableDateDistance(a, b) {
    var aTime = Date.parse((a.checkInYmd || "") + "T00:00:00Z");
    var bTime = Date.parse((b.checkInYmd || "") + "T00:00:00Z");
    if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return Infinity;
    return Math.abs(aTime - bTime) / 86400000;
  }

  function isDuplicateBooking(a, b) {
    if (isRvEvent(a) !== isRvEvent(b)) return false;
    if (comparableDateDistance(a, b) > 2) return false;

    var aDescription = String(a.description || "").replace(/\s+/g, " ").trim();
    var bDescription = String(b.description || "").replace(/\s+/g, " ").trim();
    if (aDescription.length >= 80 && aDescription === bDescription) return true;

    var sameDaySameSingleRoom =
      !isRvEvent(a) &&
      a.checkInYmd === b.checkInYmd &&
      a.roomTags &&
      b.roomTags &&
      a.roomTags.length === 1 &&
      b.roomTags.length === 1 &&
      a.roomTags[0] === b.roomTags[0];
    if (sameDaySameSingleRoom) return true;

    var aKey = normalizeBookingSummary(a.summary);
    var bKey = normalizeBookingSummary(b.summary);
    return aKey.length >= 3 && aKey === bKey;
  }

  function eventQuality(event) {
    var stated = Number(event.statedPrice) || 0;
    return (stated > 0 ? 10000000 : 0) + String(event.description || "").length + eventNights(event) * 100;
  }

  function analyzeEvents(events) {
    var kept = [];
    var excluded = [];
    (events || [])
      .slice()
      .sort(function (a, b) {
        return String(a.checkInYmd || "").localeCompare(String(b.checkInYmd || ""));
      })
      .forEach(function (event) {
        var reason = exclusionReason(event);
        if (reason) {
          excluded.push({ event: event, reason: reason });
          return;
        }

        var duplicateIndex = -1;
        for (var i = kept.length - 1; i >= 0; i -= 1) {
          if (comparableDateDistance(kept[i], event) > 2) break;
          if (isDuplicateBooking(kept[i], event)) {
            duplicateIndex = i;
            break;
          }
        }

        if (duplicateIndex === -1) {
          kept.push(event);
          return;
        }

        if (eventQuality(event) > eventQuality(kept[duplicateIndex])) {
          excluded.push({ event: kept[duplicateIndex], reason: "同一筆訂房的重複房型／日期事件" });
          kept[duplicateIndex] = event;
        } else {
          excluded.push({ event: event, reason: "同一筆訂房的重複房型／日期事件" });
        }
      });

    return { included: kept, excluded: excluded };
  }

  function isTwoTentPackage(event) {
    var text = textOf(event);
    var hasBothRoomTags =
      event.roomTags &&
      event.roomTags.indexOf("balloon") !== -1 &&
      event.roomTags.indexOf("cloud") !== -1;
    if (!hasBothRoomTags) return false;
    if (/一帳|一個帳篷|單帳/.test(text)) return false;
    if (/補償|免費升級|讓你們包場/.test(text)) return false;
    if (/2\s*帳|兩\s*帳|兩個帳篷|2\s*房|兩\s*房|兩間/.test(text)) return true;
    return Number(event.guestCount) > 6;
  }

  function campsiteNightlyEstimate(event, rules) {
    if (isTwoTentPackage(event)) return Number(rules.fullSiteNightly) || 9800;
    var ymd = String(event.checkInYmd || "");
    if (ymd && ymd <= "2026-04-17") return Number(rules.campEarlyNightly) || 3800;
    if (ymd && ymd <= "2026-06-19") return Number(rules.campMiddleNightly) || 4800;
    return Number(rules.tentNightly) || 5000;
  }

  function computeEstimate(event, rules) {
    var nights = eventNights(event);
    if (isRvEvent(event)) {
      var baseNights = Number(rules.rvBaseNights) || 2;
      var base = Number(rules.rvBase) || 13800;
      var extra = Number(rules.rvExtraDay) || 2800;
      return {
        amount: nights <= baseNights ? base : base + (nights - baseNights) * extra,
        source: "estimate",
        label: "露營車估算"
      };
    }

    var isPlatform = /^(Airbnb|Agoda|Booking\.com)$/.test(event.bookingSource || "");
    return {
      amount: campsiteNightlyEstimate(event, rules) * nights,
      source: isPlatform ? "platform-estimate" : "estimate",
      label: isPlatform ? "平台估算" : "歷史估算"
    };
  }

  root.JoyforestRevenueRules = {
    analyzeEvents: analyzeEvents,
    campsiteNightlyEstimate: campsiteNightlyEstimate,
    computeEstimate: computeEstimate,
    eventNights: eventNights,
    exclusionReason: exclusionReason,
    isDuplicateBooking: isDuplicateBooking,
    isRvEvent: isRvEvent,
    isTwoTentPackage: isTwoTentPackage,
    normalizeBookingSummary: normalizeBookingSummary
  };
})(typeof window !== "undefined" ? window : globalThis);

import assert from "node:assert/strict";
import fs from "node:fs";
import { mergeAndParseCalendars } from "../functions/_lib/ics-parser.js";
import { parseStatedPriceFromText } from "../functions/_lib/stated-price.js";
import "../assets/js/revenue-rules.js";

const Rules = globalThis.JoyforestRevenueRules;
const defaults = {
  campEarlyNightly: 3800,
  campMiddleNightly: 4800,
  tentNightly: 5000,
  fullSiteNightly: 9800,
  rvBase: 13800,
  rvExtraDay: 2800,
  rvBaseNights: 2
};

assert.equal(parseStatedPriceFromText("金額兩晚7600已經付款"), 7600);
assert.equal(parseStatedPriceFromText("• 金額：9800\n• 訂金：5000"), 9800);
assert.equal(parseStatedPriceFromText("住宿費 NT$5,800 未稅，含稅 NT$6,090"), 6090);
assert.equal(parseStatedPriceFromText("本次場地與住宿費用合計：NT$14,400"), 14400);
assert.equal(parseStatedPriceFromText("雲朵房 Agoda $5000", "Agoda"), 5000);

assert.equal(
  Rules.computeEstimate({ checkInYmd: "2026-03-14", nights: 1, roomTags: ["cloud"], bookingSource: "Agoda" }, defaults).amount,
  3800
);
assert.equal(
  Rules.computeEstimate({ checkInYmd: "2026-05-28", nights: 1, roomTags: ["cloud"], bookingSource: "Agoda" }, defaults).amount,
  4800
);
assert.equal(
  Rules.computeEstimate({ checkInYmd: "2026-08-20", nights: 1, roomTags: ["balloon", "cloud"], guestCount: 5, summary: "一帳包場5人" }, defaults).amount,
  5000
);
assert.equal(
  Rules.computeEstimate({ checkInYmd: "2026-08-22", nights: 1, roomTags: ["balloon", "cloud"], guestCount: 10, summary: "兩帳包場10人" }, defaults).amount,
  9800
);
assert.equal(
  Rules.computeEstimate({ checkInYmd: "2026-08-22", nights: 1, roomTags: ["balloon", "cloud"], guestCount: 2, summary: "雲朵房兩人 Airbnb", description: "因時間調整，補償讓你們包場，兩間帳篷都可使用" }, defaults).amount,
  5000
);

const ics = fs.readFileSync(new URL("../data/calendar-basic.ics", import.meta.url), "utf8");
const events = mergeAndParseCalendars(ics, "").filter(
  (event) => event.checkInYmd >= "2026-02-01" && event.checkInYmd <= "2026-12-31"
);
const bySummary = new Map(events.map((event) => [event.summary, event]));

assert.equal(bySummary.get("包場露營區 惠茹🌹 熱氣球 雲朵")?.statedPrice, 9800);
assert.equal(bySummary.get("熱氣球房 露營區求婚 銘")?.statedPrice, 14400);
assert.equal(bySummary.get("熱氣球 私廚按摩")?.statedPrice, 6090);
assert.equal(bySummary.get("雲朵房平日包場5人Agoda Y U L I N G H U A N G $5000")?.statedPrice, 5000);

const analyzed = Rules.analyzeEvents(events);
assert.equal(
  analyzed.included.filter((event) => /Kelly chen兩天/.test(event.summary)).length,
  1
);
assert.equal(
  analyzed.included.filter((event) => /英语教学昕阅森林Ashlen/.test(event.summary)).length,
  1
);
assert.equal(
  analyzed.included.filter((event) => /露營區求婚 銘/.test(event.summary)).length,
  1
);
assert.equal(
  analyzed.included.filter((event) => event.summary === "包場唱歌").length,
  0
);
assert.equal(
  analyzed.included.filter((event) => event.summary === "包場！").length,
  0
);
assert.equal(
  analyzed.included.filter((event) => /互惠|補償/.test(event.summary)).length,
  0
);

console.log(`Revenue checks passed: ${analyzed.included.length} included, ${analyzed.excluded.length} excluded.`);

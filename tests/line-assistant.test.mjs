import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createErrorHumanGateResult,
  createHumanGateResult,
  createImageHumanGateResult,
  detectHumanGate,
  generateLineAssistantReply,
  inferService,
  isAvailabilityQuestion,
  needsHumanBookingGate
} from "../functions/_lib/line-assistant.js";
import {
  answerAvailabilityQuestion,
  buildAvailabilityResult,
  parseAvailabilityDates
} from "../functions/_lib/line-availability.js";
import { buildAssistantInstructions } from "../functions/_lib/line-knowledge.js";
import { verifyLineSignature } from "../functions/_lib/line-signature.js";

test("verifies LINE webhook signatures", async () => {
  const secret = "test-secret";
  const body = JSON.stringify({ events: [] });
  const signature = createHmac("sha256", secret).update(body).digest("base64");
  assert.equal(await verifyLineSignature(secret, body, signature), true);
  assert.equal(await verifyLineSignature(secret, `${body}x`, signature), false);
});

test("routes special requests, booking and payment to the human gate but not availability", () => {
  assert.equal(needsHumanBookingGate("請問 11 月 5 日還有空房嗎？"), false);
  assert.equal(isAvailabilityQuestion("請問 11 月 5 日還有空房嗎？"), true);
  assert.equal(needsHumanBookingGate("可以讓我延後到下午兩點退房嗎？"), true);
  assert.equal(needsHumanBookingGate("你們這幾天很貴耶，可以再算便宜一點嗎？"), true);
  assert.equal(needsHumanBookingGate("露營區雲朵房打卡優惠多少？"), false);
  assert.equal(needsHumanBookingGate("露營區兩間一起訂有包場折扣嗎？"), false);
  assert.equal(needsHumanBookingGate("你們這個價格根本在搶錢吧"), true);
  assert.equal(needsHumanBookingGate("可以幫忙做抓周佈置嗎？"), true);
  assert.equal(needsHumanBookingGate("好的，我想預訂熱氣球房"), true);
  assert.equal(needsHumanBookingGate("現在可以預訂了嗎？"), true);
  assert.equal(needsHumanBookingGate("訂金我已經匯款完成"), true);
  assert.equal(needsHumanBookingGate("請問訂金怎麼計算？"), false);
});

test("availability stays automatic and special requests pause with a polite editor reply", () => {
  assert.equal(detectHumanGate("下週六熱氣球房有空嗎？"), null);
  const special = detectHumanGate("可以提早入住嗎？");
  assert.equal(special.reason, "special_request");
  assert.match(special.reply, /小編.*老闆/);
  const discount = detectHumanGate("你們這幾天很貴耶，可以再算便宜一點嗎？");
  assert.equal(discount.reason, "special_request");
  assert.match(discount.reply, /預算考量.*老闆/);
  const complaint = detectHumanGate("你們這個價格根本在搶錢吧");
  assert.equal(complaint.reason, "customer_complaint");
  assert.match(complaint.reply, /很抱歉.*感受.*老闆/);
  assert.doesNotMatch(complaint.reply, /搶錢|坑人|垃圾|反駁/);
});

test("customer hold messages do not expose automation or an internal handoff", () => {
  const publicReplies = [
    createHumanGateResult("我想預訂").reply,
    createHumanGateResult("訂金已匯款完成").reply,
    createImageHumanGateResult().reply,
    createErrorHumanGateResult().reply
  ].filter(Boolean);
  for (const reply of publicReplies) {
    assert.doesNotMatch(reply, /AI|機器人|自動|人工|轉接|轉人工/i);
  }
  const instructions = buildAssistantInstructions({ today: "2026-10-16", serviceContext: "露營區" });
  assert.match(instructions, /不向客人提到 AI、機器人、自動回覆、人工、轉接/);
  assert.match(instructions, /客服小編，不是老闆/);
  assert.match(instructions, /只輸出「NEEDS_REVIEW」/);
});

test("treats a generic image as something to review, not as proof of payment", () => {
  const imageResult = createImageHumanGateResult();
  assert.equal(imageResult.pause, true);
  assert.match(imageResult.reply, /圖片內容與相關資料/);
  assert.doesNotMatch(imageResult.reply, /已付款|已匯款|入帳/);
});

test("infers campsite and campervan service context", () => {
  assert.equal(inferService("熱氣球房可以住六個人嗎？"), "campsite");
  assert.equal(inferService("露營車需要什麼駕照？"), "campervan");
  assert.equal(inferService("那價格呢？", "campervan"), "campervan");
});

test("answers approved common questions without waiting for the AI model", async () => {
  const result = await generateLineAssistantReply(
    {
      AI: {
        run() {
          throw new Error("AI should not be called for an approved deterministic answer");
        }
      }
    },
    { text: "請問露營車有幾張床？", history: [], previousService: null }
  );
  assert.equal(result.pause, false);
  assert.match(result.reply, /兩張雙人床/);
  assert.equal(result.service, "campervan");
});

test("adds the most relevant website page when an AI fallback omits a link", async () => {
  const result = await generateLineAssistantReply(
    {
      AI: {
        async run() {
          return { response: "露營車最低租期是 3 天 2 夜。" };
        }
      }
    },
    { text: "請問露營車最低要租幾天？", history: [], previousService: "campervan" }
  );
  assert.equal(result.pause, false);
  assert.match(result.reply, /https:\/\/van\.joyforest\.tw\/pages\/campervan/);
});

test("keeps the internal NEEDS_REVIEW marker private and pauses the conversation", async () => {
  const result = await generateLineAssistantReply(
    {
      AI: {
        async run() {
          return { response: "NEEDS_REVIEW" };
        }
      }
    },
    { text: "這個狀況可以特例處理嗎？", history: [], previousService: "campsite" }
  );
  assert.equal(result.pause, true);
  assert.equal(result.pauseReason, "assistant_output_review");
  assert.match(result.reply, /小編.*老闆/);
  assert.doesNotMatch(result.reply, /NEEDS_REVIEW|AI|機器人|自動|人工|轉接/i);
});

test("blocks a malformed review marker instead of exposing it to the customer", async () => {
  const result = await generateLineAssistantReply(
    {
      AI: {
        async run() {
          return { response: "NEEDS_REVIEW：需要再確認這個例外。" };
        }
      }
    },
    { text: "這個例外可以嗎？", history: [], previousService: "campsite" }
  );
  assert.equal(result.pause, true);
  assert.equal(result.pauseReason, "assistant_output_review");
  assert.doesNotMatch(result.reply, /NEEDS_REVIEW/i);
});

test("never leaves the customer staring at silence when review is required", async () => {
  const unmatched = await generateLineAssistantReply(
    {},
    { text: "現場能接量子同步器嗎？", history: [], previousService: "campsite" }
  );
  assert.equal(unmatched.pause, true);
  assert.equal(unmatched.pauseReason, "unmatched_question");
  assert.match(unmatched.reply, /小編.*老闆/);

  const failed = createErrorHumanGateResult();
  assert.equal(failed.pause, true);
  assert.match(failed.reply, /小編.*老闆/);
});

test("returns only sanitized campsite availability status", () => {
  const campIcs = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:private-guest-id",
    "DTSTART;VALUE=DATE:20261105",
    "DTEND;VALUE=DATE:20261106",
    "SUMMARY:熱氣球房四人 私 王小明",
    "DESCRIPTION:電話 0912345678",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const result = buildAvailabilityResult({
    service: "campsite",
    room: "either",
    startDate: "2026-11-05",
    endDate: "2026-11-06",
    campIcs,
    rvIcs: ""
  });
  assert.deepEqual(result.roomStatus, { balloon: "booked", cloud: "available" });
  assert.equal(JSON.stringify(result).includes("王小明"), false);
  assert.equal(JSON.stringify(result).includes("0912345678"), false);
});

test("treats provisional campervan enquiries as waitlist", () => {
  const rvIcs = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:rv-1",
    "DTSTART;VALUE=DATE:20261110",
    "DTEND;VALUE=DATE:20261113",
    "SUMMARY:？露營車 測試客人",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const result = buildAvailabilityResult({
    service: "campervan",
    room: "not_applicable",
    startDate: "2026-11-10",
    endDate: "2026-11-13",
    campIcs: "",
    rvIcs
  });
  assert.equal(result.status, "waitlist");
  assert.equal(JSON.stringify(result).includes("測試客人"), false);
});

test("parses common Chinese date ranges and rolls a future booking into next year", () => {
  assert.deepEqual(parseAvailabilityDates("11月5日到11月7日", "2026-10-16"), {
    startDate: "2026-11-05",
    endDate: "2026-11-07",
    dateCount: 2,
    invalid: false
  });
  assert.deepEqual(parseAvailabilityDates("12/30-1/1", "2026-10-16"), {
    startDate: "2026-12-30",
    endDate: "2027-01-01",
    dateCount: 2,
    invalid: false
  });
  assert.deepEqual(parseAvailabilityDates("3月2日", "2026-10-16"), {
    startDate: "2027-03-02",
    endDate: null,
    dateCount: 1,
    invalid: false
  });
});

test("asks for a complete campervan range and always includes the live availability link", async () => {
  const result = await answerAvailabilityQuestion({}, {
    text: "請問 11 月 5 日露營車有空嗎？",
    service: "campervan",
    today: "2026-10-16"
  });
  assert.equal(result.pause, false);
  assert.match(result.reply, /3 天 2 夜/);
  assert.match(result.reply, /幾月幾日取車、幾月幾日還車/);
  assert.match(result.reply, /https:\/\/van\.joyforest\.tw\/pages\/availability/);
});

test("treats a single campsite date as a one-night stay and checks both rooms", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("BEGIN:VCALENDAR\r\nEND:VCALENDAR", { status: 200 });
  try {
    const result = await answerAvailabilityQuestion({
      JOYFOREST_CAMP_ICS_URL: "https://calendar.example/camp.ics",
      JOYFOREST_RV_ICS_URL: "https://calendar.example/rv.ics"
    }, {
      text: "請問 11 月 5 日露營區有空嗎？",
      service: "campsite",
      today: "2026-10-16"
    });
    assert.equal(result.pause, false);
    assert.match(result.reply, /11 月 5 日入住、11 月 6 日退房/);
    assert.match(result.reply, /熱氣球房：目前尚有空房/);
    assert.match(result.reply, /雲朵房：目前尚有空房/);
    assert.match(result.reply, /https:\/\/camp\.8-ways\.com\/pages\/availability\.html/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects campervan ranges shorter than the three-day two-night minimum", async () => {
  const result = await answerAvailabilityQuestion({}, {
    text: "露營車 11/5 到 11/6 有空嗎？",
    service: "campervan",
    today: "2026-10-16"
  });
  assert.equal(result.pause, false);
  assert.match(result.reply, /未滿 3 天 2 夜/);
});

test("answers a complete campervan range from live-calendar-shaped data without exposing titles", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const isRv = String(url).includes("rv.ics");
    const body = isRv
      ? [
          "BEGIN:VCALENDAR",
          "BEGIN:VEVENT",
          "DTSTART;VALUE=DATE:20261105",
          "DTEND;VALUE=DATE:20261108",
          "SUMMARY:露營車 私密客人姓名",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n")
      : "BEGIN:VCALENDAR\r\nEND:VCALENDAR";
    return new Response(body, { status: 200 });
  };
  try {
    const result = await answerAvailabilityQuestion({
      JOYFOREST_CAMP_ICS_URL: "https://calendar.example/camp.ics",
      JOYFOREST_RV_ICS_URL: "https://calendar.example/rv.ics"
    }, {
      text: "露營車 11/5 到 11/7 有空嗎？",
      service: "campervan",
      today: "2026-10-16"
    });
    assert.equal(result.pause, false);
    assert.match(result.reply, /已有預訂/);
    assert.doesNotMatch(result.reply, /私密客人姓名/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function parseKnowledge(relativePath) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const content = fs.readFileSync(path.join(root, relativePath), "utf8");
  return content.split(/^## /m).slice(1).map((section) => {
    const [id, ...lines] = section.split("\n");
    const fields = Object.fromEntries(
      lines
        .map((line) => line.match(/^(服務|問題|關鍵字|回答|連結):\s*(.*)$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2]])
    );
    return {
      id: id.trim(),
      service: fields.服務,
      question: fields.問題,
      keywords: fields.關鍵字,
      answer: fields.回答,
      url: fields.連結
    };
  });
}

function mockD1(entries) {
  return {
    prepare(sql) {
      let selectedService = null;
      return {
        bind(service) {
          selectedService = service;
          return this;
        },
        async all() {
          const results = sql.includes("service IN")
            ? entries.filter((entry) => entry.service === selectedService || entry.service === "shared")
            : entries;
          return { results };
        }
      };
    }
  };
}

test("answers at least twenty campervan and twenty campsite FAQ variations from D1 knowledge", async () => {
  const entries = [
    ...parseKnowledge("knowledge/line/campervan.md"),
    ...parseKnowledge("knowledge/line/campsite.md")
  ];
  const cases = [
    ["campervan", "露營車最低租期多久？", /3 天 2 夜/],
    ["campervan", "露營車平日價格多少錢？", /11,800/],
    ["campervan", "加租一天怎麼算？", /2,800/],
    ["campervan", "押金是拿來做什麼的？", /5,000/],
    ["campervan", "一般小客車駕照可以開嗎？", /一般小客車駕照/],
    ["campervan", "露營車高度多少？", /3 公尺/],
    ["campervan", "合法座位有幾個？", /6 人/],
    ["campervan", "車上有幾張床？", /2 張雙人床/],
    ["campervan", "車上能洗澡嗎？", /簡易衛浴/],
    ["campervan", "清水箱有幾公升？", /110 公升/],
    ["campervan", "冷氣可以開多久？", /8～10 小時/],
    ["campervan", "露營車怎麼接電充電？", /外電/],
    ["campervan", "有外置發電機嗎？", /外置發電機/],
    ["campervan", "有冰箱跟卡式爐嗎？", /冰箱/],
    ["campervan", "租車有里程限制嗎？", /不限里程/],
    ["campervan", "可以到桃園送車嗎？", /桃園/],
    ["campervan", "交車時會教我操作嗎？", /30 分鐘/],
    ["campervan", "有操作教學影片嗎？", /六個主題/],
    ["campervan", "可以停一般停車場過夜嗎？", /明確允許過夜/],
    ["campervan", "第一次一定要住露營區嗎？", /至少一半/],
    ["campervan", "可以帶狗狗上車嗎？", /NT\$800/],
    ["campervan", "車內可以抽菸嗎？", /全車禁菸/],
    ["campervan", "下雨還能使用露營車嗎？", /車內可正常使用/],
    ["campervan", "有投影和 Switch 套組嗎？", /影音娛樂套組/],
    ["campsite", "揪好森露營區在哪裡？", /桃園楊梅/],
    ["campsite", "露營區總共有幾個帳篷？", /兩個房型/],
    ["campsite", "一間最多住幾人？", /1～6 人/],
    ["campsite", "熱氣球房床型？", /雙人沙發床/],
    ["campsite", "雲朵房有幾張床？", /2 張雙人床/],
    ["campsite", "入住退房時間是幾點？", /下午 3:00/],
    ["campsite", "星期三訂一房算包場嗎？", /一房包場/],
    ["campsite", "星期六訂一房是全場包場嗎？", /一房是包自己的專屬區域/],
    ["campsite", "熱氣球房一般多少錢？", /5,800/],
    ["campsite", "雲朵房打卡優惠多少？", /5,000/],
    ["campsite", "兩間一起訂有包場折扣嗎？", /未標示額外包場折扣/],
    ["campsite", "熱氣球房有 Switch 嗎？", /Switch 2/],
    ["campsite", "雲朵房有浴缸嗎？", /景觀浴缸/],
    ["campsite", "戶外廚房能烤肉嗎？", /美式烤肉爐/],
    ["campsite", "住宿有附早餐嗎？", /不包含餐點/],
    ["campsite", "有獨立衛浴跟浴巾嗎？", /浴巾/],
    ["campsite", "露營區可以帶毛孩嗎？", /歡迎毛孩/],
    ["campsite", "嬰兒可以一起入住嗎？", /嬰幼兒年齡/],
    ["campsite", "卡拉 OK 可以唱到幾點？", /晚上 10:00/],
    ["campsite", "帳篷裡可以吸菸嗎？", /全面禁菸/],
    ["campsite", "森林裡有防蚊設備嗎？", /滅蚊燈/],
    ["campsite", "可以辦抓周派對嗎？", /抓周/],
    ["campsite", "不住宿的活動場地多少錢？", /NT\$880/]
  ];
  assert.ok(cases.filter(([service]) => service === "campervan").length >= 20);
  assert.ok(cases.filter(([service]) => service === "campsite").length >= 20);

  for (const [service, text, expected] of cases) {
    const result = await generateLineAssistantReply(
      {
        LINE_KNOWLEDGE: mockD1(entries),
        AI: { run() { throw new Error(`AI fallback should not run for: ${text}`); } }
      },
      { text, history: [], previousService: service }
    );
    assert.equal(result.pause, false, text);
    assert.match(result.reply, expected, text);
    assert.match(result.reply, /https:\/\//, text);
    assert.doesNotMatch(result.reply, /\bAI\b|機器人|轉人工/i, text);
  }
});

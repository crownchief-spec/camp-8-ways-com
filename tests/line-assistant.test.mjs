import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";

import {
  createErrorHumanGateResult,
  createHumanGateResult,
  createImageHumanGateResult,
  detectHumanGate,
  generateLineAssistantReply,
  inferService,
  needsHumanBookingGate
} from "../functions/_lib/line-assistant.js";
import { buildAvailabilityResult } from "../functions/_lib/line-availability.js";
import { buildAssistantInstructions } from "../functions/_lib/line-knowledge.js";
import { verifyLineSignature } from "../functions/_lib/line-signature.js";

test("verifies LINE webhook signatures", async () => {
  const secret = "test-secret";
  const body = JSON.stringify({ events: [] });
  const signature = createHmac("sha256", secret).update(body).digest("base64");
  assert.equal(await verifyLineSignature(secret, body, signature), true);
  assert.equal(await verifyLineSignature(secret, `${body}x`, signature), false);
});

test("routes availability, special requests, booking and payment to the human gate", () => {
  assert.equal(needsHumanBookingGate("請問 11 月 5 日還有空房嗎？"), true);
  assert.equal(needsHumanBookingGate("可以讓我延後到下午兩點退房嗎？"), true);
  assert.equal(needsHumanBookingGate("好的，我想預訂熱氣球房"), true);
  assert.equal(needsHumanBookingGate("訂金我已經匯款完成"), true);
  assert.equal(needsHumanBookingGate("請問訂金怎麼計算？"), false);
});

test("availability and special requests pause without replying to the customer", () => {
  assert.deepEqual(detectHumanGate("下週六熱氣球房有空嗎？"), {
    reason: "availability_request",
    reply: null
  });
  assert.deepEqual(detectHumanGate("可以提早入住嗎？"), {
    reason: "special_request",
    reply: null
  });
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
  assert.match(instructions, /不要回答內容，只輸出「NEEDS_REVIEW」/);
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

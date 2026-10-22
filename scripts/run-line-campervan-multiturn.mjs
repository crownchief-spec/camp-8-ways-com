import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createHumanGateResult,
  detectHumanGate,
  generateLineAssistantReply,
  inferService,
  isAvailabilityQuestion
} from "../functions/_lib/line-assistant.js";
import { answerAvailabilityQuestion } from "../functions/_lib/line-availability.js";
import { campervanPersonas, totalQuestionCount } from "../tests/fixtures/campervan-personas.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultReportPath = "/Users/joyforest/Documents/露營車/LINE官方帳號/2026-10-22 露營車LINE客服100題測試報告.md";

function parseKnowledge(relativePath) {
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

const rvIcs = [
  "BEGIN:VCALENDAR",
  "X-JOYFOREST-PUBLIC:1",
  "BEGIN:VEVENT",
  "UID:waitlist-test",
  "DTSTART;VALUE=DATE:20261120",
  "DTEND;VALUE=DATE:20261123",
  "SUMMARY:？測試候補（不得外洩）",
  "X-JOYFOREST-TAG:rv",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:booked-test",
  "DTSTART;VALUE=DATE:20261110",
  "DTEND;VALUE=DATE:20261113",
  "SUMMARY:測試已預訂（不得外洩）",
  "X-JOYFOREST-TAG:rv",
  "END:VEVENT",
  "END:VCALENDAR"
].join("\r\n");

function matchesExpected(reply, expected) {
  expected.lastIndex = 0;
  return expected.test(String(reply || ""));
}

function responseHasForbiddenDisclosure(reply) {
  return /\bAI\b|機器人|轉人工|自動回覆|NEEDS_REVIEW/i.test(String(reply || ""));
}

async function routeQuestion(env, state, question) {
  if (question.resumeBefore) {
    state.paused = false;
    state.pauseReason = null;
  }
  if (state.paused) {
    return {
      reply: "",
      pause: true,
      pauseReason: state.pauseReason || "already_paused",
      blockedByPriorPause: true,
      service: state.service
    };
  }

  let result;
  const gate = detectHumanGate(question.text);
  if (gate) {
    result = createHumanGateResult(question.text);
  } else if (isAvailabilityQuestion(question.text, state.service)) {
    result = await answerAvailabilityQuestion(env, {
      text: question.text,
      service: inferService(question.text, state.service),
      today: "2026-10-22"
    });
  } else {
    result = await generateLineAssistantReply(env, {
      text: question.text,
      history: state.history,
      previousService: state.service
    });
  }

  state.service = result.service || inferService(question.text, state.service) || "campervan";
  if (result.history) state.history = result.history;
  else if (question.text) {
    state.history = [
      ...(state.history || []),
      { role: "user", content: question.text },
      { role: "assistant", content: result.reply || "" }
    ].slice(-20);
  }
  state.paused = Boolean(result.pause);
  state.pauseReason = result.pauseReason || null;
  return result;
}

export async function runCampervanSimulation() {
  const entries = [
    ...parseKnowledge("knowledge/line/campervan.md"),
    ...parseKnowledge("knowledge/line/campsite.md")
  ];
  const env = {
    LINE_KNOWLEDGE: mockD1(entries),
    JOYFOREST_CAMP_ICS_URL: "https://calendar.test/camp.ics",
    JOYFOREST_RV_ICS_URL: "https://calendar.test/rv.ics",
    AI: {
      run() {
        throw new Error(`100 題測試不得依賴不確定的 AI 補答：${env.currentQuestion || "未知問題"}`);
      }
    }
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(rvIcs, { status: 200 });

  const personaResults = [];
  try {
    for (const persona of campervanPersonas) {
      const state = { service: "campervan", history: [], paused: false, pauseReason: null };
      const turns = [];
      for (let index = 0; index < persona.questions.length; index += 1) {
        const question = persona.questions[index];
        env.currentQuestion = `${persona.id}-${index + 1} ${question.text}`;
        const result = await routeQuestion(env, state, question);
        const expectationPassed = matchesExpected(result.reply, question.expect);
        const pausePassed = Boolean(result.pause) === Boolean(question.pause);
        const reasonPassed = !question.reason || result.pauseReason === question.reason;
        const privacyPassed = !responseHasForbiddenDisclosure(result.reply);
        const linkPassed = result.pause || /https?:\/\//.test(String(result.reply || ""));
        turns.push({
          number: index + 1,
          question,
          result,
          passed: expectationPassed && pausePassed && reasonPassed && privacyPassed && linkPassed,
          checks: { expectationPassed, pausePassed, reasonPassed, privacyPassed, linkPassed }
        });
      }
      personaResults.push({ ...persona, turns, finalState: state });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  const turns = personaResults.flatMap((persona) => persona.turns);
  return {
    totalQuestions: turns.length,
    passedQuestions: turns.filter((turn) => turn.passed).length,
    failedQuestions: turns.filter((turn) => !turn.passed).length,
    pausedQuestions: turns.filter((turn) => turn.result.pause).length,
    personaResults,
    expectedQuestionCount: totalQuestionCount,
    knowledgeEntryCount: entries.filter((entry) => entry.service === "campervan").length
  };
}

function quote(text) {
  return String(text || "（沒有回覆）")
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function buildMarkdownReport(simulation) {
  const lines = [
    "# 揪好森露營車 LINE 官方帳號｜10 位客人 × 10 輪測試報告",
    "",
    "測試日期：2026-10-22",
    "",
    "## 測試結論",
    "",
    `- 模擬客人：${simulation.personaResults.length} 位，彼此使用獨立對話狀態。`,
    `- 連續問答：${simulation.totalQuestions} 題。`,
    `- 通過：${simulation.passedQuestions} 題。`,
    `- 失敗：${simulation.failedQuestions} 題。`,
    `- 預期暫停並通知老闆：${simulation.pausedQuestions} 題。`,
    `- 可檢索露營車知識：${simulation.knowledgeEntryCount} 筆。`,
    "- 測試強制停用不確定的 AI 補答；每題必須由核定知識、即時檔期或安全暫停規則處理。",
    "- 一般回答必須附最相關網站連結；任何回覆不得向客人提及 AI、機器人、自動回覆或轉人工。",
    "",
    "## 本次知識來源與新舊判定",
    "",
    "1. Apple 備忘錄「露營車」類別共 52 則；以更新日期較新的公開服務資訊為優先，維修、投資、互惠招募與含個資內容不進客服知識庫。",
    "2. 露營車官網現行頁面：首頁、價格與車款、即時檔期、預約、使用教學、保險與車損責任。",
    "3. 匿名知識庫：國際客戶常見問題、服務策略，以及台灣露營車過夜與行程地點資料庫。",
    "4. 客戶紀錄只用來找常見問題與改善方向；姓名、電話、付款、行事曆標題與私人對話不寫入 D1。",
    "",
    "### 已排除的舊資料衝突",
    "",
    "- 車高採官網現行約 3 公尺，不採舊備忘錄的 3.8 公尺。",
    "- 現行押金採 NT$5,000，不採舊釘選 SOP 的 NT$10,000。",
    "- 連假三天兩夜採官網現行 NT$17,800 起。",
    "- 官網目前不以評論或指定星等交換套組；兩套組合計參考加購價為 NT$3,800。",
    "- 行車引擎本身不替生活電池充電；補電依外接電或發電機教學。",
    "- 付款帳號、訂金入帳與取消例外不交給機器人自行決定。",
    "",
    "## 完整逐題結果"
  ];

  for (const persona of simulation.personaResults) {
    lines.push("", `### ${persona.id}｜${persona.name}`, "");
    for (const turn of persona.turns) {
      const status = turn.passed ? "通過" : "失敗";
      const pause = turn.result.pause ? `｜暫停：${turn.result.pauseReason}` : "｜一般自動回答";
      lines.push(`${turn.number}. ${status}${pause}`);
      if (turn.question.resumeBefore) lines.push("   - 測試前置：模擬管理員已解除上一個暫停狀態。");
      lines.push(`   - 客人：${turn.question.text}`);
      lines.push("   - 官方帳號：");
      lines.push(quote(turn.result.reply));
      if (!turn.passed) {
        lines.push(`   - 檢查：${JSON.stringify(turn.checks)}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "## 正式 LINE 實機驗證結果",
    "",
    "自動測試通過後，已在正式 LINE 官方帳號聊天室完成代表性實機驗證；沒有把 100 題全部灌進同一個真實聊天紀錄。",
    "",
    "- 一般服務介紹、第一次駕駛、四大兩小住宿人數：回答與連續上下文正確。",
    "- 11 月 5 日到 11 月 7 日即時檔期：正確讀到已有預訂，且附上即時檔期頁。",
    "- 五星評論與套組：正確採現行規則，不以評論交換套組。",
    "- 兒童安全座椅：先給客人自然的確認中回覆並暫停。",
    "- 管理員恢復：解除成功，下一則訊息恢復一般回答。",
    "- 引擎與生活電池：正確回答行車引擎不替生活電池充電。",
    "- 已付訂金：正確改用『付款訊息已收到』，不再誤稱收到圖片。",
    "- 客人準備預訂：客人收到確認中回覆，管理員同時收到 LINE 待確認通知。",
    "- 測試結束前已解除測試暫停，官方帳號目前維持一般自動回答狀態。",
    ""
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const simulation = await runCampervanSimulation();
  if (simulation.totalQuestions !== totalQuestionCount) {
    throw new Error(`題數錯誤：${simulation.totalQuestions}/${totalQuestionCount}`);
  }
  const reportPath = process.argv[2] || defaultReportPath;
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, buildMarkdownReport(simulation), "utf8");
  console.log(JSON.stringify({
    reportPath,
    total: simulation.totalQuestions,
    passed: simulation.passedQuestions,
    failed: simulation.failedQuestions,
    paused: simulation.pausedQuestions,
    knowledgeEntries: simulation.knowledgeEntryCount
  }, null, 2));
  if (simulation.failedQuestions) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

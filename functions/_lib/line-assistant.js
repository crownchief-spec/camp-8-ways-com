import { buildAssistantInstructions } from "./line-knowledge.js";
import {
  directKnowledgeReply,
  findRelevantLineKnowledge,
  formatRetrievedKnowledge
} from "./line-knowledge-store.js";

const HOLD_REPLY = "太好了，謝謝您！小編先幫您整理預訂資料，再跟老闆確認檔期與下一步，確認後會盡快回覆您。";
const IMAGE_HOLD_REPLY = "謝謝您，圖片已收到！小編先幫您跟老闆確認資料與入帳狀態，確認後會盡快回覆您。";
const SPECIAL_HOLD_REPLY = "謝謝您跟小編說明需求～這部分需要再確認，小編會先幫您詢問老闆，確認後再回覆您。";

const BOOKING_ACTION_RE = /我要(?:預訂|訂房|訂車|下訂)|想(?:預訂|訂房|訂車|下訂)|確認(?:預訂|訂房|訂車|下訂)|幫我(?:保留|預訂|訂房|訂車)|可以(?:下訂|預訂|訂房|訂車)(?:了)?嗎|決定要(?:住|租|訂)|確定要(?:住|租|訂)|就訂這個|保留檔期/i;
const PAYMENT_COMPLETED_RE = /(?:已經?|完成)(?:付款|匯款|轉帳)|(?:付款|匯款|轉帳)(?:完成|好了|成功)|訂金(?:已付|付了|已匯)|匯款截圖|付款截圖/i;
const AVAILABILITY_RE = /檔期|空房|有空|有房|哪(?:一)?天(?:可以|能|有)|幾號(?:可以|能|有)|日期.*(?:可以|能|有空|預訂)|(?:明天|後天|下週|下個月|週[一二三四五六日天]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|\d{1,2}[\/月\-]\d{1,2}).*(?:有空|有房|可以(?:住|租|預約|訂)|能(?:住|租|預約|訂))/i;
const SPECIAL_REQUEST_RE = /特殊需求|例外|通融|折扣|議價|優惠一點|便宜(?:一點|一些)|算便宜|殺價|打折|客製佈置|幫忙.{0,4}佈置|抓周佈置|生日佈置|求婚佈置|(?:提前|提早).{0,8}入住|(?:延後|晚點|延遲).{0,8}退房|(?:提早|提前).{0,8}交車|延後.{0,8}還車|異地還車|甲租乙還|長租|包月|企業合作|品牌合作|商業拍攝|婚禮|大型活動|無障礙|輪椅|醫療設備|特殊飲食|開發票|打統編|報帳/i;
const CAMPSITE_RE = /露營區|熱氣球房|雲朵房|圓頂帳篷|豪華露營|包場|住宿|入住|退房/i;
const CAMPERVAN_RE = /露營車|租車|還車|交車|自走式|車宿|駕照/i;
const UNSAFE_OUTPUT_RE = /(?:已|幫您|替您).{0,12}(?:保留|預訂|訂房|訂車)|(?:檔期|日期).{0,8}(?:有空|可預訂|可以訂)|(?:匯款|轉帳)帳號|信用卡號/i;

function taipeiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function detectHumanGate(text) {
  const value = String(text || "");
  if (PAYMENT_COMPLETED_RE.test(value)) return { reason: "payment_confirmation", reply: IMAGE_HOLD_REPLY };
  if (BOOKING_ACTION_RE.test(value)) return { reason: "booking_confirmation", reply: HOLD_REPLY };
  if (SPECIAL_REQUEST_RE.test(value)) return { reason: "special_request", reply: SPECIAL_HOLD_REPLY };
  return null;
}

export function isAvailabilityQuestion(text) {
  return AVAILABILITY_RE.test(String(text || ""));
}

export function needsHumanBookingGate(text) {
  return Boolean(detectHumanGate(text));
}

export function inferService(text, previousService = null) {
  const hasCampsite = CAMPSITE_RE.test(text || "");
  const hasCampervan = CAMPERVAN_RE.test(text || "");
  if (
    previousService === "campervan" &&
    hasCampsite &&
    !hasCampervan &&
    /(?:一定要|需要|可以|能不能|想要|安排|找).{0,8}(?:住|停|去)?露營區|露營區.{0,8}(?:過夜|接電|補水|洗澡)/i.test(text || "")
  ) {
    return "campervan";
  }
  if (hasCampsite && !hasCampervan) return "campsite";
  if (hasCampervan && !hasCampsite) return "campervan";
  return previousService;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .slice(-8)
    .map((item) => ({ role: item.role, content: String(item.content || "").slice(0, 1600) }));
}

function extractWorkersAiText(result) {
  if (typeof result?.response === "string") return result.response.trim();
  if (typeof result?.result?.response === "string") return result.result.response.trim();
  return "";
}

function relevantPage(text, service) {
  const value = String(text || "");
  if (service === "campervan") {
    if (/保險|押金|事故|車損|刮傷|撞到/.test(value)) return "https://van.joyforest.tw/pages/campervan-insurance";
    if (/教學|操作|怎麼用|使用說明|駕駛|安全|衛浴|冷氣|充電|補水|床/.test(value)) return "https://van.joyforest.tw/pages/booking-guide";
    if (/預約|預訂|送車|交車地點/.test(value)) return "https://van.joyforest.tw/booking";
    return "https://van.joyforest.tw/pages/campervan";
  }
  if (service === "campsite") {
    if (/派對|抓周|求婚|活動|時租|佈置/.test(value)) return "https://camp.8-ways.com/pages/party-event-space.html";
    if (/空房|檔期|價格|費用|多少錢/.test(value)) return "https://camp.8-ways.com/pages/availability.html";
    if (/熱氣球房/.test(value)) return "https://camp.8-ways.com/pages/balloon-tent";
    if (/雲朵房/.test(value)) return "https://camp.8-ways.com/pages/cloud-tent";
    if (/設備|廚房|烤肉|衛浴|浴巾|餐點|早餐|晚餐/.test(value)) return "https://camp.8-ways.com/pages/facilities.html";
    return "https://camp.8-ways.com/";
  }
  return "https://camp.8-ways.com/\n露營車：https://van.joyforest.tw/";
}

function ensureRelevantPage(reply, text, service) {
  if (!reply || /https?:\/\//i.test(reply)) return reply;
  return `${reply.trim()}\n\n相關資訊：${relevantPage(text, service)}`;
}

function fallbackReply(text, service) {
  const value = String(text || "");
  if (/電話|聯絡/.test(value)) return "您好～很高興收到您的訊息！可以直接在這裡留言，或來電 0911-252-302。\n\n露營區：https://camp.8-ways.com/\n露營車：https://van.joyforest.tw/";
  if (/寵物|狗狗|貓咪|毛孩/.test(value)) return "您好～謝謝您詢問毛孩同行！露營區兩個房型都可以帶毛孩，預訂前請告知種類、數量與體型；毛孩請勿上床、沙發及寢具。\n\n詳細說明：https://camp.8-ways.com/pages/faq.html";
  if (/入住|退房|幾點/.test(value) && service !== "campervan") return "您好～露營區下午 3:00 入住，中午 12:00 退房。若想提早入住或延後退房，小編會再幫您跟老闆確認。\n\n住宿說明：https://camp.8-ways.com/pages/faq.html";
  if (/幾人|人數|六人|6人|床型|幾張床/.test(value) && service !== "campervan") return "您好～兩個房型都可安排 1～6 人入住，4 人最舒適。熱氣球房有雙人床、雙人沙發床，第 5、6 位加設雙人床墊；雲朵房有 2 張雙人床，第 5、6 位加設雙人床墊。\n\n房型介紹：https://camp.8-ways.com/";
  if (/駕照|幾人|人數|床|設備|衛浴|冷氣|冰箱|清水/.test(value) && service === "campervan") return "您好～露營車是自排自走式，一般小客車駕照即可駕駛，合法乘坐 6 人；車內有兩張雙人床、冷暖氣、冰箱、簡易衛浴與約 110 公升清水。建議睡 5 位成人或 4 位成人加 2 位兒童。\n\n車款與設備：https://van.joyforest.tw/pages/campervan";
  if (/價格|費用|多少錢/.test(value) && service === "campervan") return "您好～謝謝您詢問！露營車平日 3 天 2 夜／48 小時 NT$11,800 起，實際費用會依日期、交還車時間、送車地點、天數與加購項目確認。\n\n價格與車款：https://van.joyforest.tw/pages/campervan";
  if (/價格|費用|多少錢/.test(value)) return "您好～謝謝您詢問！露營區一般日期參考：熱氣球房官網直訂 NT$5,800，雲朵房打卡優惠 NT$5,000；連續假期、跨年與春節請以空房日曆顯示為準。\n\n空房與價格：https://camp.8-ways.com/pages/availability.html";
  if (/網址|官網|介紹|資料/.test(value)) return "您好～很高興收到您的訊息！\n露營區官網：https://camp.8-ways.com/\n露營車官網：https://van.joyforest.tw/\n\n想看房型、設備、檔期或租車資訊，都可以直接告訴小編。";
  return null;
}

export async function generateLineAssistantReply(env, { text, history, previousService }) {
  const service = inferService(text, previousService);
  let retrievedEntries = [];
  try {
    retrievedEntries = await findRelevantLineKnowledge(env, { text, service });
  } catch (error) {
    console.error("D1 knowledge lookup failed", error);
  }
  if (
    retrievedEntries[0]?.score >= 6 &&
    (!retrievedEntries[1] || retrievedEntries[0].score > retrievedEntries[1].score)
  ) {
    const reply = directKnowledgeReply(retrievedEntries[0]);
    return {
      reply,
      pause: false,
      service,
      history: [
        ...sanitizeHistory(history),
        { role: "user", content: text },
        { role: "assistant", content: reply }
      ].slice(-8)
    };
  }
  const deterministicReply = fallbackReply(text, service);
  if (deterministicReply) {
    return {
      reply: deterministicReply,
      pause: false,
      service,
      history: [
        ...sanitizeHistory(history),
        { role: "user", content: text },
        { role: "assistant", content: deterministicReply }
      ].slice(-8)
    };
  }

  const messages = [
    {
      role: "system",
      content: buildAssistantInstructions({
        today: taipeiToday(),
        serviceContext: service === "campsite" ? "露營區" : service === "campervan" ? "露營車" : null,
        retrievedKnowledge: formatRetrievedKnowledge(retrievedEntries)
      })
    },
    ...sanitizeHistory(history),
    { role: "user", content: String(text || "").slice(0, 2400) }
  ];

  let reply = "";
  if (env.AI?.run) {
    const result = await Promise.race([
      env.AI.run(env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast", {
        messages,
        max_tokens: 320,
        temperature: 0.2
      }),
      new Promise((resolve) => setTimeout(() => resolve(null), 6500))
    ]);
    reply = extractWorkersAiText(result);
  }
  if (!reply) return { reply: null, pause: true, pauseReason: "unmatched_question", service };
  if (reply.trim() === "NEEDS_REVIEW" || UNSAFE_OUTPUT_RE.test(reply)) {
    return { reply: null, pause: true, pauseReason: "assistant_output_review", service };
  }
  reply = ensureRelevantPage(reply, text, service);

  return {
    reply: reply.slice(0, 4800),
    pause: false,
    service,
    history: [...sanitizeHistory(history), { role: "user", content: text }, { role: "assistant", content: reply }].slice(-8)
  };
}

export function createHumanGateResult(text) {
  const gate = detectHumanGate(text) || { reason: "manual_review", reply: null };
  return { reply: gate.reply, pause: true, pauseReason: gate.reason };
}

export function createImageHumanGateResult() {
  return { reply: IMAGE_HOLD_REPLY, pause: true, pauseReason: "image_or_payment_confirmation" };
}

export function createErrorHumanGateResult() {
  return { reply: null, pause: true, pauseReason: "assistant_error" };
}

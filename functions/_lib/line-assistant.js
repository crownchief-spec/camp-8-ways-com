import { buildAssistantInstructions } from "./line-knowledge.js";

const HOLD_REPLY = "好的，我們會先確認預訂資料，確認完成後會再回覆您，謝謝稍候。";
const IMAGE_HOLD_REPLY = "圖片已收到，我們會先確認資料與入帳狀態，確認完成後會再回覆您，謝謝。";

const BOOKING_ACTION_RE = /我要(?:預訂|訂房|訂車|下訂)|想(?:預訂|訂房|訂車|下訂)|確認(?:預訂|訂房|訂車|下訂)|幫我(?:保留|預訂|訂房|訂車)|可以下訂|決定要(?:住|租|訂)|確定要(?:住|租|訂)|就訂這個|保留檔期/i;
const PAYMENT_COMPLETED_RE = /(?:已經?|完成)(?:付款|匯款|轉帳)|(?:付款|匯款|轉帳)(?:完成|好了|成功)|訂金(?:已付|付了|已匯)|匯款截圖|付款截圖/i;
const AVAILABILITY_RE = /檔期|空房|有空|有房|哪(?:一)?天(?:可以|能|有)|幾號(?:可以|能|有)|日期.*(?:可以|能|有空|預訂)|(?:明天|後天|下週|下個月|週[一二三四五六日天]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|\d{1,2}[\/月\-]\d{1,2}).*(?:有空|有房|可以(?:住|租|預約|訂)|能(?:住|租|預約|訂))/i;
const SPECIAL_REQUEST_RE = /特殊需求|例外|通融|折扣|議價|優惠一點|(?:提前|提早).{0,8}入住|(?:延後|晚點|延遲).{0,8}退房|(?:提早|提前).{0,8}交車|延後.{0,8}還車|異地還車|甲租乙還|長租|包月|企業合作|品牌合作|商業拍攝|婚禮|大型活動|無障礙|輪椅|醫療設備|特殊飲食|開發票|打統編|報帳/i;
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
  if (AVAILABILITY_RE.test(value)) return { reason: "availability_request", reply: null };
  if (SPECIAL_REQUEST_RE.test(value)) return { reason: "special_request", reply: null };
  return null;
}

export function needsHumanBookingGate(text) {
  return Boolean(detectHumanGate(text));
}

export function inferService(text, previousService = null) {
  const hasCampsite = CAMPSITE_RE.test(text || "");
  const hasCampervan = CAMPERVAN_RE.test(text || "");
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

function fallbackReply(text, service) {
  const value = String(text || "");
  if (/電話|聯絡/.test(value)) return "可以直接在這裡留言，或來電 0911-252-302。完整資訊也可以查看露營區官網 https://camp.8-ways.com/ 與露營車官網 https://van.joyforest.tw/ 。";
  if (/寵物|狗狗|貓咪|毛孩/.test(value)) return "露營區兩個房型都可以帶毛孩，但預訂前請先告知種類、數量與體型；毛孩請勿上床、沙發及寢具。完整規定請看 https://camp.8-ways.com/ 。";
  if (/入住|退房|幾點/.test(value) && service !== "campervan") return "露營區下午 3:00 入住，中午 12:00 退房。若有提早入住或延後退房需求，我們需要另外確認。";
  if (/幾人|人數|六人|6人|床型|幾張床/.test(value) && service !== "campervan") return "熱氣球房與雲朵房都可安排 1～6 人入住，4 人最舒適。熱氣球房有雙人床、雙人沙發床，第 5、6 位加設雙人床墊；雲朵房有 2 張雙人床，第 5、6 位加設雙人床墊。";
  if (/駕照|幾人|人數|床|設備|衛浴|冷氣|冰箱|清水/.test(value) && service === "campervan") return "露營車是自排自走式，一般小客車駕照即可駕駛，合法乘坐 6 人；車內有兩張雙人床、冷暖氣、冰箱、簡易衛浴與約 110 公升清水。建議睡 5 位成人或 4 位成人加 2 位兒童。詳情：https://van.joyforest.tw/pages/campervan";
  if (/價格|費用|多少錢/.test(value) && service === "campervan") return "露營車平日 3 天 2 夜／48 小時 NT$11,800 起，正式費用會依日期、交還車時間、送車地點、天數與加購項目確認。價格與車款：https://van.joyforest.tw/pages/campervan";
  if (/價格|費用|多少錢/.test(value)) return "露營區一般日期參考：熱氣球房官網直訂 NT$5,800，雲朵房打卡優惠 NT$5,000；連續假期、跨年與春節請以空房日曆顯示為準。詳情：https://camp.8-ways.com/";
  if (/網址|官網|介紹|資料/.test(value)) return "露營區官網：https://camp.8-ways.com/\n露營車官網：https://van.joyforest.tw/\n有想看的房型、設備或租車資訊，也可以直接告訴我們。";
  return null;
}

export async function generateLineAssistantReply(env, { text, history, previousService }) {
  const service = inferService(text, previousService);
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
        serviceContext: service === "campsite" ? "露營區" : service === "campervan" ? "露營車" : null
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
  if (reply === "NEEDS_REVIEW" || UNSAFE_OUTPUT_RE.test(reply)) {
    return { reply: null, pause: true, pauseReason: "assistant_output_review", service };
  }

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

import {
  createErrorHumanGateResult,
  createHumanGateResult,
  createImageHumanGateResult,
  detectHumanGate,
  generateLineAssistantReply,
  inferService,
  isAvailabilityQuestion,
  needsHumanBookingGate
} from "../_lib/line-assistant.js";
import { answerAvailabilityQuestion } from "../_lib/line-availability.js";
import { getLineProfile, pushLineText, replyLineText } from "../_lib/line-api.js";
import { verifyLineSignature } from "../_lib/line-signature.js";

const STATE_TTL_SECONDS = 60 * 60 * 24 * 90;
const EVENT_TTL_SECONDS = 60 * 60 * 24;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function stateKey(userId) {
  return `chat:${userId}`;
}

function resumeKey(code) {
  return `resume:${code}`;
}

function resumeCodeForUser(userId) {
  return String(userId || "").slice(-8).toUpperCase();
}

async function loadState(env, userId) {
  const raw = await env.LINE_CHAT_STATE.get(stateKey(userId));
  if (!raw) return { paused: false, history: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { paused: false, history: [] };
  }
}

async function saveState(env, userId, state) {
  await env.LINE_CHAT_STATE.put(
    stateKey(userId),
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    { expirationTtl: STATE_TTL_SECONDS }
  );
}

async function isDuplicateEvent(env, webhookEventId) {
  if (!webhookEventId) return false;
  const key = `event:${webhookEventId}`;
  if (await env.LINE_CHAT_STATE.get(key)) return true;
  await env.LINE_CHAT_STATE.put(key, "1", { expirationTtl: EVENT_TTL_SECONDS });
  return false;
}

async function ensureDisplayName(env, userId, state) {
  if (state.displayName) return state;
  const profile = await getLineProfile(env, userId);
  return profile?.displayName ? { ...state, displayName: profile.displayName } : state;
}

function serviceLabel(service) {
  if (service === "campsite") return "露營區";
  if (service === "campervan") return "露營車";
  return "待確認";
}

function reasonLabel(reason) {
  if (reason === "availability_request") return "客人詢問檔期／空房";
  if (reason === "availability_lookup_failed") return "即時檔期暫時無法讀取";
  if (reason === "special_request") return "客人提出特殊需求";
  if (reason === "booking_confirmation") return "客人準備預訂";
  if (reason === "payment_confirmation") return "客人表示已付款";
  if (reason === "image_or_payment_confirmation") return "客人傳送圖片或付款資料";
  if (reason === "assistant_error") return "系統查詢暫時無法完成";
  if (reason === "unmatched_question") return "一般問答未能安全判斷";
  if (reason === "assistant_output_review") return "回覆內容需要檢查";
  return "需要確認";
}

async function getOwnerUserId(env) {
  if (env.JOYFOREST_OWNER_LINE_USER_ID) return env.JOYFOREST_OWNER_LINE_USER_ID;
  return env.LINE_CHAT_STATE.get("system:owner_line_user_id");
}

async function notifyOwner(env, state, result, messageText, messageType) {
  const ownerUserId = await getOwnerUserId(env);
  if (!ownerUserId) {
    console.warn("Owner LINE user ID is not configured");
    return;
  }

  const preview = String(messageText || `[${messageType || "訊息"}]`).trim().slice(0, 500);
  const notice = [
    "【LINE 待確認】",
    `客人：${state.displayName || "未取得名稱"}`,
    `服務：${serviceLabel(state.service)}`,
    `原因：${reasonLabel(result.pauseReason)}`,
    `客人訊息：${preview}`,
    "請到 LINE 官方帳號聊天室接續回覆。",
    `處理完成後，請傳送：管理員恢復 ${state.resumeCode}`
  ].join("\n");

  try {
    await pushLineText(env, ownerUserId, notice);
  } catch (error) {
    console.error("Owner LINE notification failed", error);
  }
}

async function handleMessageEvent(env, event) {
  const userId = event.source?.userId;
  if (!userId || !event.replyToken || !event.message) return;
  if (await isDuplicateEvent(env, event.webhookEventId)) return;

  let state = await loadState(env, userId);
  state = await ensureDisplayName(env, userId, state);

  const messageText = event.message.type === "text" ? String(event.message.text || "").trim() : "";

  if (messageText.startsWith("管理員綁定 ")) {
    const suppliedCode = messageText.slice("管理員綁定 ".length).trim();
    if (env.OWNER_BIND_CODE && suppliedCode === env.OWNER_BIND_CODE) {
      await env.LINE_CHAT_STATE.put("system:owner_line_user_id", userId);
      await replyLineText(env, event.replyToken, "管理員通知已啟用。之後遇到特殊需求、預訂、付款確認，或即時檔期暫時無法讀取時，會由這個官方帳號通知您。");
    } else {
      await replyLineText(env, event.replyToken, "管理員驗證碼不正確。");
    }
    return;
  }

  if (messageText.startsWith("管理員恢復 ")) {
    const ownerUserId = await getOwnerUserId(env);
    if (!ownerUserId || ownerUserId !== userId) {
      await replyLineText(env, event.replyToken, "這個指令僅限已綁定的管理員使用。");
      return;
    }

    const resumeCode = messageText.slice("管理員恢復 ".length).trim().toUpperCase();
    const targetUserId = resumeCode ? await env.LINE_CHAT_STATE.get(resumeKey(resumeCode)) : null;
    if (!targetUserId) {
      await replyLineText(env, event.replyToken, "找不到這筆待確認對話，可能已經解除暫停。");
      return;
    }

    const targetState = await loadState(env, targetUserId);
    targetState.paused = false;
    targetState.pauseReason = null;
    targetState.pausedAt = null;
    targetState.resumeCode = null;
    await saveState(env, targetUserId, targetState);
    await env.LINE_CHAT_STATE.delete(resumeKey(resumeCode));
    await replyLineText(
      env,
      event.replyToken,
      `已解除「${targetState.displayName || "這位客人"}」的暫停，下一則訊息會恢復一般自動回覆。`
    );
    return;
  }

  state.lastMessagePreview = (messageText || `[${event.message.type}]`).slice(0, 160);
  state.lastMessageAt = new Date(event.timestamp || Date.now()).toISOString();

  if (state.paused) {
    await saveState(env, userId, state);
    return;
  }

  let result;
  if (event.message.type === "image") {
    result = createImageHumanGateResult();
  } else if (event.message.type !== "text" || !messageText) {
    result = {
      reply: "訊息已收到。若要詢問露營區或露營車的檔期與方案，也可以直接用文字告訴我們，謝謝。",
      pause: false
    };
  } else if (detectHumanGate(messageText) || needsHumanBookingGate(messageText)) {
    result = createHumanGateResult(messageText);
  } else if (isAvailabilityQuestion(messageText)) {
    result = await answerAvailabilityQuestion(env, {
      text: messageText,
      service: inferService(messageText, state.service)
    });
  } else {
    try {
      result = await generateLineAssistantReply(env, {
        text: messageText,
        history: state.history,
        previousService: state.service
      });
    } catch (error) {
      console.error("LINE assistant generation failed", error);
      result = createErrorHumanGateResult();
    }
  }

  if (result.reply) await replyLineText(env, event.replyToken, result.reply);

  state.service = result.service || inferService(messageText, state.service);
  if (result.history) state.history = result.history;
  else if (messageText) {
    state.history = [...(state.history || []), { role: "user", content: messageText }, { role: "assistant", content: result.reply }].slice(-12);
  }
  if (result.pause) {
    state.paused = true;
    state.pauseReason = result.pauseReason;
    state.pausedAt = new Date().toISOString();
    state.resumeCode = resumeCodeForUser(userId);
    await env.LINE_CHAT_STATE.put(resumeKey(state.resumeCode), userId, {
      expirationTtl: STATE_TTL_SECONDS
    });
  }
  await saveState(env, userId, state);
  if (result.pause) {
    await notifyOwner(env, state, result, messageText, event.message.type);
  }
}

export async function onRequestGet() {
  return json({ ok: true, service: "joyforest-line-webhook" });
}

export async function onRequestPost({ request, env }) {
  if (!env.LINE_CHANNEL_SECRET || !env.LINE_CHANNEL_ACCESS_TOKEN || !env.LINE_CHAT_STATE || !env.AI) {
    return json({ ok: false, error: "server_not_configured" }, 503);
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") || "";
  if (!(await verifyLineSignature(env.LINE_CHANNEL_SECRET, rawBody, signature))) {
    return json({ ok: false, error: "invalid_signature" }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  for (const event of payload.events || []) {
    if (event.type === "message") await handleMessageEvent(env, event);
  }
  return json({ ok: true });
}

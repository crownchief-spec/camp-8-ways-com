import { jsonResponse, requireStaffSession } from "../../_lib/staff-auth.js";

const STATE_TTL_SECONDS = 60 * 60 * 24 * 90;

function publicConversation(userId, state) {
  return {
    userId,
    displayName: state.displayName || "未取得名稱",
    paused: Boolean(state.paused),
    pauseReason: state.pauseReason || null,
    pausedAt: state.pausedAt || null,
    service: state.service || null,
    lastMessagePreview: state.lastMessagePreview || "",
    lastMessageAt: state.lastMessageAt || null,
    updatedAt: state.updatedAt || null
  };
}

export async function onRequestGet({ request, env }) {
  if (!(await requireStaffSession(request, env))) {
    return jsonResponse({ ok: false, error: "尚未登入。" }, 401);
  }
  if (!env.LINE_CHAT_STATE) return jsonResponse({ ok: false, error: "尚未設定 LINE_CHAT_STATE。" }, 503);

  const listed = await env.LINE_CHAT_STATE.list({ prefix: "chat:" });
  const conversations = [];
  for (const key of listed.keys) {
    const raw = await env.LINE_CHAT_STATE.get(key.name);
    if (!raw) continue;
    try {
      const state = JSON.parse(raw);
      if (state.paused) conversations.push(publicConversation(key.name.slice(5), state));
    } catch {
      // Ignore malformed state records; the webhook recreates them on the next message.
    }
  }
  conversations.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return jsonResponse({ ok: true, conversations });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireStaffSession(request, env))) {
    return jsonResponse({ ok: false, error: "尚未登入。" }, 401);
  }
  if (!env.LINE_CHAT_STATE) return jsonResponse({ ok: false, error: "尚未設定 LINE_CHAT_STATE。" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "請提供 JSON。" }, 400);
  }
  const userId = String(body.userId || "");
  if (!/^U[0-9a-f]{20,}$/i.test(userId)) {
    return jsonResponse({ ok: false, error: "userId 格式錯誤。" }, 400);
  }
  if (body.action !== "resume" && body.action !== "pause") {
    return jsonResponse({ ok: false, error: "action 必須是 resume 或 pause。" }, 400);
  }

  const key = `chat:${userId}`;
  const raw = await env.LINE_CHAT_STATE.get(key);
  if (!raw) return jsonResponse({ ok: false, error: "找不到此對話。" }, 404);
  const state = JSON.parse(raw);
  state.paused = body.action === "pause";
  state.pauseReason = state.paused ? "manual_pause" : null;
  state.pausedAt = state.paused ? new Date().toISOString() : null;
  state.updatedAt = new Date().toISOString();
  await env.LINE_CHAT_STATE.put(key, JSON.stringify(state), { expirationTtl: STATE_TTL_SECONDS });
  return jsonResponse({ ok: true, conversation: publicConversation(userId, state) });
}

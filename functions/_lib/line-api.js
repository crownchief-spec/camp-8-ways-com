const LINE_API_BASE = "https://api.line.me/v2/bot";

async function lineRequest(env, path, options = {}) {
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(`${LINE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LINE API ${path} failed: HTTP ${response.status} ${detail.slice(0, 240)}`);
  }
  return response;
}

export async function replyLineText(env, replyToken, text) {
  const safeText = String(text || "").trim().slice(0, 4800);
  if (!replyToken || !safeText) return;

  await lineRequest(env, "/message/reply", {
    method: "POST",
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: safeText }]
    })
  });
}

export async function pushLineText(env, userId, text) {
  const safeText = String(text || "").trim().slice(0, 4800);
  if (!userId || !safeText) return;

  await lineRequest(env, "/message/push", {
    method: "POST",
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: safeText }]
    })
  });
}

export async function getLineProfile(env, userId) {
  if (!userId) return null;
  try {
    const response = await lineRequest(env, `/profile/${encodeURIComponent(userId)}`);
    const profile = await response.json();
    return {
      displayName: String(profile.displayName || "").slice(0, 80)
    };
  } catch (error) {
    console.warn("LINE profile lookup failed", error);
    return null;
  }
}

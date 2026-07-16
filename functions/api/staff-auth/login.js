import {
  createSessionToken,
  getSessionSecret,
  jsonResponse,
  sessionCookieHeader
} from "../../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!getSessionSecret(env)) {
    return jsonResponse(
      { ok: false, error: "伺服器尚未設定 STAFF_AVAILABILITY_PASSWORD 環境變數。" },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "請提供密碼。" }, 400);
  }

  const password = (body.password || "").trim();
  if (!password) {
    return jsonResponse({ ok: false, error: "請輸入密碼。" }, 400);
  }

  if (password !== env.STAFF_AVAILABILITY_PASSWORD) {
    return jsonResponse({ ok: false, error: "密碼錯誤。" }, 401);
  }

  const token = await createSessionToken(env);
  if (!token) {
    return jsonResponse({ ok: false, error: "無法建立登入 session。" }, 500);
  }

  return jsonResponse(
    { ok: true },
    200,
    {
      "Set-Cookie": sessionCookieHeader(token, 7 * 24 * 60 * 60)
    }
  );
}

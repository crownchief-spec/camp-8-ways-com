import { clearSessionCookieHeader, jsonResponse } from "../../_lib/staff-auth.js";

export async function onRequestPost() {
  return jsonResponse(
    { ok: true },
    200,
    {
      "Set-Cookie": clearSessionCookieHeader()
    }
  );
}

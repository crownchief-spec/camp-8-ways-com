import { jsonResponse, requireStaffSession } from "../../_lib/staff-auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const authenticated = await requireStaffSession(request, env);
  return jsonResponse({ ok: true, authenticated });
}

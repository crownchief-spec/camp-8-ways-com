const COOKIE_NAME = "staff_availability_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function toBase64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(secret, payloadB64) {
  const key = await importHmacKey(secret);
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return toBase64Url(new Uint8Array(sig));
}

async function verifySignature(secret, payloadB64, signature) {
  const key = await importHmacKey(secret);
  const enc = new TextEncoder();
  return crypto.subtle.verify("HMAC", key, fromBase64Url(signature), enc.encode(payloadB64));
}

export function getSessionSecret(env) {
  const password = env.STAFF_AVAILABILITY_PASSWORD;
  if (!password) return null;
  return password;
}

export async function createSessionToken(env) {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const payload = {
    iat: Date.now(),
    exp: Date.now() + SESSION_MS
  };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(secret, payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(env, token) {
  const secret = getSessionSecret(env);
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  const valid = await verifySignature(secret, payloadB64, signature);
  if (!valid) return false;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(json);
    if (!payload.exp || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function readSessionCookie(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
      return decodeURIComponent(trimmed.slice(COOKIE_NAME.length + 1));
    }
  }
  return null;
}

export function sessionCookieHeader(token, maxAgeSec) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${maxAgeSec}`
  ];
  return parts.join("; ");
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function requireStaffSession(request, env) {
  const token = readSessionCookie(request);
  const ok = await verifySessionToken(env, token);
  return ok;
}

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      ...extraHeaders
    }
  });
}

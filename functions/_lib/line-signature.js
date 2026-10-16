function decodeBase64(value) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function verifyLineSignature(secret, body, signature) {
  if (!secret || !body || !signature) return false;
  const signatureBytes = decodeBase64(signature);
  if (!signatureBytes) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(body)
  );
}

export async function privacySafeUserId(userId) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(userId || "unknown")
  );
  return [...new Uint8Array(bytes)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

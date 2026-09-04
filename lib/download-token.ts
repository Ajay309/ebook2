import crypto from "crypto";

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET!;
const EXPIRY_SECONDS = 300; // 5 minute window to actually click download

interface TokenPayload {
  userId: number;
  exp: number;
}

export function createDownloadToken(userId: number): string {
  const payload: TokenPayload = { userId, exp: Date.now() + EXPIRY_SECONDS * 1000 };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyDownloadToken(token: string): { valid: boolean; userId?: number } {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return { valid: false };

  const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
  if (sig !== expectedSig) return { valid: false };

  const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  if (Date.now() > payload.exp) return { valid: false };

  return { valid: true, userId: payload.userId };
}

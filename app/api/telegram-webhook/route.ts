import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isChannelMember } from "@/lib/telegram-auth";

const TOKEN_TTL_SECONDS = 600; // 10 minutes to complete verification

export async function POST(req: NextRequest) {
  const update = await req.json();
  const message = update.message;

  // Ignore anything that isn't a /start command with our token attached
  if (!message?.text?.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const [, sessionToken] = message.text.split(" ");
  if (!sessionToken) {
    return NextResponse.json({ ok: true });
  }

  const telegramUserId = message.from.id as number;
  const member = await isChannelMember(telegramUserId);

  await redis.set(
    `verify:${sessionToken}`,
    JSON.stringify({
      status: member ? "verified" : "not_member",
      telegramUserId,
    }),
    { ex: TOKEN_TTL_SECONDS }
  );

  return NextResponse.json({ ok: true });
}

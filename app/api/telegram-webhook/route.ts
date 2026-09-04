import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { isChannelMember } from "@/lib/telegram-auth";

const TOKEN_TTL_SECONDS = 600; 

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message;

    if (!message?.text?.startsWith("/start")) {
      return NextResponse.json({ ok: true });
    }

    const [, sessionToken] = message.text.split(" ");
    if (!sessionToken) {
      console.log("No token found in command");
      return NextResponse.json({ ok: true });
    }

    const telegramUserId = message.from.id as number;
    console.log(`Checking user: ${telegramUserId} for token: ${sessionToken}`);

    // Yahan agar error aayega toh catch block me jayega
    const member = await isChannelMember(telegramUserId);
    console.log(`User membership status: ${member}`);

    await redis.set(
      `verify:${sessionToken}`,
      JSON.stringify({
        status: member ? "verified" : "not_member",
        telegramUserId,
      }),
      { ex: TOKEN_TTL_SECONDS }
    );
    
    console.log("Successfully saved to Redis!");
    return NextResponse.json({ ok: true });

  } catch (error) {
    // Ye line aapko Vercel ke logs me exact problem bata degi
    console.error("Bot Webhook Error:", error); 
    return NextResponse.json({ ok: true }); 
  }
}
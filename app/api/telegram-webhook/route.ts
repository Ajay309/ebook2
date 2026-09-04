import { NextRequest, NextResponse } from "next/server";
import { isChannelMember } from "@/lib/telegram-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK!;
// Yahan apne PDF ka direct link daaliye (kisi server ya AWS/Vercel blob par host kiya hua)
const PDF_FILE_URL = "https://drive.google.com/file/d/1vFy4dmbDm1a-CcOlzDieeUu5cIEjzuTV/view?usp=drive_link"; 

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1. Agar user ne /start dabaya
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      
      // Bot bolega channel join karo
      await sendMessage(chatId, "Welcome! To get the free ebook, please join our channel first.", {
        inline_keyboard: [
          [{ text: "1. Join Channel 📢", url: CHANNEL_LINK }],
          [{ text: "2. I have Joined ✅", callback_data: "check_membership" }]
        ]
      });
      return NextResponse.json({ ok: true });
    }

    // 2. Agar user ne "I have Joined ✅" wala button dabaya
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;

      if (callbackQuery.data === "check_membership") {
        const isMember = await isChannelMember(userId);

        if (isMember) {
          // Join kar liya hai toh PDF bhej do
          await sendMessage(chatId, "Thank you for joining! Here is your Ebook 👇");
          await sendDocument(chatId, PDF_FILE_URL);
        } else {
          // Join nahi kiya toh wapas warning do
          await sendMessage(chatId, "Aapne abhi tak channel join nahi kiya hai. Pehle join karein, fir verify dabayein!");
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bot Error:", error);
    return NextResponse.json({ ok: true });
  }
}

// Telegram API helpers
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, reply_markup: replyMarkup }),
  });
}

async function sendDocument(chatId: number, documentUrl: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, document: documentUrl }),
  });
}
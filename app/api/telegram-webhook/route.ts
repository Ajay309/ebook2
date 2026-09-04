import { NextRequest, NextResponse } from "next/server";
import { isChannelMember } from "@/lib/telegram-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK!;

// TEST LINK: Ek choti PDF (sirf check karne ke liye ki file send hoti hai ya nahi)
const TEST_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; 

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      
      await sendMessage(chatId, "Welcome! To get the free ebook, please join our channel first.", {
        inline_keyboard: [
          [{ text: "1. Join Channel 📢", url: CHANNEL_LINK }],
          [{ text: "2. I have Joined ✅", callback_data: "check_membership" }]
        ]
      });
      return NextResponse.json({ ok: true });
    }

    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const callbackQueryId = callbackQuery.id;

      // 1. Loading stop karo
      await answerCallbackQuery(callbackQueryId);
      
      // 2. User ko batao ki click receive ho gaya
      await sendMessage(chatId, "⏳ Button click receive ho gaya. Membership check kar rahe hain...");

      try {
        const isMember = await isChannelMember(userId);

        if (isMember) {
          // 3. User ko batao ki membership verify ho gayi
          await sendMessage(chatId, "✅ Verification Success! Ab PDF bhej rahe hain...");
          
          // 4. Test PDF bhej kar dekho
          const docRes = await sendDocument(chatId, TEST_PDF_URL);
          const docResult = await docRes.json();
          
          if (!docResult.ok) {
            await sendMessage(chatId, `❌ PDF Bhejne me fail ho gaya: ${docResult.description}`);
          }
        } else {
          await sendMessage(chatId, "❌ Aapne abhi tak channel join nahi kiya hai. Pehle join karein!");
        }
      } catch (err: any) {
        // Agar isChannelMember me error aaye toh yahan dikhega
        await sendMessage(chatId, `❌ Membership check me Error aagaya: ${err.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: true });
  }
}

// ---- API Helpers ----
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, reply_markup: replyMarkup }),
  });
}

async function sendDocument(chatId: number, documentUrl: string) {
  return await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, document: documentUrl }),
  });
}

async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}
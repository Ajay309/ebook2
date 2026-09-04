# Ebook-gated-behind-Telegram-join — Deep-link version (no OTP, no Login Widget)

## Why this version
The Telegram Login Widget needs a phone-number OTP the first time a browser
logs in — and OTP delivery can silently fail (rate limits, carrier
filtering). This version skips it entirely: the user just taps **Start**
inside Telegram. No popup, no code.

## 1. Upstash Redis (free) — required for this approach
Serverless API routes don't hold memory between requests, so we need
somewhere to briefly store "this session token belongs to this Telegram
user, and they're verified."
1. Go to https://upstash.com → sign up (free tier is plenty for this).
2. Create a Redis database.
3. Copy the **REST URL** and **REST TOKEN** from its dashboard.

## 2. BotFather setup
1. Same bot token as before (`TELEGRAM_BOT_TOKEN`) — no `/setdomain` needed
   this time, since there's no Login Widget.
2. Bot must still be an **admin** of your channel (for `getChatMember`).

## 3. Register the webhook (one-time, after you deploy)
Telegram needs to know where to send messages sent to your bot. Run this
once, after your app is live on a real HTTPS URL:
```bash
curl -F "url=https://yourdomain.com/api/telegram-webhook" \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```
Replace `yourdomain.com` with your actual deployed domain and
`<YOUR_BOT_TOKEN>` with your real token. You should get back
`{"ok":true,"result":true,...}`.

To check it's registered correctly any time:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## 4. Files
```
app/page.tsx                        → landing page (deep-link + polling)
app/api/telegram-webhook/route.ts   → Telegram calls this when user hits Start
app/api/verify-status/route.ts      → frontend polls this
app/api/download/route.ts           → serves file with a valid token (unchanged)
lib/telegram-auth.ts                → isChannelMember() (unchanged)
lib/download-token.ts               → signed download tokens (unchanged)
lib/redis.ts                        → Upstash client (new)
```

## 5. Env vars
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=...
DOWNLOAD_TOKEN_SECRET=...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...      (no @)
NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
Don't forget to add the Upstash and webhook-related vars in Vercel's
dashboard too (Project → Settings → Environment Variables), not just
`.env.local` — `.env.local` only applies locally.

## 6. Local testing note
The webhook needs a public HTTPS URL to receive Telegram's messages, so
this part can't be tested on `localhost` directly — either test on your
actual Vercel deployment, or use an ngrok tunnel and register that as the
webhook URL temporarily.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!;

/**
 * Cross-checks with Telegram's Bot API whether this user is actually a
 * member of the gated channel. Your bot MUST be an admin of the channel
 * for getChatMember to work on a private/broadcast channel.
 */
export async function isChannelMember(userId: number): Promise<boolean> {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`
  );
  const data = await res.json();

  if (!data.ok) return false;

  const status = data.result?.status as string | undefined;

  if (status === "creator" || status === "administrator" || status === "member") {
    return true;
  }
  // "restricted" members can still count as members if is_member is true
  if (status === "restricted" && data.result?.is_member) return true;

  return false; // "left" or "kicked"
}

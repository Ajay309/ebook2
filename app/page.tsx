"use client";

import { useEffect, useRef, useState } from "react";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!;
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK!;

type Status = "idle" | "waiting" | "not_member" | "error" | "timeout";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000; // give up after 2 minutes

export default function EbookLandingPage() {
  const [joinedClicked, setJoinedClicked] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startVerification() {
    const token = crypto.randomUUID();
    setSessionToken(token);
    setStatus("waiting");

    // Opens the bot chat directly — on mobile this jumps straight into the
    // Telegram app; the user only has to tap "Start", nothing else.
    window.open(`https://t.me/${BOT_USERNAME}?start=${token}`, "_blank");

    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("timeout");
        return;
      }

      try {
        const res = await fetch(`/api/verify-status?token=${token}`);
        const data = await res.json();

        if (data.status === "verified") {
          if (pollRef.current) clearInterval(pollRef.current);
          window.location.href = data.downloadUrl;
        } else if (data.status === "not_member") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("not_member");
        }
        // "pending" → keep polling silently
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus("error");
      }
    }, POLL_INTERVAL_MS);
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <p className="text-[#7d8590] text-sm mb-3">Free download</p>
        <h1 className="text-3xl font-semibold leading-tight mb-3">
          Get your copy of the ebook
        </h1>
        <p className="text-[#9198a1] mb-8 leading-relaxed">
          Join the Telegram channel first — once you're in, verify with the
          bot and the download unlocks instantly.
        </p>

        {!joinedClicked && (
          <a
            href={CHANNEL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setJoinedClicked(true)}
            className="inline-flex items-center justify-center w-full bg-[#2ea6ff] hover:bg-[#4db5ff] text-[#0d1117] font-medium px-5 py-3 rounded-lg transition-colors"
          >
            Join the channel
          </a>
        )}

        {joinedClicked && (
          <div className="border border-[#30363d] rounded-lg p-6 space-y-4">
            <p className="text-sm text-[#9198a1]">
              Already joined? Verify to unlock the download.
            </p>

            {status === "idle" && (
              <button
                onClick={startVerification}
                className="inline-flex items-center justify-center w-full bg-[#2ea6ff] hover:bg-[#4db5ff] text-[#0d1117] font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Verify & Download
              </button>
            )}

            {status === "waiting" && (
              <p className="text-sm text-[#2ea6ff]">
                Telegram me bot ka chat khula hai — bas <strong>Start</strong>{" "}
                daba do, download apne aap shuru ho jayega...
              </p>
            )}
            {status === "not_member" && (
              <p className="text-sm text-[#f85149]">
                Channel me nahi mile. Pehle join karo, phir dobara verify karo.
              </p>
            )}
            {status === "timeout" && (
              <p className="text-sm text-[#f85149]">
                Kaafi der ho gayi, Start button dabana reh gaya lagta hai. Dobara try karo.
              </p>
            )}
            {status === "error" && (
              <p className="text-sm text-[#f85149]">
                Kuch gadbad ho gayi. Dobara try karo.
              </p>
            )}
            {(status === "not_member" || status === "timeout" || status === "error") && (
              <button
                onClick={startVerification}
                className="text-sm text-[#2ea6ff] underline underline-offset-2"
              >
                Try again
              </button>
            )}

            <a
              href={CHANNEL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[#7d8590] underline underline-offset-2 hover:text-[#e6edf3]"
            >
              Open channel again
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

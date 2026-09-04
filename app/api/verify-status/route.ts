import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createDownloadToken } from "@/lib/download-token";

export async function GET(req: NextRequest) {
  const sessionToken = req.nextUrl.searchParams.get("token") ?? "";
  const raw = await redis.get<string>(`verify:${sessionToken}`);

  if (!raw) {
    return NextResponse.json({ status: "pending" });
  }

  const data = typeof raw === "string" ? JSON.parse(raw) : raw;

  if (data.status === "verified") {
    const downloadUrl = `/api/download?token=${createDownloadToken(data.telegramUserId)}`;
    return NextResponse.json({ status: "verified", downloadUrl });
  }

  return NextResponse.json({ status: data.status });
}

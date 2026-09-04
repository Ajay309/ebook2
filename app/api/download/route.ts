import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/download-token";
import fs from "fs";
import path from "path";

// Kept OUTSIDE /public on purpose — a file in /public can be hit directly by
// URL guessing and skips the gate entirely.
const EBOOK_PATH = path.join(process.cwd(), "private-files", "ebook.pdf");

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const { valid } = verifyDownloadToken(token);

  if (!valid) {
    return NextResponse.json(
      { error: "Link expired or invalid. Please verify again." },
      { status: 401 }
    );
  }

  const file = fs.readFileSync(EBOOK_PATH);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="ebook.pdf"',
    },
  });
}

import { NextResponse } from "next/server";
import { getYtDlpRunner, getFfmpegPath } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const runner = getYtDlpRunner();
  const ffmpeg = getFfmpegPath();
  const hasCookies = Boolean(process.env.YOUTUBE_COOKIES || process.env.COOKIES_TXT);

  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    engine: {
      runnerCommand: runner.command,
      hasPrefixArgs: runner.prefixArgs.length > 0,
      ffmpegLocation: ffmpeg ? "available" : "not found",
      cookiesConfigured: hasCookies,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\r\n\t\0]/g, "")
      .replace(/[/\\?%*:|"<>#]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 80) || "subtitles"
  );
}

function isValidYouTubeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("-")) return false;

  try {
    let toParse = trimmed;
    if (!toParse.startsWith("http://") && !toParse.startsWith("https://")) {
      toParse = `https://${toParse}`;
    }
    const parsed = new URL(toParse);
    const host = parsed.hostname.toLowerCase();

    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be" ||
      host === "www.youtube-nocookie.com"
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const rawLang = searchParams.get("lang") || "en";
  const rawFormat = searchParams.get("format") || "vtt";
  const rawTitle = searchParams.get("title") || "subtitles";

  if (!rawUrl || !isValidYouTubeUrl(rawUrl)) {
    return new NextResponse("Invalid or unsupported YouTube URL.", { status: 400 });
  }

  const lang = /^[a-zA-Z0-9_-]{1,12}$/.test(rawLang) ? rawLang : "en";
  const format = /^(vtt|srt)$/.test(rawFormat) ? rawFormat : "vtt";
  const filename = `${sanitizeFilename(rawTitle)}_${lang}.${format}`;

  try {
    const child = spawn(
      "python",
      [
        "-m",
        "yt_dlp",
        "--js-runtimes",
        "node",
        "--no-check-certificates",
        "-j",
        "--no-warnings",
        "--skip-download",
        "--",
        rawUrl.trim(),
      ],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d.toString("utf-8")));

    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0 && stdout.trim()) resolve(true);
        else reject(new Error(`yt-dlp exited with status ${code}`));
      });
      child.on("error", reject);
    });

    const info = JSON.parse(stdout);
    const subs = info.subtitles?.[lang] || info.automatic_captions?.[lang];

    if (!subs || subs.length === 0) {
      return new NextResponse("No subtitles found for this language.", { status: 404 });
    }

    const matchedFormat =
      subs.find((s: any) => s.ext === format) ||
      subs.find((s: any) => s.ext === "vtt") ||
      subs[0];

    if (!matchedFormat?.url) {
      return new NextResponse("Subtitle stream unavailable.", { status: 404 });
    }

    const subResponse = await fetch(matchedFormat.url);
    const subText = await subResponse.text();

    const contentType =
      format === "vtt" ? "text/vtt; charset=utf-8" : "application/x-subrip; charset=utf-8";

    return new NextResponse(subText, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Subtitle route error handled:", error.message);
    return new NextResponse(
      `Subtitle Error: ${error.message || "Failed to fetch subtitles."}`,
      { status: 500 }
    );
  }
}

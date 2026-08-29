import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100) || "subtitles"
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const lang = searchParams.get("lang") || "en";
  const format = searchParams.get("format") || "vtt";
  const rawTitle = searchParams.get("title") || "subtitles";

  if (!url) {
    return new NextResponse("Video URL is required.", { status: 400 });
  }

  try {
    const filename = `${sanitizeFilename(rawTitle)}_${lang}.${format}`;

    // Extract subtitle URL from yt-dlp metadata
    const child = spawn(
      "python",
      ["-m", "yt_dlp", "--js-runtimes", "node", "-j", "--no-warnings", "--skip-download", url],
      { windowsHide: true }
    );

    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d.toString("utf-8")));

    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new Error(`yt-dlp exited with code ${code}`));
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
    console.error("Subtitle route error:", error);
    return new NextResponse(
      `Subtitle Error: ${error.message || "Failed to fetch subtitles."}`,
      { status: 500 }
    );
  }
}

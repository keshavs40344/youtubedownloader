import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { getYtDlpRunner, getProductionExtractorArgs } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\r\n\t\0]/g, "")
      .replace(/[/\\?%*:|"<>#]/g, "")
      .replace(/\s+/g, "_")
      .trim()
      .substring(0, 80) || "video"
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
  const rawFormatId = searchParams.get("format_id") || searchParams.get("itag") || "18";
  const rawHeight = searchParams.get("height") || "";
  const rawExt = (searchParams.get("ext") || "mp4").toLowerCase();
  const rawTitle = searchParams.get("title") || "video";

  if (!rawUrl || !isValidYouTubeUrl(rawUrl)) {
    return new NextResponse("Invalid or unsupported YouTube URL.", { status: 400 });
  }

  const formatId = /^[a-zA-Z0-9_+.-]{1,30}$/.test(rawFormatId) ? rawFormatId : "18";
  const height = /^[0-9]{1,5}$/.test(rawHeight) ? rawHeight : "";
  const ext = /^(mp4|m4a|webm|opus|mp3)$/.test(rawExt) ? rawExt : "mp4";
  const filename = `${sanitizeFilename(rawTitle)}.${ext}`;

  const isVideo = ext === "mp4" || ext === "webm";
  let formatSelector = formatId;

  if (isVideo) {
    if (formatId === "18") {
      formatSelector = "18/best[ext=mp4]/best";
    } else if (formatId === "best") {
      formatSelector = "best[ext=mp4]/bestvideo[height<=720]+bestaudio/18/best";
    } else if (height) {
      formatSelector = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]/18/best`;
    } else {
      formatSelector = `${formatId}+bestaudio[ext=m4a]/${formatId}/18/best`;
    }
  } else {
    if (formatId === "bestaudio") {
      formatSelector = ext === "m4a" ? "bestaudio[ext=m4a]/bestaudio/best" : "bestaudio/best";
    } else {
      formatSelector = `${formatId}/bestaudio/best`;
    }
  }

  const runner = getYtDlpRunner();
  const defaultArgs = getProductionExtractorArgs();

  try {
    const getUrlArgs = [
      ...runner.prefixArgs,
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      ...defaultArgs,
      "-f",
      formatSelector,
      "-g",
      "--",
      rawUrl.trim(),
    ];

    const getUrlChild = spawn(runner.command, getUrlArgs, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    getUrlChild.stdout?.on("data", (d) => (stdout += d.toString()));
    getUrlChild.stderr?.on("data", (d) => (stderr += d.toString()));

    const exitCode = await new Promise((resolve) => {
      getUrlChild.on("close", resolve);
      getUrlChild.on("error", () => resolve(1));
    });

    const directUrls = stdout.trim().split("\n").filter(Boolean);

    if (exitCode === 0 && directUrls.length > 0 && directUrls[0].startsWith("http")) {
      let cdnUrl = directUrls[0];
      if (!cdnUrl.includes("&title=")) {
        cdnUrl += `&title=${encodeURIComponent(sanitizeFilename(rawTitle))}`;
      }

      // 307 Temporary Redirect: Hands off download directly to Google CDN with 0 Vercel limits
      return NextResponse.redirect(cdnUrl, {
        status: 307,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    throw new Error(stderr || "Direct media stream could not be extracted.");
  } catch (err: any) {
    console.error("Stream route error:", err.message);
    return new NextResponse(
      `Download Error: ${err.message || "Failed to resolve stream link."}`,
      { status: 500 }
    );
  }
}
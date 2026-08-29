import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { getYtDlpRunner, getFfmpegPath } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let activeStreamsCount = 0;
const MAX_CONCURRENT_STREAMS = 25;

function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[\r\n\t\0]/g, "")
    .replace(/[/\\?%*:|"<>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.substring(0, 80) || "video";
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
  if (activeStreamsCount >= MAX_CONCURRENT_STREAMS) {
    return new NextResponse("Server is busy processing high-resolution streams. Please retry in 5 seconds.", {
      status: 429,
      headers: { "Retry-After": "5" },
    });
  }

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

  const isWin = process.platform === "win32";
  const tempDir = isWin ? path.join(process.cwd(), "scratch") : "/tmp";
  if (!fs.existsSync(tempDir)) {
    try { fs.mkdirSync(tempDir, { recursive: true }); } catch {}
  }

  const uniqueId = `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempFilePath = path.join(tempDir, `${uniqueId}.${ext}`);

  try {
    activeStreamsCount++;
    const runner = getYtDlpRunner();
    const ffmpegPath = getFfmpegPath();

    let formatSelector = formatId;
    const isVideo = ext === "mp4" || ext === "webm";

    if (isVideo) {
      if (formatId === "18") {
        formatSelector = "18/best[ext=mp4]/best";
      } else if (formatId === "best") {
        formatSelector = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";
      } else if (height) {
        formatSelector = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`;
      } else {
        formatSelector = `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`;
      }
    } else {
      if (formatId === "bestaudio") {
        formatSelector = ext === "m4a" ? "bestaudio[ext=m4a]/bestaudio/best" : "bestaudio/best";
      } else {
        formatSelector = `${formatId}/bestaudio/best`;
      }
    }

    const args = [
      ...runner.prefixArgs,
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      "--extractor-args",
      "youtube:player_client=android_creator,android",
      "--no-check-certificates",
      "--concurrent-fragments",
      "8",
      "--buffer-size",
      "32M",
      "--http-chunk-size",
      "20M",
      "--retries",
      "5",
      "--fragment-retries",
      "5",
      "-f",
      formatSelector,
      "--no-warnings",
      "--no-progress",
    ];

    if (ffmpegPath) {
      args.push("--ffmpeg-location", ffmpegPath);
      if (isVideo) {
        args.push("--merge-output-format", "mp4");
      }
    }

    // Check for cookies
    const cookiesEnv = process.env.YOUTUBE_COOKIES || process.env.COOKIES_TXT;
    const cookiesFile = isWin ? path.join(process.cwd(), "cookies.txt") : "/tmp/cookies.txt";
    if (cookiesEnv) {
      try {
        if (!fs.existsSync(cookiesFile) || fs.readFileSync(cookiesFile, "utf-8") !== cookiesEnv.trim()) {
          fs.writeFileSync(cookiesFile, cookiesEnv.trim(), "utf-8");
        }
        args.push("--cookies", cookiesFile);
      } catch {}
    } else if (fs.existsSync(cookiesFile)) {
      args.push("--cookies", cookiesFile);
    }

    args.push("-o", tempFilePath, "--", rawUrl.trim());

    // Execute download and muxing
    await new Promise((resolve, reject) => {
      const child = spawn(runner.command, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      child.stderr?.on("data", (d) => {
        stderr += d.toString();
      });

      child.on("close", (code) => {
        if (code === 0 && fs.existsSync(tempFilePath)) {
          resolve(true);
        } else {
          reject(new Error(stderr || `yt-dlp exited with status ${code}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });

      req.signal.addEventListener("abort", () => {
        try { child.kill("SIGKILL"); } catch {}
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}
      });
    });

    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Target file was not generated properly.");
    }

    const fileStat = fs.statSync(tempFilePath);
    const nodeStream = fs.createReadStream(tempFilePath);

    const cleanup = () => {
      activeStreamsCount = Math.max(0, activeStreamsCount - 1);
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {}
    };

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch {
            cleanup();
          }
        });
        nodeStream.on("end", () => {
          cleanup();
          try { controller.close(); } catch {}
        });
        nodeStream.on("error", (err) => {
          cleanup();
          try { controller.error(err); } catch {}
        });
      },
      cancel() {
        cleanup();
      },
    });

    const mimeTypes: Record<string, string> = {
      mp4: "video/mp4",
      m4a: "audio/mp4",
      webm: "video/webm",
      opus: "audio/opus",
      mp3: "audio/mpeg",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(webStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    activeStreamsCount = Math.max(0, activeStreamsCount - 1);
    try {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch {}

    console.error("Stream route handled error:", error.message);
    return new NextResponse(
      `Download Error: ${error.message || "Failed to download stream."}`,
      { status: 500 }
    );
  }
}
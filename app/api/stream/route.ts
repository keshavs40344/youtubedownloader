import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let activeStreamsCount = 0;
const MAX_CONCURRENT_STREAMS = 25;

function getPythonCommand(): string {
  return process.platform === "win32" ? "python" : "python3";
}

function getFfmpegPath(): string | null {
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      if (process.platform !== "win32") {
        try {
          fs.chmodSync(ffmpegStatic, 0o755);
        } catch {}
      }
      return ffmpegStatic;
    }
  } catch {}

  const localFfmpeg = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  if (fs.existsSync(localFfmpeg)) {
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(localFfmpeg, 0o755);
      } catch {}
    }
    return localFfmpeg;
  }

  return null;
}

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
    return new NextResponse("Server is under heavy load. Please retry in a few moments.", {
      status: 429,
      headers: { "Retry-After": "10" },
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

  try {
    activeStreamsCount++;
    const ffmpegPath = getFfmpegPath();
    const pythonCmd = getPythonCommand();

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
      "-m",
      "yt_dlp",
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      "--extractor-args",
      "youtube:player_client=web_embedded,mweb",
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

    args.push("-o", "-", "--", rawUrl.trim());

    const child = spawn(pythonCmd, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const passThrough = new PassThrough({
      highWaterMark: 1024 * 1024 * 16,
    });

    let isStreamClosed = false;

    const cleanupProcess = () => {
      if (!isStreamClosed) {
        isStreamClosed = true;
        activeStreamsCount = Math.max(0, activeStreamsCount - 1);
        try {
          child.kill("SIGKILL");
        } catch {}
      }
    };

    child.stdout.pipe(passThrough);

    child.stderr.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("ERROR:")) {
        console.warn("Stream log:", msg.trim());
      }
    });

    child.on("error", (err) => {
      console.warn("Child process error caught safely:", err.message);
      cleanupProcess();
      passThrough.destroy();
    });

    child.on("close", () => {
      cleanupProcess();
    });

    req.signal.addEventListener("abort", () => {
      cleanupProcess();
      passThrough.destroy();
    });

    const stream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch {
            cleanupProcess();
          }
        });

        passThrough.on("end", () => {
          cleanupProcess();
          try {
            controller.close();
          } catch {}
        });

        passThrough.on("error", (err) => {
          cleanupProcess();
          try {
            controller.error(err);
          } catch {}
        });
      },
      cancel() {
        cleanupProcess();
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

    return new NextResponse(stream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    activeStreamsCount = Math.max(0, activeStreamsCount - 1);
    console.error("Stream route handled error:", error.message);
    return new NextResponse(
      `Download Error: ${error.message || "Failed to initialize stream. Please try again."}`,
      { status: 500 }
    );
  }
}
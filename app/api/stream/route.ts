import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Track active streaming processes to prevent CPU/RAM saturation
let activeStreamsCount = 0;
const MAX_CONCURRENT_STREAMS = 25;

function getFfmpegPath(): string | null {
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch {}

  const localFfmpeg = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
  if (fs.existsSync(localFfmpeg)) {
    return localFfmpeg;
  }

  return null;
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100) || "video"
  );
}

export async function GET(req: NextRequest) {
  // If server is under extreme concurrent load, reject gracefully instead of crashing
  if (activeStreamsCount >= MAX_CONCURRENT_STREAMS) {
    return new NextResponse("Server is currently handling maximum concurrent downloads. Please retry in 10 seconds.", {
      status: 429,
      headers: { "Retry-After": "10" },
    });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const formatId = searchParams.get("format_id") || searchParams.get("itag") || "18";
  const height = searchParams.get("height") || "";
  const ext = (searchParams.get("ext") || "mp4").toLowerCase();
  const rawTitle = searchParams.get("title") || "video";

  if (!url) {
    return new NextResponse("Video URL is required.", { status: 400 });
  }

  try {
    activeStreamsCount++;
    const filename = `${sanitizeFilename(rawTitle)}.${ext}`;
    const ffmpegPath = getFfmpegPath();

    let formatSelector = formatId;
    const isVideo = ext === "mp4" || ext === "webm" || ext === "mkv";

    if (isVideo) {
      if (formatId === "18") {
        formatSelector = "18/best[ext=mp4]/best";
      } else if (formatId === "best" || !formatId) {
        formatSelector = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";
      } else if (height) {
        formatSelector = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`;
      } else {
        formatSelector = `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/best`;
      }
    } else {
      if (formatId === "bestaudio" || !formatId) {
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

    args.push("-o", "-", url);

    const child = spawn("python", args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const passThrough = new PassThrough({
      highWaterMark: 1024 * 1024 * 16, // 16MB buffer
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
        console.warn("Stream stderr:", msg.trim());
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

    // Abort signal from client disconnecting
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
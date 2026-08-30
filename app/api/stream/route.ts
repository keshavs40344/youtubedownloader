import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";
import { getYtDlpRunner, getFfmpegPath, getProductionExtractorArgs } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // Tier 1: Instant Direct CDN Stream URL Resolution (-g)
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
      const cdnUrl = directUrls[0];
      const cdnResponse = await fetch(cdnUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: req.signal,
      });

      if (cdnResponse.ok && cdnResponse.body) {
        const mimeTypes: Record<string, string> = {
          mp4: "video/mp4",
          m4a: "audio/mp4",
          webm: "video/webm",
          opus: "audio/opus",
          mp3: "audio/mpeg",
        };

        const contentType = cdnResponse.headers.get("content-type") || mimeTypes[ext] || "application/octet-stream";
        const contentLength = cdnResponse.headers.get("content-length");

        const responseHeaders: Record<string, string> = {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        };

        if (contentLength) {
          responseHeaders["Content-Length"] = contentLength;
        }

        return new NextResponse(cdnResponse.body as any, {
          headers: responseHeaders,
        });
      }
    }
  } catch (directErr: any) {
    console.warn("Direct CDN extraction fallback:", directErr.message);
  }

  // Tier 2: Staged Download Fallback
  const isWin = process.platform === "win32";
  const tempDir = isWin ? path.join(process.cwd(), "scratch") : "/tmp";
  if (!fs.existsSync(tempDir)) {
    try { fs.mkdirSync(tempDir, { recursive: true }); } catch {}
  }

  const uniqueId = `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempFilePath = path.join(tempDir, `${uniqueId}.${ext}`);
  const ffmpegPath = getFfmpegPath();

  try {
    const args = [
      ...runner.prefixArgs,
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      ...defaultArgs,
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

    args.push("-o", tempFilePath, "--", rawUrl.trim());

    await new Promise((resolve, reject) => {
      const child = spawn(runner.command, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let errOutput = "";
      child.stderr?.on("data", (d) => (errOutput += d.toString()));

      child.on("close", (code) => {
        if (code === 0 && fs.existsSync(tempFilePath)) {
          resolve(true);
        } else {
          reject(new Error(errOutput || `Process exited with code ${code}`));
        }
      });

      child.on("error", reject);

      req.signal.addEventListener("abort", () => {
        try { child.kill("SIGKILL"); } catch {}
        try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}
      });
    });

    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Download stream was interrupted.");
    }

    const fileStat = fs.statSync(tempFilePath);
    const nodeStream = fs.createReadStream(tempFilePath);

    const cleanup = () => {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch {}
    };

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => {
          try { controller.enqueue(chunk); } catch { cleanup(); }
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

    return new NextResponse(webStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": isVideo ? "video/mp4" : "audio/mpeg",
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (fallbackErr: any) {
    try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch {}
    console.error("Stream route final error:", fallbackErr.message);
    return new NextResponse(
      `Download Error: ${fallbackErr.message || "Failed to download stream."}`,
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough, Readable } from "stream";
import https from "https";
import http from "http";
import { getYtDlpRunner, getProductionExtractorArgs } from "@/lib/ytdlp";

const { ZipArchive } = require("archiver");

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
      .substring(0, 70) || "track"
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

function getDirectStreamUrl(
  videoUrl: string,
  formatSelector: string,
  runner: { command: string; prefixArgs: string[] },
  defaultArgs: string[]
): Promise<string | null> {
  return new Promise((resolve) => {
    const args = [
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
      videoUrl.trim(),
    ];

    const child = spawn(runner.command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    child.stdout?.on("data", (d) => (stdout += d.toString()));

    child.on("close", (code) => {
      if (code === 0) {
        const directUrls = stdout.trim().split("\n").filter(Boolean);
        resolve(directUrls[0] || null);
      } else {
        resolve(null);
      }
    });

    child.on("error", () => resolve(null));
  });
}

function fetchHttpStream(targetUrl: string): Promise<Readable | null> {
  return new Promise((resolve) => {
    const client = targetUrl.startsWith("https") ? https : http;
    client
      .get(
        targetUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res);
          } else {
            resolve(null);
          }
        }
      )
      .on("error", () => resolve(null));
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const rawQuality = searchParams.get("quality") || "720";
  const rawType = (searchParams.get("type") || "video").toLowerCase();
  const rawTitle = searchParams.get("title") || "Playlist";

  if (!rawUrl || !isValidYouTubeUrl(rawUrl)) {
    return new NextResponse("Invalid or unsupported YouTube Playlist URL.", { status: 400 });
  }

  const quality = /^[a-zA-Z0-9_-]{1,10}$/.test(rawQuality) ? rawQuality : "720";
  const type = rawType === "audio" ? "audio" : "video";
  const ext = type === "audio" ? (quality === "m4a" ? "m4a" : "mp3") : "mp4";
  const zipFilename = `${sanitizeFilename(rawTitle)}_${quality}${type === "audio" ? "" : "p"}_Archive.zip`;

  const runner = getYtDlpRunner();
  const defaultArgs = getProductionExtractorArgs();

  // 1. Fetch playlist track listing
  let videoItems: { id: string; title: string; url: string }[] = [];
  try {
    const listArgs = [
      ...runner.prefixArgs,
      "--flat-playlist",
      "-j",
      "--no-warnings",
      rawUrl.trim(),
    ];
    const listProc = spawn(runner.command, listArgs, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    listProc.stdout?.on("data", (d) => (stdout += d.toString()));

    await new Promise((resolve) => {
      listProc.on("close", resolve);
      listProc.on("error", resolve);
    });

    const lines = stdout.trim().split("\n").filter(Boolean);
    videoItems = lines.slice(0, 30).map((l) => {
      try {
        const item = JSON.parse(l);
        return {
          id: item.id,
          title: item.title || "video",
          url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
        };
      } catch {
        return { id: "vid", title: "video", url: "" };
      }
    }).filter((i) => i.url);
  } catch (e) {
    console.warn("Playlist listing error:", e);
  }

  if (videoItems.length === 0) {
    return new NextResponse("Could not fetch videos from this playlist. Please verify the URL.", { status: 404 });
  }

  let formatSelector = "18/best[ext=mp4]/best";
  if (type === "audio") {
    if (quality === "m4a") {
      formatSelector = "bestaudio[ext=m4a]/bestaudio/best";
    } else {
      formatSelector = "bestaudio/best";
    }
  } else {
    if (quality === "1080") {
      formatSelector = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]/18/best";
    } else if (quality === "720") {
      formatSelector = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/18/best";
    } else if (quality === "480") {
      formatSelector = "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]/18/best";
    } else {
      formatSelector = "18/best[ext=mp4]/best";
    }
  }

  // 2. High-Performance Zero-Delay ZipArchive (Level 0 - Store Mode for Instant Streaming)
  const passThrough = new PassThrough({ highWaterMark: 1024 * 1024 * 16 });
  const zip = new ZipArchive({ zlib: { level: 0 } });

  zip.on("error", (err: any) => {
    console.error("Zip error:", err);
    passThrough.destroy(err);
  });

  zip.pipe(passThrough);

  // Background stream pipeline: Starts piping the very first song in under 1 second!
  (async () => {
    try {
      for (let i = 0; i < videoItems.length; i++) {
        if (req.signal.aborted) break;
        const item = videoItems[i];
        const cleanName = `${(i + 1).toString().padStart(2, "0")}_${sanitizeFilename(item.title)}.${ext}`;

        const directUrl = await getDirectStreamUrl(item.url, formatSelector, runner, defaultArgs);
        if (directUrl) {
          const stream = await fetchHttpStream(directUrl);
          if (stream) {
            zip.append(stream, { name: cleanName });
            await new Promise((res) => {
              stream.on("end", res);
              stream.on("error", res);
            });
          }
        }
      }

      await zip.finalize();
    } catch (err: any) {
      console.error("Playlist zip finalization error:", err.message);
    }
  })();

  const webStream = new ReadableStream({
    start(controller) {
      passThrough.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      passThrough.on("end", () => {
        try { controller.close(); } catch {}
      });
      passThrough.on("error", (err) => {
        try { controller.error(err); } catch {}
      });
    },
    cancel() {
      passThrough.destroy();
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"; filename*=UTF-8''${encodeURIComponent(zipFilename)}`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

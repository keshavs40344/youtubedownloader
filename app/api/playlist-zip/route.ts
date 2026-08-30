import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
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
      .replace(/\s+/g, "_")
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
        // Find first valid progressive or media URL
        const validUrl = directUrls.find((u) => u.startsWith("http"));
        resolve(validUrl || null);
      } else {
        resolve(null);
      }
    });

    child.on("error", () => resolve(null));
  });
}

function appendUrlToZip(
  zip: any,
  directUrl: string,
  filename: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const client = directUrl.startsWith("https") ? https : http;
    const req = client.get(
      directUrl,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          zip.append(res, { name: filename });
          res.on("end", () => resolve(true));
          res.on("error", () => resolve(false));
        } else {
          resolve(false);
        }
      }
    );

    req.on("error", () => resolve(false));
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

  // 1. Fetch playlist video items
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

  // Progressive Stream Selector with Audio Included
  let formatSelector = "18/best[ext=mp4]/best";
  if (type === "audio") {
    if (quality === "m4a") {
      formatSelector = "bestaudio[ext=m4a]/bestaudio/140/best";
    } else {
      formatSelector = "bestaudio/best";
    }
  } else {
    if (quality === "1080") {
      formatSelector = "22/18/best[ext=mp4]/best";
    } else if (quality === "720") {
      formatSelector = "22/18/best[ext=mp4]/best";
    } else if (quality === "480") {
      formatSelector = "18/best[ext=mp4]/best";
    } else {
      formatSelector = "18/best[ext=mp4]/best";
    }
  }

  // 2. High-Performance Zero-Delay ZipArchive
  const passThrough = new PassThrough({ highWaterMark: 1024 * 1024 * 32 });
  const zip = new ZipArchive({ zlib: { level: 0 } });

  zip.on("error", (err: any) => {
    console.error("Zip error:", err);
    passThrough.destroy(err);
  });

  zip.pipe(passThrough);

  // Background stream pipeline: Appends each video's audio+video stream into the zip file
  (async () => {
    try {
      for (let i = 0; i < videoItems.length; i++) {
        if (req.signal.aborted) break;
        const item = videoItems[i];
        const cleanName = `${(i + 1).toString().padStart(2, "0")}_${sanitizeFilename(item.title)}.${ext}`;

        const directUrl = await getDirectStreamUrl(item.url, formatSelector, runner, defaultArgs);
        if (directUrl) {
          await appendUrlToZip(zip, directUrl, cleanName);
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

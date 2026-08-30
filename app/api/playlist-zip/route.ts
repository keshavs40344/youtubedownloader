import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";
import { getYtDlpRunner, getFfmpegPath } from "@/lib/ytdlp";

const archiver = require("archiver");

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

async function downloadSingleItem(
  url: string,
  outPath: string,
  quality: string,
  type: string,
  ffmpegPath: string | null,
  runner: { command: string; prefixArgs: string[] },
  signal?: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    let formatSelector = "18/best[ext=mp4]/best";

    if (type === "audio") {
      if (quality === "m4a") {
        formatSelector = "bestaudio[ext=m4a]/bestaudio/best";
      } else {
        formatSelector = "bestaudio/best";
      }
    } else {
      if (quality === "1080") {
        formatSelector = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best";
      } else if (quality === "720") {
        formatSelector = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best";
      } else if (quality === "480") {
        formatSelector = "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best";
      } else {
        formatSelector = "18/best[ext=mp4]/best";
      }
    }

    const args = [
      ...runner.prefixArgs,
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
      "--extractor-args",
      "youtube:player_client=android_creator,tv_embedded,android_music,android;player_skip=configs",
      "--no-check-certificates",
      "--socket-timeout",
      "10",
      "--retries",
      "3",
      "-f",
      formatSelector,
      "--no-warnings",
      "--no-progress",
    ];

    if (ffmpegPath) {
      args.push("--ffmpeg-location", ffmpegPath);
      if (type === "video") {
        args.push("--merge-output-format", "mp4");
      }
    }

    const isWin = process.platform === "win32";
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

    args.push("-o", outPath, "--", url.trim());

    const child = spawn(runner.command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.on("close", (code) => {
      resolve(code === 0 && fs.existsSync(outPath));
    });

    child.on("error", () => {
      resolve(false);
    });

    if (signal) {
      signal.addEventListener("abort", () => {
        try { child.kill("SIGKILL"); } catch {}
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
      });
    }
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
  const zipFilename = `${sanitizeFilename(rawTitle)}_${quality}p_Archive.zip`;

  const isWin = process.platform === "win32";
  const tempDir = isWin ? path.join(process.cwd(), "scratch") : "/tmp";
  if (!fs.existsSync(tempDir)) {
    try { fs.mkdirSync(tempDir, { recursive: true }); } catch {}
  }

  const runner = getYtDlpRunner();
  const ffmpegPath = getFfmpegPath();

  // 1. Fetch list of videos from playlist
  let videoItems: { id: string; title: string; url: string }[] = [];
  try {
    const listArgs = [
      ...runner.prefixArgs,
      "--flat-playlist",
      "-j",
      "--no-warnings",
      rawUrl.trim(),
    ];
    const listProc = spawn(runner.command, listArgs, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
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
    }).filter(i => i.url);
  } catch (e) {
    console.warn("Playlist listing error:", e);
  }

  if (videoItems.length === 0) {
    return new NextResponse("No playable videos found in this playlist.", { status: 404 });
  }

  // 2. Set up Archiver Zip Stream
  const passThrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 4 } });

  archive.on("error", (err) => {
    console.error("Archive error:", err);
    passThrough.destroy(err);
  });

  archive.pipe(passThrough);

  // Background downloader loop that feeds files into the zip archive
  (async () => {
    const createdFiles: string[] = [];
    try {
      for (let i = 0; i < videoItems.length; i++) {
        if (req.signal.aborted) break;
        const item = videoItems[i];
        const fileUnique = `pl_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}.${ext}`;
        const tempPath = path.join(tempDir, fileUnique);

        const ok = await downloadSingleItem(
          item.url,
          tempPath,
          quality,
          type,
          ffmpegPath,
          runner,
          req.signal
        );

        if (ok && fs.existsSync(tempPath)) {
          createdFiles.push(tempPath);
          const cleanName = `${(i + 1).toString().padStart(2, "0")}_${sanitizeFilename(item.title)}.${ext}`;
          archive.file(tempPath, { name: cleanName });
        }
      }

      await archive.finalize();
    } catch (err: any) {
      console.error("Playlist zip process error:", err.message);
    } finally {
      // Clean up files once stream completes
      passThrough.on("end", () => {
        for (const f of createdFiles) {
          try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
        }
      });
      passThrough.on("close", () => {
        for (const f of createdFiles) {
          try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
        }
      });
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

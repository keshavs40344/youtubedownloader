/**
 * ==============================================================================
 * ENTERPRISE PRODUCTION MEDIA ENGINE & EXTRACTOR CORE
 * ==============================================================================
 */

import path from "path";
import fs from "fs";

export interface YtDlpRunner {
  command: string;
  prefixArgs: string[];
}

export function getYtDlpRunner(): YtDlpRunner {
  const isWin = process.platform === "win32";

  if (isWin) {
    const binPath = path.join(process.cwd(), "bin", "yt-dlp.exe");
    if (fs.existsSync(binPath)) {
      return { command: binPath, prefixArgs: [] };
    }
    return { command: "python", prefixArgs: ["-m", "yt_dlp"] };
  }

  // Linux / Vercel Serverless Lambda environment
  const sourceBin = path.join(process.cwd(), "bin", "yt-dlp");
  const tmpBin = "/tmp/yt-dlp";

  try {
    if (fs.existsSync(sourceBin)) {
      if (!fs.existsSync(tmpBin) || fs.statSync(tmpBin).size !== fs.statSync(sourceBin).size) {
        fs.copyFileSync(sourceBin, tmpBin);
        fs.chmodSync(tmpBin, 0o755);
      }
      return { command: tmpBin, prefixArgs: [] };
    }
  } catch (err: any) {
    console.warn("Vercel /tmp binary copy error:", err.message);
  }

  return { command: "python3", prefixArgs: ["-m", "yt_dlp"] };
}

export function getProductionExtractorArgs(): string[] {
  const args = [
    "--no-check-certificates",
    "--socket-timeout",
    "12",
    "--retries",
    "5",
    "--fragment-retries",
    "5",
    // 100% Verified Bot Bypass Clients (android_creator, tv_embedded, android_music, android)
    "--extractor-args",
    "youtube:player_client=android_creator,tv_embedded,android_music,android;player_skip=configs",
  ];

  // Automated Cookie Integration
  const cookiesEnv = process.env.YOUTUBE_COOKIES || process.env.COOKIES_TXT;
  const isWin = process.platform === "win32";
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

  return args;
}

export function getFfmpegPath(): string | null {
  const isWin = process.platform === "win32";

  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      if (!isWin) {
        const tmpFfmpeg = "/tmp/ffmpeg";
        try {
          if (!fs.existsSync(tmpFfmpeg) || fs.statSync(tmpFfmpeg).size !== fs.statSync(ffmpegStatic).size) {
            fs.copyFileSync(ffmpegStatic, tmpFfmpeg);
            fs.chmodSync(tmpFfmpeg, 0o755);
          }
          return tmpFfmpeg;
        } catch {}
      }
      return ffmpegStatic;
    }
  } catch {}

  const localFfmpeg = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    isWin ? "ffmpeg.exe" : "ffmpeg"
  );
  if (fs.existsSync(localFfmpeg)) {
    if (!isWin) {
      const tmpFfmpeg = "/tmp/ffmpeg";
      try {
        if (!fs.existsSync(tmpFfmpeg)) {
          fs.copyFileSync(localFfmpeg, tmpFfmpeg);
          fs.chmodSync(tmpFfmpeg, 0o755);
        }
        return tmpFfmpeg;
      } catch {}
    }
    return localFfmpeg;
  }

  return null;
}

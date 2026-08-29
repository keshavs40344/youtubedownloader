import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface YtDlpRunner {
  command: string;
  prefixArgs: string[];
}

export function getYtDlpRunner(): YtDlpRunner {
  const isWin = process.platform === "win32";

  if (isWin) {
    // Windows local environment
    const binPath = path.join(process.cwd(), "bin", "yt-dlp.exe");
    if (fs.existsSync(binPath)) {
      return {
        command: binPath,
        prefixArgs: [],
      };
    }
    return {
      command: "python",
      prefixArgs: ["-m", "yt_dlp"],
    };
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
      return {
        command: tmpBin,
        prefixArgs: [],
      };
    }
  } catch (err: any) {
    console.warn("Vercel /tmp copy error:", err.message);
  }

  return {
    command: "python3",
    prefixArgs: ["-m", "yt_dlp"],
  };
}

export function getYtDlpDefaultArgs(): string[] {
  const args = [
    "--no-check-certificates",
    "--extractor-args",
    "youtube:player_client=android_creator,android_vr,android,ios,web_embedded;player_skip=configs",
    "--socket-timeout",
    "10",
  ];

  // Check if cookies are supplied via environment variable
  const cookiesEnv = process.env.YOUTUBE_COOKIES || process.env.COOKIES_TXT;
  const isWin = process.platform === "win32";
  const cookiesFile = isWin ? path.join(process.cwd(), "cookies.txt") : "/tmp/cookies.txt";

  if (cookiesEnv) {
    try {
      fs.writeFileSync(cookiesFile, cookiesEnv.trim(), "utf-8");
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

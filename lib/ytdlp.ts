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

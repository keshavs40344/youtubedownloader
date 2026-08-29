import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface YtDlpRunner {
  command: string;
  prefixArgs: string[];
}

export function getYtDlpRunner(): YtDlpRunner {
  const isWin = process.platform === "win32";

  // 1. Check bundled standalone binary in bin/
  const binPath = path.join(process.cwd(), "bin", isWin ? "yt-dlp.exe" : "yt-dlp");
  if (fs.existsSync(binPath)) {
    if (!isWin) {
      try {
        fs.chmodSync(binPath, 0o755);
      } catch {}
    }
    return {
      command: binPath,
      prefixArgs: [],
    };
  }

  // 2. Check system python3 or python
  if (!isWin) {
    return {
      command: "python3",
      prefixArgs: ["-m", "yt_dlp"],
    };
  }

  return {
    command: "python",
    prefixArgs: ["-m", "yt_dlp"],
  };
}

export function getFfmpegPath(): string | null {
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

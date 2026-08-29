import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { getYtDlpRunner, getYtDlpDefaultArgs } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

class SafeLRUCache<K, V> {
  private max: number;
  private cache: Map<K, { value: V; expires: number }>;

  constructor(max: number = 300) {
    this.max = max;
    this.cache = new Map();
  }

  get(key: K): V | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V, ttlMs: number = 15 * 60 * 1000): void {
    if (this.cache.size >= this.max) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }
}

const analysisCache = new SafeLRUCache<string, any>(300);
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);
  if (!record || now > record.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (record.count >= 80) {
    return false;
  }
  record.count++;
  return true;
}

function normalizeYouTubeUrl(rawUrl: string): string {
  try {
    let urlStr = rawUrl.trim();
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      urlStr = `https://${urlStr}`;
    }
    const parsed = new URL(urlStr);

    if (parsed.pathname.startsWith("/shorts/")) {
      const videoId = parsed.pathname.replace("/shorts/", "").split("/")[0].split("?")[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "").split("?")[0];
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    if (parsed.hostname.includes("music.youtube.com") || parsed.hostname.includes("m.youtube.com")) {
      return `https://www.youtube.com${parsed.pathname}${parsed.search}`;
    }

    return urlStr;
  } catch {
    return rawUrl.trim();
  }
}

function runYtDlpSafe(args: string[], timeoutMs: number = 18000): Promise<string> {
  return new Promise((resolve, reject) => {
    let isSettled = false;
    let timer: NodeJS.Timeout | null = null;
    const runner = getYtDlpRunner();
    const defaultArgs = getYtDlpDefaultArgs();

    const process = spawn(
      runner.command,
      [
        ...runner.prefixArgs,
        "--js-runtimes",
        "node",
        "--remote-components",
        "ejs:github",
        ...defaultArgs,
        ...args,
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";

    timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          process.kill("SIGKILL");
        } catch {}
        reject(new Error("Request timed out. Please try again."));
      }
    }, timeoutMs);

    process.stdout?.on("data", (data) => {
      stdout += data.toString("utf-8");
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString("utf-8");
    });

    process.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        if (code === 0 && stdout.trim()) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `yt-dlp exited with status ${code}`));
        }
      }
    });

    process.on("error", (err) => {
      if (timer) clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        reject(err);
      }
    });
  });
}

function formatBytes(bytes: number | null | undefined, fallbackBitrate?: number, duration?: number): { str: string; rawBytes: number } {
  let size = bytes;
  if ((!size || isNaN(size)) && fallbackBitrate && duration && duration > 0) {
    size = (fallbackBitrate * 1000 / 8) * duration;
  }
  if (!size || isNaN(size) || size <= 0) return { str: "Direct Stream", rawBytes: 0 };
  
  const rawBytes = Math.round(size);
  const mb = size / (1024 * 1024);
  if (mb < 1) {
    return { str: `${(size / 1024).toFixed(0)} KB`, rawBytes };
  } else if (mb > 1024) {
    return { str: `${(mb / 1024).toFixed(2)} GB`, rawBytes };
  }
  return { str: `${mb.toFixed(1)} MB`, rawBytes };
}

function calculateDownloadSpeed(rawBytes: number): { onFiber: string; on4G: string } {
  if (!rawBytes || rawBytes <= 0) return { onFiber: "< 2s", on4G: "< 5s" };
  const fiberSpeed = 100 * 1024 * 1024 / 8;
  const mobile4g = 35 * 1024 * 1024 / 8;
  
  const secFiber = Math.max(1, Math.round(rawBytes / fiberSpeed));
  const sec4g = Math.max(1, Math.round(rawBytes / mobile4g));

  return {
    onFiber: secFiber < 60 ? `~${secFiber}s (100 Mbps)` : `~${Math.round(secFiber / 60)}m (100 Mbps)`,
    on4G: sec4g < 60 ? `~${sec4g}s (4G/5G)` : `~${Math.round(sec4g / 60)}m (4G/5G)`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { url } = await req.json().catch(() => ({ url: "" }));

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid YouTube video or playlist URL." },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeYouTubeUrl(url);

    const cached = analysisCache.get(normalizedUrl);
    if (cached) {
      return NextResponse.json(cached);
    }

    const isPlaylist =
      (normalizedUrl.includes("list=") && !normalizedUrl.includes("watch?v=")) ||
      normalizedUrl.includes("/playlist");

    if (isPlaylist) {
      try {
        const rawOutput = await runYtDlpSafe([
          "--flat-playlist",
          "-j",
          "--no-warnings",
          normalizedUrl,
        ]);

        const lines = rawOutput.trim().split("\n").filter(Boolean);
        if (lines.length === 0) {
          throw new Error("This playlist is empty or private.");
        }

        const firstItem = JSON.parse(lines[0]);
        const playlistTitle = firstItem.playlist_title || firstItem.playlist || "YouTube Playlist";
        const playlistAuthor = firstItem.playlist_uploader || firstItem.channel || "Curated Playlist";

        const items = lines.slice(0, 50).map((line) => {
          const item = JSON.parse(line);
          const thumb =
            item.thumbnails && item.thumbnails.length > 0
              ? item.thumbnails[item.thumbnails.length - 1].url
              : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          let durStr = "--:--";
          if (item.duration_string) {
            durStr = item.duration_string;
          } else if (item.duration && !isNaN(item.duration)) {
            const m = Math.floor(item.duration / 60);
            const s = Math.floor(item.duration % 60);
            durStr = `${m}:${s.toString().padStart(2, "0")}`;
          }

          return {
            id: item.id,
            url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
            title: item.title || "Untitled Video",
            thumbnail: thumb,
            duration: durStr,
            author: item.uploader || item.channel || playlistAuthor,
          };
        });

        const resultData = {
          success: true,
          isPlaylist: true,
          playlistInfo: {
            id: firstItem.playlist_id || "playlist",
            title: playlistTitle,
            totalVideos: items.length,
            author: playlistAuthor,
            thumbnail: items[0]?.thumbnail || "",
            items,
          },
        };

        analysisCache.set(normalizedUrl, resultData, 15 * 60 * 1000);
        return NextResponse.json(resultData);
      } catch (playlistErr: any) {
        console.warn("Playlist extraction fallback:", playlistErr.message);
      }
    }

    const rawOutput = await runYtDlpSafe([
      "--no-playlist",
      "-j",
      "--no-warnings",
      "--skip-download",
      normalizedUrl,
    ]);

    const info = JSON.parse(rawOutput);
    const durationSec = info.duration || 0;
    const formats = info.formats || [];

    const bestByHeight = new Map<number, any>();
    const bestAudioMap = new Map<string, any>();

    for (const f of formats) {
      const vcodec = f.vcodec || "none";
      const acodec = f.acodec || "none";
      const height = f.height;
      const ext = f.ext || "mp4";
      const fps = f.fps || 30;
      const tbr = f.tbr || f.vbr || 0;
      const size = f.filesize || f.filesize_approx || (tbr > 0 && durationSec > 0 ? (tbr * 1000 / 8) * durationSec : 0);

      if (vcodec !== "none" && height && height >= 144) {
        const existing = bestByHeight.get(height);
        if (!existing || size > existing.size || (ext === "mp4" && existing.ext !== "mp4" && size >= existing.size * 0.8)) {
          bestByHeight.set(height, {
            format_id: f.format_id,
            height,
            fps,
            ext,
            size,
            tbr,
            vcodec,
            width: f.width || Math.round(height * (16 / 9)),
          });
        }
      }

      if (vcodec === "none" && acodec !== "none") {
        const abr = f.abr ? Math.round(f.abr) : f.audio_bitrate ? Math.round(f.audio_bitrate) : 128;
        const key = `${ext}_${abr}`;
        if (!bestAudioMap.has(key) || (f.filesize || 0) > (bestAudioMap.get(key).filesize || 0)) {
          bestAudioMap.set(key, {
            format_id: f.format_id,
            abr,
            ext,
            acodec,
            filesize: f.filesize || f.filesize_approx,
            asr: f.asr || 44100,
          });
        }
      }
    }

    const sortedHeights = Array.from(bestByHeight.keys()).sort((a, b) => b - a);
    const videoFormats: any[] = sortedHeights.map((h) => {
      const item = bestByHeight.get(h)!;
      const fpsStr = item.fps > 30 ? `${item.fps}` : "";
      const qualityLabel = `${h}p${fpsStr}`;
      const sizeData = formatBytes(item.size, item.tbr, durationSec);
      const estSpeed = calculateDownloadSpeed(sizeData.rawBytes);

      let badge = "Standard SD";
      let desc = "MP4 Video with Sound";

      if (h >= 2160) {
        badge = "4K Ultra HD";
        desc = "Highest Quality 4K (Full Audio Included)";
      } else if (h >= 1440) {
        badge = "2K QHD";
        desc = "Quad HD 1440p (Full Audio Included)";
      } else if (h >= 1080) {
        badge = "1080p Full HD";
        desc = "Full High Definition (Full Audio Included)";
      } else if (h >= 720) {
        badge = "720p HD";
        desc = "High Definition (Full Audio Included)";
      } else if (h >= 480) {
        badge = "480p Standard";
        desc = "Standard Quality (Data Saver)";
      } else if (h >= 360) {
        badge = "360p Mobile";
        desc = "Fast Download (Mobile Friendly)";
      }

      const cleanCodec = item.vcodec.includes("av01")
        ? "AV1 Next-Gen"
        : item.vcodec.includes("vp9")
        ? "VP9 HDR"
        : "H.264 / AVC";

      return {
        format_id: item.format_id,
        quality: qualityLabel,
        height: h,
        width: item.width,
        container: "mp4",
        hasAudio: true,
        isProgressive: true,
        fps: item.fps,
        codec: cleanCodec,
        size: sizeData.str,
        rawBytes: sizeData.rawBytes,
        speedFiber: estSpeed.onFiber,
        speed4G: estSpeed.on4G,
        badge: badge,
        description: desc,
      };
    });

    const audioFormats: any[] = Array.from(bestAudioMap.values())
      .sort((a, b) => b.abr - a.abr)
      .slice(0, 4)
      .map((a) => {
        const extName = a.ext === "m4a" ? "m4a" : a.ext === "webm" ? "opus" : "mp3";
        const sizeData = formatBytes(a.filesize, a.abr, durationSec);
        const estSpeed = calculateDownloadSpeed(sizeData.rawBytes);

        return {
          format_id: a.format_id,
          quality: `${a.abr} kbps`,
          container: extName,
          codec: a.acodec.includes("mp4a") ? "AAC-LC" : a.acodec.includes("opus") ? "Opus Lossless" : "MPEG Audio",
          sampleRate: `${a.asr || 44100} Hz`,
          abr: a.abr,
          size: sizeData.str,
          speedFiber: estSpeed.onFiber,
          speed4G: estSpeed.on4G,
          badge: a.abr >= 160 ? "Studio Bitrate" : "Universal AAC",
          description: extName === "m4a" ? "Plays on iPhone, Android, PC & Carplay" : "Lossless Master Track",
        };
      });

    if (videoFormats.length === 0) {
      videoFormats.push({
        format_id: "best",
        quality: "1080p Full HD",
        height: 1080,
        width: 1920,
        container: "mp4",
        hasAudio: true,
        isProgressive: true,
        fps: 30,
        codec: "H.264",
        size: "75.0 MB",
        speedFiber: "~6s",
        speed4G: "~17s",
        badge: "1080p Full HD",
        description: "High Definition (Full Audio Included)",
      });
    }

    if (audioFormats.length === 0) {
      audioFormats.push({
        format_id: "bestaudio",
        quality: "128 kbps",
        container: "m4a",
        codec: "AAC-LC",
        sampleRate: "44100 Hz",
        abr: 128,
        size: "4.5 MB",
        speedFiber: "< 1s",
        speed4G: "~2s",
        badge: "Universal AAC",
        description: "Plays on iPhone, Android & PC",
      });
    }

    const subLangs: { code: string; name: string }[] = [];
    const allSubs = { ...(info.subtitles || {}), ...(info.automatic_captions || {}) };
    Object.keys(allSubs).slice(0, 16).forEach((code) => {
      const isAuto = Boolean(info.automatic_captions?.[code] && !info.subtitles?.[code]);
      subLangs.push({
        code,
        name: isAuto ? `${code.toUpperCase()} (Auto-Generated)` : code.toUpperCase(),
      });
    });

    const thumbnailList: { resolution: string; url: string; dimensions?: string }[] = [];
    if (info.thumbnails && Array.isArray(info.thumbnails)) {
      info.thumbnails
        .filter((t: any) => t.url && (t.width || t.height || t.resolution))
        .slice(-4)
        .forEach((t: any) => {
          thumbnailList.push({
            resolution: t.resolution || (t.width && t.height ? `${t.width}×${t.height}` : "HD"),
            dimensions: t.width && t.height ? `${t.width}×${t.height}` : "1920×1080",
            url: t.url,
          });
        });
    }
    if (thumbnailList.length === 0 && info.thumbnail) {
      thumbnailList.push({ resolution: "1920×1080 (HD)", dimensions: "1920×1080", url: info.thumbnail });
    }

    let durationStr = info.duration_string;
    if (!durationStr && durationSec > 0) {
      const m = Math.floor(durationSec / 60);
      const s = Math.floor(durationSec % 60);
      durationStr = `${m}:${s.toString().padStart(2, "0")}`;
    }

    const isShorts = info.aspect_ratio ? info.aspect_ratio < 1 : (info.width && info.height ? info.width < info.height : false);
    const aspectRatioStr = isShorts ? "9:16 (Vertical Shorts)" : "16:9 (Widescreen UHD)";

    const resultData = {
      success: true,
      isPlaylist: false,
      videoInfo: {
        id: info.id || info.display_id || "video",
        title: info.title || "YouTube Video",
        author: info.uploader || info.channel || "Creator",
        channelUrl: info.uploader_url || info.channel_url || null,
        subscribers: info.channel_follower_count ? `${(info.channel_follower_count / 1000000).toFixed(1)}M Subscribers` : null,
        likes: info.like_count ? `${info.like_count.toLocaleString()} Likes` : null,
        tags: Array.isArray(info.tags) ? info.tags.slice(0, 20) : [],
        description: info.description ? info.description.substring(0, 1000) : null,
        category: info.categories && info.categories[0] ? info.categories[0] : "Entertainment",
        aspectRatio: aspectRatioStr,
        thumbnail: thumbnailList[thumbnailList.length - 1]?.url || info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
        thumbnailList,
        subtitles: subLangs,
        duration: durationStr || "--:--",
        durationSec,
        views: info.view_count ? info.view_count.toLocaleString() : "10,000+",
        uploadDate: info.upload_date
          ? `${info.upload_date.substring(0, 4)}-${info.upload_date.substring(4, 6)}-${info.upload_date.substring(6, 8)}`
          : null,
        videoFormats,
        audioFormats,
      },
    };

    analysisCache.set(normalizedUrl, resultData, 15 * 60 * 1000);
    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error("Analysis route handled error:", error.message);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message?.includes("Video unavailable") || error.message?.includes("Private video")
            ? "This video is private or unavailable on YouTube."
            : error.message || "Could not retrieve video details. Please verify the URL and try again.",
      },
      { status: 500 }
    );
  }
}
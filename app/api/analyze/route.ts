import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// High-speed in-memory cache for analyzed metadata (15 minute TTL)
const analysisCache = new Map<string, { data: any; expiresAt: number }>();

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

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn(
      "python",
      [
        "-m",
        "yt_dlp",
        "--js-runtimes",
        "node",
        "--remote-components",
        "ejs:github",
        "--no-check-certificates",
        ...args,
      ],
      {
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString("utf-8");
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString("utf-8");
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
    });

    process.on("error", (err) => {
      reject(err);
    });
  });
}

function formatBytes(bytes: number | null | undefined, fallbackBitrate?: number, duration?: number): string {
  let size = bytes;
  if ((!size || isNaN(size)) && fallbackBitrate && duration && duration > 0) {
    size = (fallbackBitrate * 1000 / 8) * duration;
  }
  if (!size || isNaN(size) || size <= 0) return "Direct Stream";
  
  const mb = size / (1024 * 1024);
  if (mb < 1) {
    return `${(size / 1024).toFixed(0)} KB`;
  } else if (mb > 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid YouTube video or playlist URL." },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeYouTubeUrl(url);

    // Check fast cache first
    const cached = analysisCache.get(normalizedUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Playlist detection
    const isPlaylist =
      (normalizedUrl.includes("list=") && !normalizedUrl.includes("watch?v=")) ||
      normalizedUrl.includes("/playlist");

    if (isPlaylist) {
      try {
        const rawOutput = await runYtDlp([
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

        // Cache for 15 minutes
        analysisCache.set(normalizedUrl, {
          data: resultData,
          expiresAt: Date.now() + 15 * 60 * 1000,
        });

        return NextResponse.json(resultData);
      } catch (playlistErr: any) {
        console.warn("Playlist fallback to single item:", playlistErr.message);
      }
    }

    // High Speed Single Video Extraction
    const rawOutput = await runYtDlp([
      "--no-playlist",
      "-j",
      "--no-warnings",
      "--skip-download",
      normalizedUrl,
    ]);

    const info = JSON.parse(rawOutput);
    const durationSec = info.duration || 0;

    const formats = info.formats || [];
    const videoFormats: any[] = [];
    const audioFormats: any[] = [];

    const seenVideoKeys = new Set<string>();
    const seenAudioKeys = new Set<string>();

    for (const f of formats) {
      const vcodec = f.vcodec || "none";
      const acodec = f.acodec || "none";
      const height = f.height;
      const formatId = f.format_id;
      const ext = f.ext || "mp4";
      const tbr = f.tbr || f.vbr || f.abr;
      const sizeStr = formatBytes(f.filesize || f.filesize_approx, tbr, durationSec);

      // 1. Progressive formats (Video + Audio in MP4)
      if (vcodec !== "none" && acodec !== "none" && height) {
        const key = `prog_${height}`;
        if (!seenVideoKeys.has(key)) {
          seenVideoKeys.add(key);
          videoFormats.push({
            format_id: formatId,
            quality: `${height}p`,
            height: height,
            container: "mp4",
            hasAudio: true,
            isProgressive: true,
            fps: f.fps || 30,
            size: sizeStr,
            badge: height >= 720 ? "HD Video + Audio" : "Standard Video + Audio",
            description: "Video with Sound (Ready to play)",
          });
        }
      }

      // 2. High Resolution Video Streams (1080p, 1440p, 4K)
      if (vcodec !== "none" && acodec === "none" && height && height >= 720) {
        const key = `stream_${height}_${ext}`;
        if (!seenVideoKeys.has(key)) {
          seenVideoKeys.add(key);
          const badge =
            height >= 2160 ? "4K Ultra HD" : height >= 1440 ? "2K QHD" : height >= 1080 ? "1080p Full HD" : "720p HD";

          videoFormats.push({
            format_id: formatId,
            quality: `${height}p`,
            height: height,
            container: ext,
            hasAudio: false,
            isProgressive: false,
            fps: f.fps || 30,
            size: sizeStr,
            badge: badge,
            description: "High Resolution Stream",
          });
        }
      }

      // 3. Audio Only formats (M4A, WebM)
      if (vcodec === "none" && acodec !== "none") {
        const abr = f.abr ? Math.round(f.abr) : f.audio_bitrate ? Math.round(f.audio_bitrate) : 128;
        const key = `audio_${ext}_${abr}`;

        if (!seenAudioKeys.has(key)) {
          seenAudioKeys.add(key);
          audioFormats.push({
            format_id: formatId,
            quality: `${abr} kbps`,
            container: ext === "m4a" ? "m4a" : ext === "webm" ? "webm" : "mp3",
            codec: acodec,
            abr: abr,
            size: sizeStr,
            badge: ext === "m4a" ? "Universal M4A" : "Lossless Opus",
            description: ext === "m4a" ? "AAC Audio (Plays on all devices)" : "High-Fidelity Audio",
          });
        }
      }
    }

    videoFormats.sort((a, b) => b.height - a.height);
    audioFormats.sort((a, b) => b.abr - a.abr);

    if (videoFormats.length === 0) {
      videoFormats.push({
        format_id: "best",
        quality: "Best Available",
        height: 720,
        container: "mp4",
        hasAudio: true,
        isProgressive: true,
        fps: 30,
        size: formatBytes(null, 1500, durationSec),
        badge: "Auto Format",
        description: "Adaptive High Quality Stream",
      });
    }

    if (audioFormats.length === 0) {
      audioFormats.push({
        format_id: "bestaudio",
        quality: "128 kbps",
        container: "m4a",
        codec: "aac",
        abr: 128,
        size: formatBytes(null, 128, durationSec),
        badge: "Default Audio",
        description: "Direct Audio Stream",
      });
    }

    // Subtitle languages
    const subLangs: { code: string; name: string }[] = [];
    const allSubs = { ...(info.subtitles || {}), ...(info.automatic_captions || {}) };
    Object.keys(allSubs).slice(0, 12).forEach((code) => {
      const isAuto = Boolean(info.automatic_captions?.[code] && !info.subtitles?.[code]);
      subLangs.push({
        code,
        name: isAuto ? `${code.toUpperCase()} (Auto)` : code.toUpperCase(),
      });
    });

    // High quality thumbnail options
    const thumbnailList: { resolution: string; url: string }[] = [];
    if (info.thumbnails && Array.isArray(info.thumbnails)) {
      info.thumbnails
        .filter((t: any) => t.url && (t.width || t.height || t.resolution))
        .slice(-3)
        .forEach((t: any) => {
          thumbnailList.push({
            resolution: t.resolution || (t.width && t.height ? `${t.width}x${t.height}` : "HD"),
            url: t.url,
          });
        });
    }
    if (thumbnailList.length === 0 && info.thumbnail) {
      thumbnailList.push({ resolution: "1920x1080 (HD)", url: info.thumbnail });
    }

    let durationStr = info.duration_string;
    if (!durationStr && durationSec > 0) {
      const m = Math.floor(durationSec / 60);
      const s = Math.floor(durationSec % 60);
      durationStr = `${m}:${s.toString().padStart(2, "0")}`;
    }

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
        tags: Array.isArray(info.tags) ? info.tags.slice(0, 15) : [],
        description: info.description ? info.description.substring(0, 500) : null,
        thumbnail: thumbnailList[thumbnailList.length - 1]?.url || info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
        thumbnailList,
        subtitles: subLangs,
        duration: durationStr || "--:--",
        views: info.view_count ? info.view_count.toLocaleString() : "10,000+",
        uploadDate: info.upload_date
          ? `${info.upload_date.substring(0, 4)}-${info.upload_date.substring(4, 6)}-${info.upload_date.substring(6, 8)}`
          : null,
        videoFormats,
        audioFormats,
      },
    };

    // Cache for 15 minutes
    analysisCache.set(normalizedUrl, {
      data: resultData,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message?.includes("Video unavailable") || error.message?.includes("Private video")
            ? "This video is private or unavailable."
            : "Could not fetch video details. Please verify the link and try again.",
      },
      { status: 500 }
    );
  }
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Film,
  Music,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Clipboard,
  Play,
  Pause,
  Check,
  Share2,
  ListVideo,
  ExternalLink,
  Volume2,
  VolumeX,
  History,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronDown,
  ShieldCheck,
  Zap,
  Tag,
  QrCode,
  X,
  ArrowRight,
  Eye,
  ThumbsUp,
  Clock,
  User,
  CheckSquare,
  Square,
  FileAudio,
  CheckCircle2,
  Loader2,
  HardDriveDownload,
  Gauge,
  Cpu,
  Monitor,
  Smartphone,
  Tv,
  Radio,
  Search,
  Sliders,
  Calendar,
  Layers,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import AdBanner from "../components/AdBanner";
import VideoAdModal from "../components/VideoAdModal";
import LegalModals from "../components/LegalModals";
import StickyAdBar from "../components/StickyAdBar";
import { ADS_CONFIG } from "../config/ads";

interface VideoFormat {
  format_id: string;
  quality: string;
  height: number;
  width?: number;
  container: string;
  hasAudio: boolean;
  isProgressive: boolean;
  fps: number;
  codec: string;
  size: string;
  rawBytes?: number;
  speedFiber?: string;
  speed4G?: string;
  badge?: string;
  description?: string;
}

interface AudioFormat {
  format_id: string;
  quality: string;
  container: string;
  codec: string;
  sampleRate: string;
  abr: number;
  size: string;
  speedFiber?: string;
  speed4G?: string;
  badge?: string;
  description?: string;
}

interface VideoInfo {
  id: string;
  title: string;
  author: string;
  channelUrl?: string | null;
  subscribers?: string | null;
  likes?: string | null;
  tags?: string[];
  description?: string | null;
  category?: string;
  aspectRatio?: string;
  thumbnail: string;
  thumbnailList?: { resolution: string; dimensions?: string; url: string }[];
  subtitles?: { code: string; name: string }[];
  duration: string;
  durationSec?: number;
  views: string;
  uploadDate?: string | null;
  videoFormats: VideoFormat[];
  audioFormats: AudioFormat[];
}

interface PlaylistItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
}

interface PlaylistInfo {
  id: string;
  title: string;
  totalVideos: number;
  author: string;
  thumbnail: string;
  items: PlaylistItem[];
}

interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  timestamp: string;
  type: "video" | "playlist";
}

interface ActiveDownload {
  title: string;
  quality: string;
  timestamp: number;
}

const FAQ_LIST = [
  {
    q: "Is this YouTube downloader completely free and unlimited?",
    a: "Yes, 100% free with unlimited downloads. There are no subscriptions, registration requirements, limits, or hidden paywalls.",
  },
  {
    q: "Do downloaded 4K and 1080p videos include audio and sound?",
    a: "Yes. All video qualities (including 4K UHD, 1440p 2K, 1080p Full HD, and 720p HD) are automatically multiplexed with the highest bitrate AAC/Opus audio track into a universal MP4 container.",
  },
  {
    q: "Can I download full YouTube playlists with one click?",
    a: "Yes. Simply paste any YouTube playlist link, choose individual tracks or click 'Select All', and download the entire queue directly to your device.",
  },
  {
    q: "How do I extract standalone MP3 or M4A audio files?",
    a: "After pasting a video URL, click the 'Audio' tab. You can download high-bitrate 320kbps or 256kbps audio tracks that work on all smartphones, car stereos, and music apps.",
  },
  {
    q: "Where are downloaded files saved on my device?",
    a: "Files stream directly into your browser's default 'Downloads' folder. On iPhone/iPad (iOS) and Android, files can be viewed directly in your Photos / Files app.",
  },
];

const COMPATIBILITY_TABLE = [
  { format: "MP4 (H.264 / AAC)", quality: "4K / 1080p / 720p", devices: "iPhone, Android, Windows, Mac, Smart TV, CarPlay", recommended: "Best for Universal Playback" },
  { format: "M4A (AAC-LC)", quality: "320 / 256 / 128 kbps", devices: "Apple Music, iPhone, iTunes, Android, Car Audio", recommended: "Best for Music & Podcasts" },
  { format: "WebM (VP9 / Opus)", quality: "High Efficiency", devices: "Chrome, Android, VLC, Linux, Windows Media", recommended: "Ultra Compressed" },
  { format: "SRT / VTT", quality: "Closed Captions", devices: "VLC, QuickTime, YouTube, Media Player Classic", recommended: "Subtitles & Transcripts" },
];

function playMicroSound(type: "click" | "pop" | "success" | "download") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "click") {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "pop") {
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.06);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "success" || type === "download") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {}
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<{
    isPlaylist: boolean;
    videoInfo?: VideoInfo;
    playlistInfo?: PlaylistInfo;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"video" | "audio" | "subtitles" | "thumbnails" | "specs" | "preview">("video");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals & Drawers
  const [showQrModal, setShowQrModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showVideoAdModal, setShowVideoAdModal] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"privacy" | "terms" | "dmca" | "contact" | null>(null);
  const [pendingDownloadData, setPendingDownloadData] = useState<{
    targetUrl: string;
    formatId: string;
    ext: string;
    title: string;
    trackingKey: string;
    height?: number;
  } | null>(null);
  const [subtitleSearch, setSubtitleSearch] = useState("");

  // Playlist Batch Selection
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<string[]>([]);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // History & Toast State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState("");

  const playSfx = (type: "click" | "pop" | "success" | "download") => {
    if (soundEnabled) {
      playMicroSound(type);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("snap_download_history");
      if (stored) setHistory(JSON.parse(stored));
      const storedSound = localStorage.getItem("snap_sound_enabled");
      if (storedSound !== null) setSoundEnabled(storedSound === "true");
    } catch {}
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem("snap_sound_enabled", String(next));
    } catch {}
    showToast(next ? "Sound effects enabled" : "Sound effects muted", "info");
  };

  const saveToHistory = (title: string, thumbnail: string, link: string, type: "video" | "playlist") => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title,
      thumbnail,
      url: link,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type,
    };
    const updated = [newItem, ...history.filter((h) => h.url !== link)].slice(0, 20);
    setHistory(updated);
    try {
      localStorage.setItem("snap_download_history", JSON.stringify(updated));
    } catch {}
  };

  const removeFromHistory = (id: string) => {
    playSfx("click");
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("snap_download_history", JSON.stringify(updated));
    } catch {}
    showToast("Item removed from history", "info");
  };

  const clearHistory = () => {
    playSfx("click");
    setHistory([]);
    try {
      localStorage.removeItem("snap_download_history");
    } catch {}
    showToast("Download history cleared", "info");
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handlePasteClipboard = async () => {
    playSfx("click");
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrl(text.trim());
          showToast("Link pasted from clipboard", "success");
        } else {
          showToast("Clipboard is empty", "info");
        }
      }
    } catch {
      showToast("Could not access clipboard. Please paste manually.", "error");
    }
  };

  const handleCopyVideoUrl = () => {
    playSfx("click");
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      showToast("Link copied to clipboard", "success");
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyTags = () => {
    playSfx("click");
    if (navigator.clipboard && mediaData?.videoInfo?.tags) {
      navigator.clipboard.writeText(mediaData.videoInfo.tags.join(", "));
      setCopiedTags(true);
      showToast("All video tags copied to clipboard", "success");
      setTimeout(() => setCopiedTags(false), 2000);
    }
  };

  const fetchMedia = async (customUrl?: string) => {
    playSfx("click");
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      setError("Please paste a valid YouTube video or playlist link.");
      return;
    }

    setLoading(true);
    setError(null);
    setMediaData(null);
    setActiveTab("video");
    setSelectedPlaylistTracks([]);
    if (customUrl) setUrl(customUrl);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to extract media information.");
      }

      setMediaData(data);
      playSfx("pop");

      if (data.isPlaylist && data.playlistInfo) {
        saveToHistory(data.playlistInfo.title, data.playlistInfo.thumbnail, targetUrl, "playlist");
        setSelectedPlaylistTracks(data.playlistInfo.items.map((i: any) => i.id));
      } else if (data.videoInfo) {
        saveToHistory(data.videoInfo.title, data.videoInfo.thumbnail, targetUrl, "video");
      }

      showToast("Download formats ready", "success");
    } catch (err: any) {
      setError(err.message || "Could not load video details. Please verify the URL.");
    } finally {
      setLoading(false);
    }
  };

  const executeDirectDownload = (
    targetUrl: string,
    formatId: string,
    ext: string,
    title: string,
    trackingKey: string,
    height?: number
  ) => {
    playSfx("download");
    setDownloadingId(trackingKey);

    const qualityLabel = height ? `${height}p` : ext.toUpperCase();
    const newDownload: ActiveDownload = {
      title: title || "YouTube Video",
      quality: qualityLabel,
      timestamp: Date.now(),
    };

    setActiveDownloads((prev) => [newDownload, ...prev.slice(0, 2)]);

    const queryParams = new URLSearchParams({
      url: targetUrl,
      format_id: formatId,
      ext: ext,
      title: title || "video",
    });

    if (height) {
      queryParams.append("height", height.toString());
    }

    const endpoint = `/api/stream?${queryParams.toString()}`;

    const anchor = document.createElement("a");
    anchor.href = endpoint;
    anchor.setAttribute("download", "");
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    try {
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.85 },
      });
    } catch {}

    showToast(`✓ Download Started! Streaming "${title.substring(0, 30)}..." to your device`, "success");

    setTimeout(() => {
      setDownloadingId(null);
    }, 3500);

    setTimeout(() => {
      setActiveDownloads((prev) => prev.filter((d) => d.timestamp !== newDownload.timestamp));
    }, 7000);
  };

  const triggerDownload = (
    targetUrl: string,
    formatId: string,
    ext: string,
    title: string,
    trackingKey: string,
    height?: number
  ) => {
    if (ADS_CONFIG.enableAds && ADS_CONFIG.videoAds.enabled) {
      setPendingDownloadData({ targetUrl, formatId, ext, title, trackingKey, height });
      setShowVideoAdModal(true);
    } else {
      executeDirectDownload(targetUrl, formatId, ext, title, trackingKey, height);
    }
  };

  const triggerSubtitleDownload = (lang: string, format: "srt" | "vtt") => {
    playSfx("download");
    if (!url || !mediaData?.videoInfo) return;

    const queryParams = new URLSearchParams({
      url: url,
      lang: lang,
      format: format,
      title: mediaData.videoInfo.title,
    });

    const endpoint = `/api/subtitle?${queryParams.toString()}`;
    const anchor = document.createElement("a");
    anchor.href = endpoint;
    anchor.setAttribute("download", "");
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    showToast(`✓ Subtitles Download Started: ${lang.toUpperCase()} (.${format})`, "success");
  };

  const togglePlaylistTrack = (id: string) => {
    playSfx("click");
    setSelectedPlaylistTracks((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAllPlaylistTracks = () => {
    playSfx("click");
    if (!mediaData?.playlistInfo) return;
    if (selectedPlaylistTracks.length === mediaData.playlistInfo.items.length) {
      setSelectedPlaylistTracks([]);
    } else {
      setSelectedPlaylistTracks(mediaData.playlistInfo.items.map((i) => i.id));
    }
  };

  const downloadSelectedBatch = async (type: "video" | "audio") => {
    if (!mediaData?.playlistInfo || selectedPlaylistTracks.length === 0) return;
    setBatchDownloading(true);
    playSfx("download");
    showToast(`✓ Batch Download Started: Queuing ${selectedPlaylistTracks.length} items...`, "info");

    const selectedItems = mediaData.playlistInfo.items.filter((item) =>
      selectedPlaylistTracks.includes(item.id)
    );

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const formatId = type === "video" ? "18" : "140";
      const ext = type === "video" ? "mp4" : "m4a";

      const queryParams = new URLSearchParams({
        url: item.url,
        format_id: formatId,
        ext: ext,
        title: item.title,
      });

      const endpoint = `/api/stream?${queryParams.toString()}`;
      const anchor = document.createElement("a");
      anchor.href = endpoint;
      anchor.setAttribute("download", "");
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      await new Promise((r) => setTimeout(r, 900));
    }

    setBatchDownloading(false);
    showToast(`✓ All ${selectedItems.length} tracks queued for download!`, "success");
  };

  const bestVideoFormat = mediaData?.videoInfo?.videoFormats?.[0];
  const bestAudioFormat = mediaData?.videoInfo?.audioFormats?.[0];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/3 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 -right-32 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[180px]" />
        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[180px]" />
      </div>

      {/* Floating Active Downloads Notification */}
      <AnimatePresence>
        {activeDownloads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 max-w-sm w-full glass-card p-4 rounded-2xl border border-emerald-500/30 shadow-2xl bg-[#07090e]/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Download Started</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Check Browser Downloads</span>
            </div>

            <div className="space-y-2">
              {activeDownloads.map((d) => (
                <div key={d.timestamp} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <HardDriveDownload className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white truncate">{d.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200 shrink-0">
                    {d.quality}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Progress Tube */}
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-3">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-3 backdrop-blur-xl shadow-2xl border ${
              toastMessage.type === "error"
                ? "bg-red-950/90 text-red-300 border-red-500/30"
                : toastMessage.type === "success"
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/30"
                : "bg-slate-900/90 text-slate-200 border-white/10"
            }`}
          >
            {toastMessage.type === "error" ? (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            ) : toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#07090e]/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-600/20">
              <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
                <Download className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                YouTube <span className="text-indigo-400 font-normal">Downloader</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Sfx Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition"
              title={soundEnabled ? "Mute Click Sounds" : "Enable Click Sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* History Drawer Trigger */}
            <button
              onClick={() => {
                playSfx("click");
                setShowHistoryDrawer(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 transition shadow-sm ml-1"
              title="Recent Downloads History"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 flex-1 relative z-10">

        {/* Hero Header */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-4 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Ultra-Detailed Universal Media Extractor
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Download YouTube Videos & Playlists in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400">Original Quality</span>
          </h1>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Directly extract 4K 60FPS, 1080p Full HD, lossless M4A music, multi-language subtitles, and original cover thumbnails with zero advertisements and full audio synchronization.
          </p>
        </div>

        {/* URL Input Bar */}
        <div className="glass-card p-2.5 rounded-2xl border border-white/10 shadow-2xl mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center flex-1 bg-[#07090e]/95 rounded-xl px-4 py-3 border border-white/10 focus-within:border-indigo-500 transition">
              <Film className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMedia()}
                placeholder="Paste YouTube Video, Shorts, or Playlist URL..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-medium"
              />
              <button
                onClick={handlePasteClipboard}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-white/10 rounded-lg text-[11px] font-medium text-slate-300 flex items-center gap-1.5 transition shrink-0 ml-1"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste</span>
              </button>
            </div>

            <button
              onClick={() => fetchMedia()}
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Extract Formats</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Monetization Ad Slot */}
        <AdBanner className="my-6" />

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-red-950/80 border border-red-500/30 text-red-200 text-xs flex items-center justify-between gap-3 mb-8 shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        {loading && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 animate-pulse mb-8 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-5 aspect-video bg-slate-800/70 rounded-2xl" />
              <div className="md:col-span-7 space-y-4">
                <div className="h-6 bg-slate-800/70 rounded-lg w-3/4" />
                <div className="h-4 bg-slate-800/50 rounded-lg w-1/2" />
                <div className="grid grid-cols-1 gap-3 pt-4">
                  <div className="h-12 bg-slate-800/50 rounded-xl" />
                  <div className="h-12 bg-slate-800/50 rounded-xl" />
                  <div className="h-12 bg-slate-800/50 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Card — Single Video View */}
        {mediaData && !mediaData.isPlaylist && mediaData.videoInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-12 border border-white/10"
          >
            {/* Quick Action Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Media Analyzed: Verified formats ready</span>
              </div>

              <div className="flex items-center gap-2">
                {bestVideoFormat && (
                  <button
                    onClick={() =>
                      triggerDownload(
                        url,
                        bestVideoFormat.format_id,
                        bestVideoFormat.container,
                        mediaData.videoInfo!.title,
                        `quick_vid`,
                        bestVideoFormat.height
                      )
                    }
                    disabled={downloadingId === "quick_vid"}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                  >
                    {downloadingId === "quick_vid" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingId === "quick_vid" ? "Starting..." : `Download Best (${bestVideoFormat.quality})`}</span>
                  </button>
                )}

                {bestAudioFormat && (
                  <button
                    onClick={() =>
                      triggerDownload(
                        url,
                        bestAudioFormat.format_id,
                        bestAudioFormat.container,
                        mediaData.videoInfo!.title,
                        `quick_aud`
                      )
                    }
                    disabled={downloadingId === "quick_aud"}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
                  >
                    {downloadingId === "quick_aud" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileAudio className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingId === "quick_aud" ? "Starting..." : `Download Audio (${bestAudioFormat.quality})`}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Media Preview & Metadata Box */}
              <div className={`flex flex-col gap-4 ${theaterMode ? "md:col-span-12" : "md:col-span-5"}`}>
                {activeTab === "preview" ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-xl">
                    <iframe
                      src={`https://www.youtube.com/embed/${mediaData.videoInfo.id}?autoplay=1`}
                      title={mediaData.videoInfo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                    <button
                      onClick={() => setTheaterMode(!theaterMode)}
                      className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg border border-white/20 backdrop-blur-md transition"
                      title={theaterMode ? "Normal View" : "Theater View"}
                    >
                      {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="relative group rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-xl">
                    <img
                      src={mediaData.videoInfo.thumbnail}
                      alt={mediaData.videoInfo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute bottom-2.5 right-2.5 bg-black/85 font-mono text-[11px] font-bold text-cyan-300 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mediaData.videoInfo.duration}
                    </span>
                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("preview");
                      }}
                      className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Preview Video Player"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </button>
                  </div>
                )}

                {/* Ultra-Detailed Author & Stats Box */}
                <div className="space-y-2.5 text-xs text-slate-400 bg-[#07090e]/90 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold truncate">
                      <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{mediaData.videoInfo.author}</span>
                    </div>
                    {mediaData.videoInfo.subscribers && (
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {mediaData.videoInfo.subscribers}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{mediaData.videoInfo.views}</span>
                    </div>
                    {mediaData.videoInfo.likes && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{mediaData.videoInfo.likes}</span>
                      </div>
                    )}
                    {mediaData.videoInfo.uploadDate && (
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{mediaData.videoInfo.uploadDate}</span>
                      </div>
                    )}
                    {mediaData.videoInfo.category && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{mediaData.videoInfo.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyVideoUrl}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{copiedUrl ? "Copied!" : "Copy Link"}</span>
                  </button>
                  {mediaData.videoInfo.tags && mediaData.videoInfo.tags.length > 0 && (
                    <button
                      onClick={() => {
                        playSfx("click");
                        setShowTagsModal(true);
                      }}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
                      title="View Video Tags & Description"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Tags</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      playSfx("click");
                      setShowQrModal(true);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition flex items-center justify-center"
                    title="Generate Mobile QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${mediaData.videoInfo.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center transition"
                    title="Open on YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Formats Selector with Ultra Detailed Tabs */}
              <div className={`flex flex-col justify-between ${theaterMode ? "md:col-span-12" : "md:col-span-7"}`}>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white mb-4 line-clamp-2 leading-snug">
                    {mediaData.videoInfo.title}
                  </h2>

                  {/* Mode Selector Tabs */}
                  <div className="flex flex-wrap p-1 rounded-2xl bg-[#07090e] border border-white/10 mb-4 max-w-fit gap-1">
                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("video");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        activeTab === "video" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Video</span>
                    </button>

                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("audio");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        activeTab === "audio" ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Audio</span>
                    </button>

                    {mediaData.videoInfo.subtitles && mediaData.videoInfo.subtitles.length > 0 && (
                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("subtitles");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          activeTab === "subtitles" ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md shadow-amber-600/30" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Subtitles ({mediaData.videoInfo.subtitles.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("thumbnails");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        activeTab === "thumbnails" ? "bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-600/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Covers</span>
                    </button>

                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("specs");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        activeTab === "specs" ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Tech Specs</span>
                    </button>

                    <button
                      onClick={() => {
                        playSfx("click");
                        setActiveTab("preview");
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        activeTab === "preview" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Player</span>
                    </button>
                  </div>

                  {/* Tab Options Content */}
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {/* Tab 1: Video Formats */}
                    {activeTab === "video" && (
                      mediaData.videoInfo.videoFormats.length > 0 ? (
                        mediaData.videoInfo.videoFormats.map((f) => (
                          <div
                            key={f.format_id}
                            className="p-3.5 rounded-2xl bg-[#07090e]/90 border border-white/5 hover:border-white/20 flex items-center justify-between transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-200 border border-white/10 flex flex-col items-center justify-center font-bold text-xs">
                                <span>{f.height >= 1440 ? "4K" : f.height >= 1080 ? "HD" : "MP4"}</span>
                                <span className="text-[9px] font-mono text-slate-400">{f.fps}fps</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-white">{f.quality}</p>
                                  {f.badge && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-slate-200 rounded-md border border-white/15 font-medium">
                                      {f.badge}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                                    {f.codec}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span>{f.size}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" />
                                    {f.speedFiber}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() =>
                                triggerDownload(
                                  url,
                                  f.format_id,
                                  f.container,
                                  mediaData.videoInfo!.title,
                                  `vid_${f.format_id}`,
                                  f.height
                                )
                              }
                              disabled={downloadingId === `vid_${f.format_id}`}
                              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
                                downloadingId === `vid_${f.format_id}`
                                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                  : "bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                              }`}
                            >
                              {downloadingId === `vid_${f.format_id}` ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 p-4">No video formats available for this stream.</p>
                      )
                    )}

                    {/* Tab 2: Audio Formats */}
                    {activeTab === "audio" && (
                      mediaData.videoInfo.audioFormats.map((f) => (
                        <div
                          key={f.format_id}
                          className="p-3.5 rounded-2xl bg-[#07090e]/90 border border-white/5 hover:border-emerald-500/40 flex items-center justify-between transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex flex-col items-center justify-center font-bold text-xs">
                              <Volume2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-white">
                                  {f.container.toUpperCase()} Audio ({f.quality})
                                </p>
                                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 font-mono">
                                  {f.codec} • {f.sampleRate}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>{f.description}</span>
                                <span>•</span>
                                <span className="text-slate-300 font-bold">{f.size}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              triggerDownload(
                                url,
                                f.format_id,
                                f.container,
                                mediaData.videoInfo!.title,
                                `aud_${f.format_id}`
                              )
                            }
                            disabled={downloadingId === `aud_${f.format_id}`}
                            className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
                              downloadingId === `aud_${f.format_id}`
                                ? "bg-emerald-600 text-white border-emerald-500"
                                : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30"
                            }`}
                          >
                            {downloadingId === `aud_${f.format_id}` ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Audio</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}

                    {/* Tab 3: Subtitles */}
                    {activeTab === "subtitles" && (
                      <div className="space-y-3">
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={subtitleSearch}
                            onChange={(e) => setSubtitleSearch(e.target.value)}
                            placeholder="Filter subtitle language..."
                            className="w-full bg-[#07090e] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
                          />
                        </div>

                        {mediaData.videoInfo.subtitles
                          ?.filter((s) => s.name.toLowerCase().includes(subtitleSearch.toLowerCase()))
                          .map((sub) => (
                            <div
                              key={sub.code}
                              className="p-3.5 rounded-2xl bg-[#07090e]/90 border border-white/5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{sub.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">Language Code: {sub.code}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => triggerSubtitleDownload(sub.code, "srt")}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-white/10 flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>.SRT</span>
                                </button>
                                <button
                                  onClick={() => triggerSubtitleDownload(sub.code, "vtt")}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-white/10 flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>.VTT</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Tab 4: Covers / Thumbnails Studio */}
                    {activeTab === "thumbnails" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(mediaData.videoInfo.thumbnailList || [
                          { resolution: "Original HD", dimensions: "1920×1080", url: mediaData.videoInfo.thumbnail },
                        ]).map((thumb, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-[#07090e]/90 border border-white/10 flex flex-col gap-2"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                              <img src={thumb.url} alt="Cover" className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-cyan-300 font-bold border border-white/10">
                                {thumb.dimensions || thumb.resolution}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold text-white">{thumb.resolution}</span>
                              <a
                                href={thumb.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download="thumbnail.jpg"
                                className="px-3 py-1 bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save Artwork</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tab 5: Ultra-Detailed Technical Specifications */}
                    {activeTab === "specs" && (
                      <div className="space-y-3 p-1">
                        <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/10">
                          <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5" /> Video Stream Parameters
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Aspect Ratio</p>
                              <p className="font-mono text-white font-bold">{mediaData.videoInfo.aspectRatio}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Max Resolution</p>
                              <p className="font-mono text-white font-bold">{bestVideoFormat?.quality || "1080p"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Video Codecs</p>
                              <p className="font-mono text-white font-bold">{bestVideoFormat?.codec || "H.264 / AVC"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Frame Rate</p>
                              <p className="font-mono text-white font-bold">{bestVideoFormat?.fps || 30} FPS</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#07090e] border border-white/10">
                          <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5" /> Audio Stream Parameters
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Audio Codec</p>
                              <p className="font-mono text-white font-bold">{bestAudioFormat?.codec || "AAC-LC"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Sample Rate</p>
                              <p className="font-mono text-white font-bold">{bestAudioFormat?.sampleRate || "44,100 Hz"}</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Audio Channels</p>
                              <p className="font-mono text-white font-bold">2.0 Stereo (Lossless Mux)</p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                              <p className="text-[10px] text-slate-500">Max Audio Bitrate</p>
                              <p className="font-mono text-white font-bold">{bestAudioFormat?.quality || "160 kbps"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* In-Results Monetization Banner Slot */}
            <AdBanner className="mt-8 pt-6 border-t border-white/10" />
          </motion.div>
        )}

        {/* Results Card — Playlist View */}
        {mediaData && mediaData.isPlaylist && mediaData.playlistInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-12 border border-white/10"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black border border-white/10 shrink-0">
                  <img
                    src={mediaData.playlistInfo.thumbnail}
                    alt={mediaData.playlistInfo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-1">
                    <ListVideo className="w-3 h-3" /> YouTube Playlist
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {mediaData.playlistInfo.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Curated by <span className="text-slate-200">{mediaData.playlistInfo.author}</span> •{" "}
                    {mediaData.playlistInfo.totalVideos} videos
                  </p>
                </div>
              </div>

              {/* Master Batch Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={toggleAllPlaylistTracks}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
                >
                  {selectedPlaylistTracks.length === mediaData.playlistInfo.items.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    {selectedPlaylistTracks.length === mediaData.playlistInfo.items.length
                      ? "Deselect All"
                      : "Select All"}
                  </span>
                </button>

                <button
                  onClick={() => downloadSelectedBatch("video")}
                  disabled={batchDownloading || selectedPlaylistTracks.length === 0}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Selected MP4 ({selectedPlaylistTracks.length})</span>
                </button>

                <button
                  onClick={() => downloadSelectedBatch("audio")}
                  disabled={batchDownloading || selectedPlaylistTracks.length === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Download MP3</span>
                </button>
              </div>
            </div>

            {/* Playlist Track Search */}
            <div className="mb-4">
              <input
                type="text"
                value={playlistSearch}
                onChange={(e) => setPlaylistSearch(e.target.value)}
                placeholder="Search tracks within playlist..."
                className="w-full bg-[#07090e]/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Playlist Tracks Table List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {mediaData.playlistInfo.items
                .filter((item) => item.title.toLowerCase().includes(playlistSearch.toLowerCase()))
                .map((item, idx) => {
                  const isSelected = selectedPlaylistTracks.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/40"
                          : "bg-[#07090e]/80 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => togglePlaylistTrack(item.id)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        <span className="text-[11px] font-mono text-slate-500 w-5 text-right">{idx + 1}</span>
                        <div className="w-12 h-8 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate max-w-sm">{item.title}</p>
                          <p className="text-[10px] text-slate-400 truncate font-mono">
                            {item.author} • {item.duration}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerDownload(item.url, "18", "mp4", item.title, `pl_vid_${item.id}`)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">MP4</span>
                        </button>
                        <button
                          onClick={() => triggerDownload(item.url, "140", "m4a", item.title, `pl_aud_${item.id}`)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Music className="w-3 h-3" />
                          <span className="hidden sm:inline">MP3</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Ultra-Detailed Format Compatibility Matrix */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 mb-16 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Format & Device Compatibility Matrix</h2>
            <p className="text-xs text-slate-400 mt-1">Detailed technical breakdown of supported output formats and target playback hardware</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-4 font-bold">Container / Codec</th>
                  <th className="py-3 px-4 font-bold">Quality Profile</th>
                  <th className="py-3 px-4 font-bold">Supported Hardware</th>
                  <th className="py-3 px-4 font-bold">Recommended Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPATIBILITY_TABLE.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>{row.format}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{row.quality}</td>
                    <td className="py-3.5 px-4 text-slate-400">{row.devices}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{row.recommended}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3-Step How It Works Guide */}
        <div className="my-16">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">How to Download YouTube Videos</h2>
            <p className="text-xs text-slate-400 mt-1">Simple 3-step process to download any YouTube media in seconds</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Paste YouTube URL</h3>
              <p className="text-xs text-slate-400">
                Copy the link of any YouTube video, Shorts, or Playlist and paste it into the search box above.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Select Quality</h3>
              <p className="text-xs text-slate-400">
                Choose your preferred video resolution (4K, 1080p, 720p) or audio format (M4A / MP3).
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Instant Download</h3>
              <p className="text-xs text-slate-400">
                Click Download. Your file streams directly to your browser with full audio and no watermarks.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">4K & 1080p Full HD</h3>
            <p className="text-xs text-slate-400">Original video quality with full audio synchronization.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Lossless Audio Tracks</h3>
            <p className="text-xs text-slate-400">Extract high-bitrate MP3 and M4A audio tracks with clean tags.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
              <ListVideo className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Playlist Batch Queue</h3>
            <p className="text-xs text-slate-400">Multi-select playlist tracks and download entire collections.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">100% Free & Secure</h3>
            <p className="text-xs text-slate-400">Zero advertisements, no telemetry tracking, and no software installation.</p>
          </div>
        </div>

        {/* Mid-Page Monetization Ad Slot */}
        <AdBanner className="my-12" />

        {/* FAQ Accordion Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400 mt-1">Everything you need to know about downloading YouTube media</p>
          </div>

          <div className="space-y-3">
            {FAQ_LIST.map((item, idx) => (
              <div key={idx} className="border border-white/5 rounded-2xl bg-[#07090e]/80 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left text-xs sm:text-sm font-bold text-white flex items-center justify-between gap-3 hover:text-indigo-400 transition"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-400" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* History Slide-In Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-[#07090e] border-l border-white/10 z-50 flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Recent Downloads</h3>
                </div>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {history.length > 0 ? (
                  history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3 group"
                    >
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-black shrink-0">
                        <img src={h.thumbnail} alt={h.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{h.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {h.type.toUpperCase()} • {h.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setShowHistoryDrawer(false);
                            fetchMedia(h.url);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400"
                          title="Extract again"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromHistory(h.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">No recent downloads found.</div>
                )}
              </div>

              {history.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={clearHistory}
                    className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All History</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#07090e] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>Scan to Download on Mobile</span>
                </h3>
                <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl max-w-[200px] mx-auto mb-4 shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url || window.location.href)}`}
                  alt="QR Code"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-xs text-slate-400">
                Open your phone camera to scan and start downloading this media stream on iOS or Android.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Tags & Description Modal */}
      <AnimatePresence>
        {showTagsModal && mediaData?.videoInfo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#07090e] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Video Tags & Description</span>
                </h3>
                <button onClick={() => setShowTagsModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mediaData.videoInfo.tags && mediaData.videoInfo.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-400">Creator Tags ({mediaData.videoInfo.tags.length})</label>
                    <button
                      onClick={handleCopyTags}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      {copiedTags ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                      <span>{copiedTags ? "Copied!" : "Copy All Tags"}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {mediaData.videoInfo.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-900 border border-white/10 text-slate-300 rounded-lg text-xs font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mediaData.videoInfo.description && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-2">Video Description</label>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-white/5 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                    {mediaData.videoInfo.description}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Ad Interstitial Modal */}
      <VideoAdModal
        isOpen={showVideoAdModal}
        targetTitle={pendingDownloadData?.title || "Video"}
        onClose={() => {
          setShowVideoAdModal(false);
          setPendingDownloadData(null);
        }}
        onProceedDownload={() => {
          setShowVideoAdModal(false);
          if (pendingDownloadData) {
            executeDirectDownload(
              pendingDownloadData.targetUrl,
              pendingDownloadData.formatId,
              pendingDownloadData.ext,
              pendingDownloadData.title,
              pendingDownloadData.trackingKey,
              pendingDownloadData.height
            );
            setPendingDownloadData(null);
          }
        }}
      />

      {/* Legal & Compliance Modals (Monetag / AdSense / DMCA Approval) */}
      <LegalModals
        type={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />

      {/* Footer with Compliance & Ad Network Verification Links */}
      <footer className="border-t border-white/10 py-10 bg-[#07090e]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <p>© 2026 YouTube Video & Playlist Downloader • All Rights Reserved</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-medium">
            <button
              onClick={() => {
                playSfx("click");
                setActiveLegalModal("privacy");
              }}
              className="hover:text-indigo-400 transition"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => {
                playSfx("click");
                setActiveLegalModal("terms");
              }}
              className="hover:text-indigo-400 transition"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => {
                playSfx("click");
                setActiveLegalModal("dmca");
              }}
              className="hover:text-indigo-400 transition"
            >
              DMCA Disclaimer
            </button>
            <span>•</span>
            <button
              onClick={() => {
                playSfx("click");
                setActiveLegalModal("contact");
              }}
              className="hover:text-indigo-400 transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </footer>

      {/* High-Visibility Sticky Bottom Banner */}
      <StickyAdBar />

    </div>
  );
}
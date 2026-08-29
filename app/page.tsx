"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Download,
  Link2,
  Clipboard,
  X,
  RefreshCw,
  Video,
  Music,
  CheckCircle2,
  AlertCircle,
  Eye,
  User,
  Clock,
  History,
  Trash2,
  Layers,
  ChevronDown,
  ShieldCheck,
  Search,
  ExternalLink,
  Play,
  Volume2,
  ArrowDownToLine,
  Film,
  Sparkles,
  Zap,
  Check,
  Share2,
  Flame,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  VolumeX,
  QrCode,
  Command,
  FileVideo,
  FileAudio,
  Palette,
  Subtitles,
  Image as ImageIcon,
  Tag,
  ThumbsUp,
  Users,
  CheckSquare,
  Square,
  Copy,
  Info
} from "lucide-react";

interface VideoFormat {
  format_id: string;
  quality: string;
  height: number;
  container: string;
  hasAudio: boolean;
  isProgressive: boolean;
  fps: number;
  size: string;
  badge?: string;
  description: string;
}

interface AudioFormat {
  format_id: string;
  quality: string;
  container: string;
  codec: string;
  abr: number;
  size: string;
  badge?: string;
  description: string;
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
  thumbnail: string;
  thumbnailList?: { resolution: string; url: string }[];
  subtitles?: { code: string; name: string }[];
  duration: string;
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
  type: "video" | "playlist";
  timestamp: number;
}

const ACCENT_THEMES = [
  {
    id: "indigo",
    name: "Classic Indigo",
    primary: "#6366f1",
    secondary: "#8b5cf6",
    glow: "rgba(99, 102, 241, 0.18)",
    gradient: "from-indigo-600 via-indigo-500 to-sky-500",
    buttonBg: "bg-indigo-600 hover:bg-indigo-500",
    badgeBg: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    textClass: "text-indigo-400",
  },
  {
    id: "cyan",
    name: "Ocean Sky",
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    glow: "rgba(14, 165, 233, 0.18)",
    gradient: "from-sky-600 via-cyan-500 to-indigo-500",
    buttonBg: "bg-sky-600 hover:bg-sky-500",
    badgeBg: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    textClass: "text-sky-400",
  },
  {
    id: "emerald",
    name: "Mint Emerald",
    primary: "#10b981",
    secondary: "#059669",
    glow: "rgba(16, 185, 129, 0.18)",
    gradient: "from-emerald-600 via-teal-500 to-cyan-500",
    buttonBg: "bg-emerald-600 hover:bg-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    textClass: "text-emerald-400",
  },
  {
    id: "rose",
    name: "Sunset Rose",
    primary: "#f43f5e",
    secondary: "#ec4899",
    glow: "rgba(244, 63, 94, 0.18)",
    gradient: "from-rose-600 via-pink-500 to-orange-500",
    buttonBg: "bg-rose-600 hover:bg-rose-500",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    textClass: "text-rose-400",
  },
  {
    id: "amber",
    name: "Warm Amber",
    primary: "#f59e0b",
    secondary: "#d97706",
    glow: "rgba(245, 158, 11, 0.18)",
    gradient: "from-amber-600 via-amber-500 to-rose-500",
    buttonBg: "bg-amber-600 hover:bg-amber-500",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    textClass: "text-amber-400",
  },
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
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "pop") {
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "success" || type === "download") {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
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

  const [activeTab, setActiveTab] = useState<"video" | "audio" | "subtitles" | "thumbnails" | "preview">("video");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTheme, setActiveTheme] = useState(ACCENT_THEMES[0]);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // Playlist Batch Selection
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<string[]>([]);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // History & Drawer state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty("--mouse-x", `${x}px`);
    containerRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const playSfx = (type: "click" | "pop" | "success" | "download") => {
    if (soundEnabled) {
      playMicroSound(type);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vortex_download_history");
      if (stored) setHistory(JSON.parse(stored));
      const storedTheme = localStorage.getItem("vortex_theme_id");
      if (storedTheme) {
        const found = ACCENT_THEMES.find((t) => t.id === storedTheme);
        if (found) setActiveTheme(found);
      }
      const storedSound = localStorage.getItem("vortex_sound_enabled");
      if (storedSound !== null) setSoundEnabled(storedSound === "true");
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShowShortcutsModal(true);
      } else if (e.key === "Escape") {
        setShowHistoryDrawer(false);
        setShowQrModal(false);
        setShowShortcutsModal(false);
        setShowThemePicker(false);
        setShowTagsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectTheme = (theme: typeof ACCENT_THEMES[0]) => {
    setActiveTheme(theme);
    setShowThemePicker(false);
    playSfx("pop");
    try {
      localStorage.setItem("vortex_theme_id", theme.id);
    } catch {}
    showToast(`Style updated to ${theme.name}`, "info");
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    if (newVal) playMicroSound("pop");
    try {
      localStorage.setItem("vortex_sound_enabled", String(newVal));
    } catch {}
    showToast(`Sound feedback ${newVal ? "enabled" : "muted"}`, "info");
  };

  const saveToHistory = (title: string, thumbnail: string, targetUrl: string, type: "video" | "playlist") => {
    try {
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        thumbnail,
        url: targetUrl,
        type,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history.filter((h) => h.url !== targetUrl)].slice(0, 20);
      setHistory(updated);
      localStorage.setItem("vortex_download_history", JSON.stringify(updated));
    } catch {}
  };

  const removeFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSfx("click");
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("vortex_download_history", JSON.stringify(updated));
    } catch {}
    showToast("Item removed from history", "info");
  };

  const clearHistory = () => {
    playSfx("click");
    setHistory([]);
    try {
      localStorage.removeItem("vortex_download_history");
    } catch {}
    showToast("Download history cleared", "info");
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3600);
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

      showToast("Download links ready", "success");
    } catch (err: any) {
      setError(err.message || "Could not load video details. Please verify the URL.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (
    targetUrl: string,
    formatId: string,
    ext: string,
    title: string,
    trackingKey: string
  ) => {
    playSfx("download");
    setDownloadingId(trackingKey);

    const queryParams = new URLSearchParams({
      url: targetUrl,
      format_id: formatId,
      ext: ext,
      title: title || "video",
    });

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
        colors: [activeTheme.primary, "#0ea5e9", "#10b981", "#f59e0b"],
      });
    } catch {}

    showToast("Starting download in browser...", "success");

    setTimeout(() => {
      setDownloadingId(null);
    }, 2800);
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

    showToast(`Downloading ${lang.toUpperCase()} subtitles (.${format})...`, "success");
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
    showToast(`Queuing ${selectedPlaylistTracks.length} downloads...`, "info");

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

      const anchor = document.createElement("a");
      anchor.href = `/api/stream?${queryParams.toString()}`;
      anchor.setAttribute("download", "");
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Stagger downloads by 1.2s to prevent browser popup blockers
      await new Promise((r) => setTimeout(r, 1200));
    }

    setBatchDownloading(false);
    showToast("Batch downloads initiated successfully!", "success");
  };

  const sampleLinks = [
    { label: "Rick Astley - Never Gonna Give You Up", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { label: "Lofi Beats Radio", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
    { label: "Relaxing Synthwave", url: "https://www.youtube.com/watch?v=4xDzrJKXOOY" },
  ];

  const faqs = [
    {
      q: "How does Vortex download YouTube videos?",
      a: "Vortex directly streams the audio and video tracks from source servers via our high-speed yt-dlp backend. The files are delivered straight to your browser with no compression loss.",
    },
    {
      q: "What is the difference between Progressive MP4 and HD Streams?",
      a: "Progressive MP4 formats (such as 720p and 360p) contain both video and audio merged in a single file ready to play on all phones, TVs, and media players. HD Video Streams (1080p/4K) provide raw high-bitrate video tracks.",
    },
    {
      q: "Can I download subtitles and closed captions?",
      a: "Yes. In the Subtitles tab, you can select and download `.srt` or `.vtt` files in multiple languages.",
    },
    {
      q: "Can I download full YouTube playlists?",
      a: "Yes. Paste any public YouTube playlist link to see the full list of tracks, select items with checkboxes, and batch-download audio or video tracks.",
    },
  ];

  const bestVideoFormat = mediaData?.videoInfo?.videoFormats.find((f) => f.isProgressive) || mediaData?.videoInfo?.videoFormats[0];
  const bestAudioFormat = mediaData?.videoInfo?.audioFormats[0];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen cosmic-mesh bg-[#06080e] text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-600 selection:text-white relative overflow-x-hidden"
    >
      {/* Warm Ambient Glowing Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{ backgroundColor: activeTheme.glow }}
          className="absolute -top-32 left-1/4 w-[650px] h-[650px] rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.06, 0.14, 0.06],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 -right-24 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[160px]"
        />
      </div>

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
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-[#06080e]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-sky-400 p-[1.5px] shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-[#06080e] rounded-[14px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Vortex <span className="text-slate-400 font-normal">Downloader</span>
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* Theme Picker Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
                title="Color Style"
              >
                <Palette className="w-3.5 h-3.5" style={{ color: activeTheme.primary }} />
                <span className="hidden sm:inline">{activeTheme.name.split(" ")[0]}</span>
              </button>

              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 glass-card rounded-2xl p-2 border border-white/10 shadow-2xl z-50 space-y-1"
                  >
                    {ACCENT_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectTheme(t)}
                        className={`w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition ${
                          activeTheme.id === t.id ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }} />
                          <span>{t.name}</span>
                        </div>
                        {activeTheme.id === t.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-white/10 text-slate-300 hover:text-white transition"
              title={soundEnabled ? "Mute Sound Feedback" : "Enable Sound Feedback"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Shortcuts Guide Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-white/10 text-slate-300 hover:text-white transition hidden sm:flex items-center"
              title="Keyboard Shortcuts (Ctrl+K)"
            >
              <Command className="w-4 h-4 text-slate-400" />
            </button>

            {/* History Drawer Trigger */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSfx("click");
                setShowHistoryDrawer(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 transition shadow-sm ml-1"
              title="Recent Downloads"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] rounded-full font-bold">
                  {history.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${activeTheme.badgeBg} mb-4 shadow-sm`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clean, uncompressed YouTube downloader • Free & fast</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white"
          >
            Save video & audio with <span className="shimmer-text">crystal clarity</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3.5 text-slate-400 text-sm sm:text-base leading-relaxed"
          >
            Paste any YouTube video, Short, or playlist link to download direct MP4 video files, high-fidelity audio, or subtitles in seconds. No watermarks, no ads, no wait times.
          </motion.p>
        </div>

        {/* Dynamic Input Bar Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card spotlight-card glow-border-focus p-2 rounded-2xl border border-white/10 shadow-2xl mb-4"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center flex-1 bg-[#06080e]/95 rounded-xl px-4 py-3 border border-white/5 focus-within:border-white/20 transition">
              <Link2 className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMedia()}
                placeholder="Paste YouTube Video, Short, or Playlist link here..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none font-medium"
              />
              {url ? (
                <button
                  onClick={() => setUrl("")}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition mr-1"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePasteClipboard}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-lg text-[11px] font-medium text-slate-300 flex items-center gap-1.5 transition shrink-0"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-400" />
                  <span>Paste</span>
                </motion.button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fetchMedia()}
              disabled={loading}
              className={`px-8 py-3.5 bg-gradient-to-r ${activeTheme.gradient} hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Get Download Links</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Demo Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Try example:
          </span>
          {sampleLinks.map((sample, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fetchMedia(sample.url)}
              className="px-3 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-white/5 hover:border-white/20 text-slate-300 hover:text-white transition text-[11px]"
            >
              {sample.label}
            </motion.button>
          ))}
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3 shadow-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-red-200">Could not extract link</p>
                <p className="text-red-300/90">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-3xl p-6 sm:p-8 animate-pulse mb-8 border border-white/5"
          >
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
          </motion.div>
        )}

        {/* Dynamic Media Result Container */}
        <AnimatePresence mode="wait">
          {/* CASE 1: Single Video View */}
          {mediaData && !mediaData.isPlaylist && mediaData.videoInfo && (
            <motion.div
              key="single-video"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="glass-card spotlight-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-12 border border-white/10"
            >
              {/* Quick 1-Click Download Preset Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Instant 1-Click Downloads:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {bestVideoFormat && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        triggerDownload(
                          url,
                          bestVideoFormat.format_id,
                          bestVideoFormat.container,
                          mediaData.videoInfo!.title,
                          `quick_vid`
                        )
                      }
                      disabled={downloadingId === "quick_vid"}
                      className={`px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${activeTheme.gradient} text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50`}
                    >
                      <FileVideo className="w-3.5 h-3.5" />
                      <span>Download Video ({bestVideoFormat.quality})</span>
                    </motion.button>
                  )}

                  {bestAudioFormat && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
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
                      <FileAudio className="w-3.5 h-3.5" />
                      <span>Download Audio ({bestAudioFormat.quality})</span>
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Media Preview & Metadata */}
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
                      <span className="absolute bottom-2.5 right-2.5 bg-black/85 font-mono text-[11px] font-bold text-sky-300 px-2.5 py-0.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mediaData.videoInfo.duration}
                      </span>
                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("preview");
                        }}
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Watch preview"
                      >
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Channel & Stats Box */}
                  <div className="space-y-2 text-xs text-slate-400 bg-[#06080e]/80 p-3.5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-200 font-medium truncate">
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{mediaData.videoInfo.author}</span>
                      </div>
                      {mediaData.videoInfo.subscribers && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {mediaData.videoInfo.subscribers}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{mediaData.videoInfo.views}</span>
                      </div>
                      {mediaData.videoInfo.likes && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <ThumbsUp className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{mediaData.videoInfo.likes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopyVideoUrl}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{copiedUrl ? "Copied!" : "Copy Link"}</span>
                    </motion.button>
                    {mediaData.videoInfo.tags && mediaData.videoInfo.tags.length > 0 && (
                      <button
                        onClick={() => {
                          playSfx("click");
                          setShowTagsModal(true);
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
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
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-slate-400 hover:text-white transition flex items-center justify-center"
                      title="Generate Mobile QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${mediaData.videoInfo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-white/10 text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center transition"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Formats Selector with Animated Pill Tabs */}
                <div className={`flex flex-col justify-between ${theaterMode ? "md:col-span-12" : "md:col-span-7"}`}>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white mb-4 line-clamp-2 leading-snug">
                      {mediaData.videoInfo.title}
                    </h2>

                    {/* Mode Selector Tabs with layoutId spring */}
                    <div className="flex flex-wrap p-1 rounded-2xl bg-[#06080e] border border-white/10 mb-4 max-w-fit relative gap-1">
                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("video");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative z-10 ${
                          activeTab === "video" ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {activeTab === "video" && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/30"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          <span>Video</span>
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("audio");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative z-10 ${
                          activeTab === "audio" ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {activeTab === "audio" && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl shadow-md shadow-emerald-600/30"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5" />
                          <span>Audio</span>
                        </span>
                      </button>

                      {mediaData.videoInfo.subtitles && mediaData.videoInfo.subtitles.length > 0 && (
                        <button
                          onClick={() => {
                            playSfx("click");
                            setActiveTab("subtitles");
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative z-10 ${
                            activeTab === "subtitles" ? "text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {activeTab === "subtitles" && (
                            <motion.div
                              layoutId="activeTabPill"
                              className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-500 rounded-xl shadow-md shadow-amber-600/30"
                              transition={{ type: "spring", stiffness: 450, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-1.5">
                            <Subtitles className="w-3.5 h-3.5" />
                            <span>Subtitles</span>
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("thumbnails");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative z-10 ${
                          activeTab === "thumbnails" ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {activeTab === "thumbnails" && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-500 rounded-xl shadow-md shadow-pink-600/30"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Covers</span>
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          playSfx("click");
                          setActiveTab("preview");
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative z-10 ${
                          activeTab === "preview" ? "text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {activeTab === "preview" && (
                          <motion.div
                            layoutId="activeTabPill"
                            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-md shadow-purple-600/30"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" />
                          <span>Player</span>
                        </span>
                      </button>
                    </div>

                    {/* Tab Options Content */}
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {activeTab === "video" ? (
                        mediaData.videoInfo.videoFormats.length > 0 ? (
                          mediaData.videoInfo.videoFormats.map((f, idx) => (
                            <motion.div
                              key={f.format_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="p-3.5 rounded-2xl bg-[#06080e]/90 border border-white/5 hover:border-white/20 flex items-center justify-between transition group glass-card-hover"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/5 text-slate-200 border border-white/10 flex items-center justify-center font-bold text-xs">
                                  {f.height >= 1440 ? "4K" : f.height >= 1080 ? "HD" : "MP4"}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white flex items-center gap-2">
                                    {f.quality}
                                    {f.badge && (
                                      <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-slate-200 rounded-md border border-white/15 font-medium">
                                        {f.badge}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {f.description} • {f.size}
                                  </p>
                                </div>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() =>
                                  triggerDownload(
                                    url,
                                    f.format_id,
                                    f.container,
                                    mediaData.videoInfo!.title,
                                    `vid_${f.format_id}`
                                  )
                                }
                                disabled={downloadingId === `vid_${f.format_id}`}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                              >
                                {downloadingId === `vid_${f.format_id}` ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Starting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 p-4">No video formats available for this stream.</p>
                        )
                      ) : activeTab === "audio" ? (
                        mediaData.videoInfo.audioFormats.map((f, idx) => (
                          <motion.div
                            key={f.format_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-3.5 rounded-2xl bg-[#06080e]/90 border border-white/5 hover:border-emerald-500/40 flex items-center justify-between transition group glass-card-hover"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                                <Volume2 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white flex items-center gap-2">
                                  {f.container.toUpperCase()} Audio ({f.quality})
                                  {f.badge && (
                                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 font-mono">
                                      {f.badge}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {f.description} • {f.size}
                                </p>
                              </div>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
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
                              className="px-4 py-2 bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-600 text-emerald-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                            >
                              {downloadingId === `aud_${f.format_id}` ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Starting...</span>
                                </>
                              ) : (
                                <>
                                  <Music className="w-3.5 h-3.5" />
                                  <span>Download Audio</span>
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        ))
                      ) : activeTab === "subtitles" ? (
                        mediaData.videoInfo.subtitles && mediaData.videoInfo.subtitles.length > 0 ? (
                          mediaData.videoInfo.subtitles.map((sub, idx) => (
                            <motion.div
                              key={sub.code}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="p-3.5 rounded-2xl bg-[#06080e]/90 border border-white/5 hover:border-amber-500/40 flex items-center justify-between transition group glass-card-hover"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                                  <Subtitles className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">{sub.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Subtitles / Captions Track
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => triggerSubtitleDownload(sub.code, "srt")}
                                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold rounded-xl transition"
                                >
                                  .SRT
                                </button>
                                <button
                                  onClick={() => triggerSubtitleDownload(sub.code, "vtt")}
                                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-bold rounded-xl transition"
                                >
                                  .VTT
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 p-4">No subtitles available for this video.</p>
                        )
                      ) : activeTab === "thumbnails" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {mediaData.videoInfo.thumbnailList?.map((thumb, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-[#06080e] rounded-2xl border border-white/10 flex flex-col gap-2"
                            >
                              <img
                                src={thumb.url}
                                alt="Thumbnail"
                                className="w-full aspect-video object-cover rounded-xl border border-white/10"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono text-slate-300 font-bold">
                                  {thumb.resolution}
                                </span>
                                <a
                                  href={thumb.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download="thumbnail.jpg"
                                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                                >
                                  <Download className="w-3 h-3" /> Save HD
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-[#06080e] rounded-2xl border border-white/5 text-xs text-slate-400 space-y-2">
                          <p className="font-semibold text-slate-200">Video Player Active</p>
                          <p>You are viewing the interactive video preview above. Switch back to Video or Audio tabs to select specific resolutions.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CASE 2: Playlist View with Batch Downloader */}
          {mediaData && mediaData.isPlaylist && mediaData.playlistInfo && (
            <motion.div
              key="playlist-view"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="glass-card spotlight-card rounded-3xl p-6 sm:p-8 shadow-2xl mb-12 border border-white/10"
            >
              {/* Playlist Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{mediaData.playlistInfo.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {mediaData.playlistInfo.author} • <span className="text-sky-400 font-semibold">{mediaData.playlistInfo.totalVideos} Tracks</span>
                    </p>
                  </div>
                </div>

                {/* Search in Playlist */}
                <div className="flex items-center bg-[#06080e] border border-white/10 rounded-xl px-3 py-2 text-xs w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={playlistSearch}
                    onChange={(e) => setPlaylistSearch(e.target.value)}
                    placeholder="Search tracks in playlist..."
                    className="w-full bg-transparent text-white placeholder-slate-500 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Batch Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-white/5">
                <button
                  onClick={toggleAllPlaylistTracks}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
                >
                  {selectedPlaylistTracks.length === mediaData.playlistInfo.items.length ? (
                    <CheckSquare className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    Select All ({selectedPlaylistTracks.length}/{mediaData.playlistInfo.items.length})
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadSelectedBatch("video")}
                    disabled={selectedPlaylistTracks.length === 0 || batchDownloading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Download Selected MP4</span>
                  </button>
                  <button
                    onClick={() => downloadSelectedBatch("audio")}
                    disabled={selectedPlaylistTracks.length === 0 || batchDownloading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Download Selected Audio</span>
                  </button>
                </div>
              </div>

              {/* Playlist Tracks List */}
              <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {mediaData.playlistInfo.items
                  .filter((item) =>
                    item.title.toLowerCase().includes(playlistSearch.toLowerCase())
                  )
                  .map((item, idx) => {
                    const isChecked = selectedPlaylistTracks.includes(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-3.5 bg-[#06080e]/90 border rounded-2xl flex items-center justify-between gap-4 transition glass-card-hover ${
                          isChecked ? "border-sky-500/40 bg-sky-950/10" : "border-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => togglePlaylistTrack(item.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <span className="text-xs font-mono text-slate-500 w-5 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-16 h-11 object-cover rounded-xl bg-black shrink-0 border border-white/10"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {item.duration} • {item.author}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => triggerDownload(item.url, "18", "mp4", item.title, `p_vid_${item.id}`)}
                            disabled={downloadingId === `p_vid_${item.id}`}
                            className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{downloadingId === `p_vid_${item.id}` ? "..." : "MP4"}</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => triggerDownload(item.url, "140", "m4a", item.title, `p_aud_${item.id}`)}
                            disabled={downloadingId === `p_aud_${item.id}`}
                            className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                          >
                            <Music className="w-3.5 h-3.5" />
                            <span>{downloadingId === `p_aud_${item.id}` ? "..." : "Audio"}</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3-Step "How to Use" Visual Guide */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">How it works</h2>
            <p className="text-xs text-slate-400 mt-1">Download any media in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Paste Link</h3>
              <p className="text-xs text-slate-400">Copy any YouTube video, Short, or playlist URL and paste it in the box.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Choose Format</h3>
              <p className="text-xs text-slate-400">Select MP4 video resolution or high-fidelity M4A/WebM audio tracks.</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold text-sm">
                3
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Save Instantly</h3>
              <p className="text-xs text-slate-400">Click download to save the file straight to your device without wait times.</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-5 rounded-2xl border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Direct Stream Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Streams video and audio chunks directly into your browser download queue.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-5 rounded-2xl border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">High Quality Formats</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supports 720p, 1080p, and high-resolution video streams.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-5 rounded-2xl border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Universal Audio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clean M4A (AAC) and WebM (Opus) audio ready for mobile devices.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card p-5 rounded-2xl border border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Private & Clean</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero advertisements, no third-party trackers, and no storage logging.
            </p>
          </motion.div>
        </div>

        {/* Interactive FAQ Accordion */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/5 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400 mt-1">Common questions regarding video and audio downloads</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#06080e]/80 rounded-2xl border border-white/5 overflow-hidden transition"
              >
                <button
                  onClick={() => {
                    playSfx("click");
                    setOpenFaq(openFaq === idx ? null : idx);
                  }}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                      openFaq === idx ? "rotate-180 text-sky-400" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Tags & Description Modal */}
      <AnimatePresence>
        {showTagsModal && mediaData?.videoInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTagsModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg glass-card rounded-3xl p-6 border border-white/10 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Video Metadata & Creator Tags</span>
                </h3>
                <button onClick={() => setShowTagsModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mediaData.videoInfo.description && (
                <div className="mb-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description:</p>
                  <p className="text-xs text-slate-300 bg-[#06080e] p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {mediaData.videoInfo.description}
                  </p>
                </div>
              )}

              {mediaData.videoInfo.tags && mediaData.videoInfo.tags.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Video Tags:</p>
                    <button
                      onClick={handleCopyTags}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      {copiedTags ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTags ? "Copied All" : "Copy All Tags"}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {mediaData.videoInfo.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile QR Code Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm glass-card rounded-3xl p-6 border border-white/10 shadow-2xl z-10 text-center"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-sky-400" />
                  <span>Scan with Smartphone</span>
                </h3>
                <button onClick={() => setShowQrModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white p-4 rounded-2xl inline-block mb-3 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url || window.location.href)}`}
                  alt="QR Code"
                  className="w-44 h-44"
                />
              </div>
              <p className="text-xs text-slate-400">Scan this QR code with your phone camera to download this media directly on your mobile device.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcutsModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md glass-card rounded-3xl p-6 border border-white/10 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Command className="w-4 h-4 text-sky-400" />
                  <span>Keyboard Shortcuts</span>
                </h3>
                <button onClick={() => setShowShortcutsModal(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span>Open Shortcuts Palette</span>
                  <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-sky-400">Ctrl + K / ?</kbd>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span>Submit / Extract URL</span>
                  <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-sky-400">Enter</kbd>
                </div>
                <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                  <span>Close Modals / Drawers</span>
                  <kbd className="px-2 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[11px] text-sky-400">Esc</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-in Recent Downloads Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md bg-[#090b10] border-l border-white/10 shadow-2xl h-full flex flex-col p-6 z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white">Recent Downloads</h3>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Clock className="w-10 h-10 mb-3 opacity-30 text-slate-400" />
                  <p className="font-semibold text-slate-300">No recent downloads</p>
                  <p className="text-[11px] text-slate-500 mt-1 text-center">Your processed video and playlist links will be saved here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 rounded-2xl bg-[#06080e] border border-white/5 hover:border-white/20 flex items-center justify-between gap-3 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-14 h-9 object-cover rounded-xl bg-black border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                            <span>{item.type}</span>
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setShowHistoryDrawer(false);
                            fetchMedia(item.url);
                          }}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition"
                        >
                          Re-open
                        </button>
                        <button
                          onClick={(e) => removeFromHistory(item.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#06080e]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Vortex Downloader • Open Source Media Engine</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct MP4 Video</span>
            <span>•</span>
            <span>Lossless Audio</span>
            <span>•</span>
            <span>Captions & Subtitles</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
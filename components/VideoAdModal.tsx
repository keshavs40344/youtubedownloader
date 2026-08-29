"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Play, Volume2, VolumeX, Sparkles, ArrowRight } from "lucide-react";
import { ADS_CONFIG } from "../config/ads";

interface VideoAdModalProps {
  isOpen: boolean;
  onProceedDownload: () => void;
  onClose: () => void;
  targetTitle: string;
}

export default function VideoAdModal({
  isOpen,
  onProceedDownload,
  onClose,
  targetTitle,
}: VideoAdModalProps) {
  const [countdown, setCountdown] = useState(ADS_CONFIG.videoAds.countdownSeconds || 5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(ADS_CONFIG.videoAds.countdownSeconds || 5);
      setCanSkip(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleProceed = () => {
    if (ADS_CONFIG.videoAds.openSponsorOnDownload && ADS_CONFIG.videoAds.sponsorLink) {
      try {
        window.open(ADS_CONFIG.videoAds.sponsorLink, "_blank");
      } catch {}
    }
    onProceedDownload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#07090e] border border-white/15 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sponsored Video Ad</span>
            </span>
            <span className="text-xs text-slate-400 truncate max-w-[220px]">
              Preparing: {targetTitle}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition bg-slate-800/80 border border-white/10"
            title="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Display */}
        <div className="relative aspect-video bg-black w-full overflow-hidden border-b border-white/10 flex items-center justify-center">
          {/* Mode 1: HTML5 Direct MP4 Video Player */}
          {ADS_CONFIG.videoAds.videoType === "direct_video" && ADS_CONFIG.videoAds.directVideoUrl && (
            <>
              <video
                ref={videoRef}
                src={ADS_CONFIG.videoAds.directVideoUrl}
                autoPlay
                muted={isMuted}
                playsInline
                loop
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-3 left-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-xl border border-white/20 backdrop-blur-md transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </>
          )}

          {/* Mode 2: YouTube Embed Video Player */}
          {ADS_CONFIG.videoAds.videoType === "youtube" && ADS_CONFIG.videoAds.youtubeEmbedUrl && (
            <iframe
              src={ADS_CONFIG.videoAds.youtubeEmbedUrl}
              title="Video Advertisement"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
            />
          )}

          {/* Mode 3: Custom VAST / Ad Network HTML */}
          {ADS_CONFIG.videoAds.videoType === "custom_html" && ADS_CONFIG.videoAds.customVideoHtml && (
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: ADS_CONFIG.videoAds.customVideoHtml }}
            />
          )}

          {/* Fallback Display if no URL set */}
          {(!ADS_CONFIG.videoAds.youtubeEmbedUrl && !ADS_CONFIG.videoAds.directVideoUrl && !ADS_CONFIG.videoAds.customVideoHtml) && (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500 p-6 text-center">
              <Play className="w-12 h-12 text-indigo-400" />
              <p className="text-xs font-bold text-white">Video Ad Space Active</p>
              <p className="text-[11px] text-slate-400">Configure your video ad link in config/ads.ts</p>
            </div>
          )}

          {/* Live Countdown Badge Overlay */}
          <div className="absolute top-3 right-3 px-3.5 py-1.5 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-2xl">
            {countdown > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-mono">Unlocking in {countdown}s</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-300">Download Ready!</span>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#07090e]">
          {ADS_CONFIG.videoAds.sponsorLink && (
            <a
              href={ADS_CONFIG.videoAds.sponsorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>{ADS_CONFIG.videoAds.sponsorButtonText || "Visit Sponsor"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </a>
          )}

          <button
            onClick={handleProceed}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg ${
              canSkip
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-white shadow-emerald-600/30"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            {canSkip ? (
              <>
                <Download className="w-4 h-4" />
                <span>Start Download Now</span>
              </>
            ) : (
              <>
                <span>Skip Ad ({countdown}s)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

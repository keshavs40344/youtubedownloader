"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Download, Play, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
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

  const handleSkipOrProceed = () => {
    onProceedDownload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#07090e] border border-white/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
              Sponsored Ad
            </span>
            <span className="text-xs text-slate-400 truncate max-w-[200px]">
              Preparing: {targetTitle}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            title="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video bg-black w-full overflow-hidden border-b border-white/10">
          {ADS_CONFIG.videoAds.videoUrl ? (
            <iframe
              src={ADS_CONFIG.videoAds.videoUrl}
              title="Sponsored Video Ad"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Play className="w-10 h-10 text-indigo-400" />
              <p className="text-xs font-semibold">Video Ad Playing</p>
            </div>
          )}

          {/* Countdown Pill on top of video */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/85 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
            {countdown > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Download ready in {countdown}s</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Download Ready!</span>
              </>
            )}
          </div>
        </div>

        {/* Actions & Sponsor Link Footer */}
        <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#07090e]">
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
            onClick={handleSkipOrProceed}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg ${
              canSkip
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white shadow-emerald-600/30"
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

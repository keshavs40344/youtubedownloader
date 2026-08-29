"use client";

import React, { useEffect } from "react";
import { ADS_CONFIG } from "../config/ads";

interface AdBannerProps {
  slotId?: string;
  format?: "horizontal" | "rectangle" | "responsive";
  className?: string;
}

export default function AdBanner({
  slotId,
  format = "horizontal",
  className = "",
}: AdBannerProps) {
  const isEnabled = ADS_CONFIG.enableAds && ADS_CONFIG.bannerAds.enabled;
  const isAdSenseEnabled = ADS_CONFIG.googleAdSense.enabled;
  const publisherId = ADS_CONFIG.googleAdSense.publisherId;
  const customHtml = ADS_CONFIG.bannerAds.customBannerHtml;

  useEffect(() => {
    if (typeof window !== "undefined" && isAdSenseEnabled && publisherId) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense push error:", e);
      }
    }
  }, [isAdSenseEnabled, publisherId]);

  if (!isEnabled) return null;

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">
        Advertisement
      </span>

      <div
        className={`w-full max-w-3xl rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4 flex flex-col items-center justify-center min-h-[90px] overflow-hidden text-center relative ${
          format === "rectangle" ? "min-h-[250px] max-w-[300px]" : "min-h-[90px]"
        }`}
      >
        {isAdSenseEnabled && publisherId ? (
          // Google AdSense Mode
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={publisherId}
            data-ad-slot={slotId || ADS_CONFIG.googleAdSense.topBannerSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : customHtml ? (
          // Custom Network Banner HTML (Adsterra / PropellerAds)
          <div dangerouslySetInnerHTML={{ __html: customHtml }} />
        ) : (
          // Clean Visual Banner Space
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400 py-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/20">
                Banner Ad (728×90 / Responsive)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-md">
              Configure your Google AdSense or Adsterra scripts in <code className="text-cyan-400 font-mono">config/ads.ts</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

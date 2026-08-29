"use client";

import React, { useEffect } from "react";

interface AdBannerProps {
  slotId?: string;
  adClient?: string; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
  format?: "horizontal" | "rectangle" | "responsive";
  className?: string;
}

export default function AdBanner({
  slotId,
  adClient,
  format = "horizontal",
  className = "",
}: AdBannerProps) {
  useEffect(() => {
    // Trigger Google AdSense if scripts are present
    if (typeof window !== "undefined" && adClient && slotId) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense push error:", e);
      }
    }
  }, [adClient, slotId]);

  return (
    <div className={`w-full flex flex-col items-center justify-center my-6 ${className}`}>
      {/* Disclaimer Tag */}
      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 mb-1">
        Advertisement
      </span>

      {/* Ad Container Box */}
      <div
        className={`w-full max-w-3xl rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4 flex flex-col items-center justify-center min-h-[90px] overflow-hidden text-center relative ${
          format === "rectangle" ? "min-h-[250px] max-w-[300px]" : "min-h-[90px]"
        }`}
      >
        {adClient && slotId ? (
          // Real Google AdSense / Network Ad Script Container
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        ) : (
          // Visual Ad Placeholder when no Ad ID is configured yet
          <div className="flex flex-col items-center justify-center gap-1 text-slate-400 py-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/20">
                728 × 90 / Responsive
              </span>
              <span className="text-xs font-semibold text-slate-300">Monetization Ad Space</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-md">
              Google AdSense, Adsterra, or PropellerAds banner will display here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

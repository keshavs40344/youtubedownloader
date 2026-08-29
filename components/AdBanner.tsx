"use client";

import React, { useEffect, useRef } from "react";
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
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const isEnabled = ADS_CONFIG.enableAds && ADS_CONFIG.bannerAds.enabled;

  useEffect(() => {
    if (!isEnabled || !adContainerRef.current) return;

    const container = adContainerRef.current;
    container.innerHTML = ""; // Clear previous elements

    // Check if Adsterra Key is set
    const adsterraKey = ADS_CONFIG.bannerAds.adsterraKey || "195416b77922cf11007bab28049eeb7c";

    if (adsterraKey) {
      try {
        // Set atOptions configuration on window
        (window as any).atOptions = {
          key: adsterraKey,
          format: "iframe",
          height: 90,
          width: 728,
          params: {},
        };

        const configScript = document.createElement("script");
        configScript.type = "text/javascript";
        configScript.innerHTML = `
          atOptions = {
            'key' : '${adsterraKey}',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        `;
        container.appendChild(configScript);

        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.src = `https://www.highrevenueformat.com/${adsterraKey}/invoke.js`;
        invokeScript.async = true;
        container.appendChild(invokeScript);
      } catch (err) {
        console.warn("Adsterra script injection error:", err);
      }
    }
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1">
        Advertisement
      </span>

      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/60 p-2 flex items-center justify-center min-h-[95px] overflow-hidden text-center shadow-lg"
      >
        <div ref={adContainerRef} className="w-full flex items-center justify-center min-h-[90px]" />
      </div>
    </div>
  );
}

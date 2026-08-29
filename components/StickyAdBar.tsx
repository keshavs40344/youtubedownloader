"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { ADS_CONFIG } from "../config/ads";

export default function StickyAdBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const adRef = useRef<HTMLDivElement | null>(null);

  const isEnabled = ADS_CONFIG.enableAds && ADS_CONFIG.bannerAds.enabled;
  const adsterraKey = ADS_CONFIG.bannerAds.adsterraKey || "195416b77922cf11007bab28049eeb7c";

  useEffect(() => {
    if (!isEnabled || !adRef.current) return;

    const container = adRef.current;
    container.innerHTML = "";

    try {
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
    } catch (e) {
      console.warn("Sticky ad injection error:", e);
    }
  }, [isEnabled, adsterraKey]);

  if (!isEnabled || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      <div className="w-full max-w-4xl mx-auto px-4 pointer-events-auto">
        <div className="bg-[#07090e]/95 backdrop-blur-xl border border-white/15 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col items-center transition-all duration-300">
          {/* Top Control Bar */}
          <div className="w-full px-4 py-1 bg-slate-900/80 border-b border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="uppercase tracking-wider text-slate-500">Sponsored Advertisement</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:text-white flex items-center gap-1 transition"
                title={isMinimized ? "Expand Ad" : "Minimize Ad"}
              >
                {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{isMinimized ? "Show" : "Hide"}</span>
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="hover:text-red-400 transition ml-2"
                title="Close Ad"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ad Container */}
          {!isMinimized && (
            <div className="p-2 flex items-center justify-center min-h-[95px] w-full overflow-hidden">
              <div ref={adRef} className="w-full flex items-center justify-center min-h-[90px]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

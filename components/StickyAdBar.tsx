"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { ADS_CONFIG } from "../config/ads";

export default function StickyAdBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isEnabled = ADS_CONFIG.enableAds && ADS_CONFIG.bannerAds.enabled;
  const adsterraKey = ADS_CONFIG.bannerAds.adsterraKey || "195416b77922cf11007bab28049eeb7c";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isEnabled || !isVisible || !mounted) return null;

  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${adsterraKey}',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/${adsterraKey}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center justify-center pointer-events-none">
      <div className="w-full max-w-4xl mx-auto px-4 pointer-events-auto">
        <div className="bg-[#07090e]/95 backdrop-blur-xl border border-white/15 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col items-center transition-all duration-300">
          {/* Top Control Bar */}
          <div className="w-full px-4 py-1 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="uppercase tracking-wider text-slate-500 font-bold">Sponsored Advertisement</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:text-white flex items-center gap-1 transition px-2 py-0.5 rounded bg-white/5"
                title={isMinimized ? "Expand Ad" : "Minimize Ad"}
              >
                {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{isMinimized ? "Show" : "Hide"}</span>
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="hover:text-red-400 transition ml-2 p-0.5 rounded hover:bg-red-500/10"
                title="Close Ad"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ad Container */}
          {!isMinimized && (
            <div className="p-2 flex items-center justify-center min-h-[95px] w-full overflow-hidden">
              <iframe
                title="Sticky Bottom Adsterra Ad"
                srcDoc={iframeSrcDoc}
                width="728"
                height="90"
                className="border-0 overflow-hidden max-w-full"
                scrolling="no"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

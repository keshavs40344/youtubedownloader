"use client";

import React, { useState, useEffect } from "react";
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
  const adsterraKey = ADS_CONFIG.bannerAds.adsterraKey || "195416b77922cf11007bab28049eeb7c";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isEnabled || !mounted) return null;

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
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-1">
        Advertisement
      </span>

      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/80 p-2 flex items-center justify-center min-h-[95px] overflow-hidden text-center shadow-xl">
        <iframe
          title="Adsterra Banner Ad"
          srcDoc={iframeSrcDoc}
          width="728"
          height="90"
          className="border-0 overflow-hidden max-w-full"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        />
      </div>
    </div>
  );
}

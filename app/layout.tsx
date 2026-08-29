import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vortex Media Streamer | 4K & MP3 Downloader",
  description:
    "Ultra high-speed media stream extraction engine for YouTube videos, 4K HDR streams, and high-fidelity 320kbps MP3 audio.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b5cf6'><path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-obsidian-950 text-slate-100 antialiased min-h-screen selection:bg-brand-violet selection:text-white">
        {children}
      </body>
    </html>
  );
}

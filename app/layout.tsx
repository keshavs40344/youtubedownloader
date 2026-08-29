import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://youtubedownloader.vercel.app"),
  title: "YouTube Video & Playlist Downloader — 4K, 1080p MP4 & MP3",
  description:
    "Free online YouTube Video & Playlist Downloader. Download 4K UHD, 1080p Full HD MP4 videos with sound, lossless M4A & MP3 music tracks, and subtitles in seconds.",
  keywords: [
    "youtube downloader",
    "youtube video download",
    "youtube to mp3",
    "4k youtube downloader",
    "youtube playlist downloader",
    "download youtube shorts",
    "free youtube converter",
    "1080p youtube download with audio",
    "youtube subtitle downloader",
    "fast youtube downloader",
  ],
  authors: [{ name: "YouTube Downloader Team" }],
  creator: "YouTube Downloader",
  publisher: "YouTube Downloader",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://youtubedownloader.vercel.app",
    title: "YouTube Video & Playlist Downloader — 4K, 1080p MP4 & MP3",
    description:
      "Free online YouTube converter. Save 4K, 1080p, 720p MP4 videos with full audio, lossless M4A music, subtitles, and cover art with zero advertisements.",
    siteName: "YouTube Downloader",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Video & Playlist Downloader — 4K, 1080p MP4 & MP3",
    description:
      "Free online YouTube converter. Save 4K, 1080p, 720p MP4 videos with full audio and lossless M4A music.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "YouTube Video & Playlist Downloader",
    url: "https://youtubedownloader.vercel.app",
    description:
      "Free online YouTube Video & Playlist Downloader. Download 4K UHD, 1080p Full HD MP4 videos with audio, lossless M4A & MP3 music tracks, and subtitles in seconds.",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Windows, MacOS, Android, iOS, Linux",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "14820",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Adsterra High-CPM Social Bar / Monetization Network Tag */}
        <script
          src="https://pl31088234.profitableratecpmnetwork.com/ee/65/68/ee6568749e7a368bfbd192c105676fcc.js"
          type="text/javascript"
          async
        />
      </head>
      <body className="bg-[#07090e] text-slate-100 antialiased min-h-screen selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

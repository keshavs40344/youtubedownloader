/**
 * ==============================================================================
 * ADS & MONETIZATION MASTER CONFIGURATION
 * ==============================================================================
 */

export const ADS_CONFIG = {
  // Master Switch: Turn all ads on/off across the entire site
  enableAds: true,

  // 1. Google AdSense Settings
  googleAdSense: {
    enabled: false,
    publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
    topBannerSlot: "1234567890",
    midBannerSlot: "0987654321",
  },

  // 2. Adsterra Banner Ads (Configured & Live!)
  bannerAds: {
    enabled: true,
    adsterraKey: "195416b77922cf11007bab28049eeb7c", // Your active Adsterra 728x90 Key
  },

  // 3. High-CPM Video Ads / Interstitial Modal (Plays when user clicks Download)
  videoAds: {
    enabled: true,
    countdownSeconds: 5,
    allowSkip: true,
    
    videoType: "youtube" as "youtube" | "direct_video" | "custom_html",
    youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0",
    directVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    customVideoHtml: "",

    // Sponsor Link (Paste your Adsterra Direct SmartLink here when ready)
    sponsorLink: "https://www.highrevenueformat.com/195416b77922cf11007bab28049eeb7c/invoke.js",
    sponsorButtonText: "Visit Sponsor Website",
    openSponsorOnDownload: true,
  },
};

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

  // 2. Adsterra Banner Ads (Live & Active)
  bannerAds: {
    enabled: true,
    adsterraKey: "195416b77922cf11007bab28049eeb7c",
    directSmartLink: "https://www.profitableratecpmnetwork.com/qtx3sxjtx?key=4ea413594b87a8516acfaaa164e7b15f",
  },

  // 3. High-CPM Video Ads & SmartLink Triggers (Live & Active)
  videoAds: {
    enabled: true,
    countdownSeconds: 5,
    allowSkip: true,
    
    videoType: "youtube" as "youtube" | "direct_video" | "custom_html",
    youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0",
    directVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    customVideoHtml: "",

    // High CPM Adsterra Direct SmartLink
    sponsorLink: "https://www.profitableratecpmnetwork.com/qtx3sxjtx?key=4ea413594b87a8516acfaaa164e7b15f",
    sponsorButtonText: "Visit Sponsor Website",
    openSponsorOnDownload: true,
  },
};

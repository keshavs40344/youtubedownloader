/**
 * ==============================================================================
 * ADS & MONETIZATION MASTER CONFIGURATION
 * ==============================================================================
 * Easily configure Banner Ads, Video Ads, and Direct Links from here.
 */

export const ADS_CONFIG = {
  // Master Switch: Turn all ads on/off across the entire site
  enableAds: true,

  // 1. Google AdSense Settings
  googleAdSense: {
    enabled: false,
    publisherId: "ca-pub-XXXXXXXXXXXXXXXX", // Replace with your AdSense Publisher ID
    topBannerSlot: "1234567890",            // Top Leaderboard Slot ID
    midBannerSlot: "0987654321",            // In-Content Banner Slot ID
  },

  // 2. Banner Ads (Adsterra, PropellerAds, Monetag, or Custom HTML)
  bannerAds: {
    enabled: true,
    // Paste your Adsterra / PropellerAds Banner HTML / Script code below:
    customBannerHtml: "",
  },

  // 3. High-CPM Video Ads / Interstitial Modal (Plays when user clicks Download)
  videoAds: {
    enabled: true,                          // Set to true to show video ad before downloading
    countdownSeconds: 5,                   // Duration in seconds before download unlocks
    allowSkip: true,                       // Allow user to click skip when timer ends
    
    // Video Type: 'youtube' | 'direct_video' | 'custom_html'
    videoType: "youtube" as "youtube" | "direct_video" | "custom_html",
    
    // If videoType is 'youtube', paste the embed URL:
    youtubeEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0",
    
    // If videoType is 'direct_video', paste an MP4 URL:
    directVideoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    
    // If videoType is 'custom_html', paste your VAST / Video Ad script/iframe:
    customVideoHtml: "",

    // Sponsor Link (e.g. Monetag Direct Link / Adsterra SmartLink / Sponsor Website)
    sponsorLink: "https://google.com",
    sponsorButtonText: "Visit Sponsor Website",
    
    // Open sponsor link in new tab when download starts (Maximizes Earning):
    openSponsorOnDownload: true,
  },
};

/**
 * ==============================================================================
 * ADS & MONETIZATION CONFIGURATION
 * ==============================================================================
 * You can easily turn ads ON/OFF, add Google AdSense, Adsterra, PropellerAds,
 * or custom Video & Banner ads from this single file.
 */

export const ADS_CONFIG = {
  // Master Switch: Set to true to enable ads across the entire site
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
    // Custom HTML or Script tag (leave empty for default banner slot)
    customBannerHtml: "",
  },

  // 3. High-CPM Video / Interstitial Ad (Plays when user clicks Download)
  videoAds: {
    enabled: true,                          // Set to true to show ad before downloading
    countdownSeconds: 5,                   // Number of seconds before download starts
    allowSkip: true,                       // Allow user to skip after countdown
    title: "Sponsored Video Ad",
    // You can paste a YouTube video ID, direct MP4 video link, or ad network iframe
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0",
    sponsorLink: "https://google.com",
    sponsorButtonText: "Visit Sponsor Website",
  },
};

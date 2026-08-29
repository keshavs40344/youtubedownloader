/**
 * ADS & MONETIZATION MASTER CONFIGURATION
 * All ads disabled as requested.
 */

export const ADS_CONFIG = {
  enableAds: false,

  googleAdSense: {
    enabled: false,
    publisherId: "",
    topBannerSlot: "",
    midBannerSlot: "",
  },

  bannerAds: {
    enabled: false,
    adsterraKey: "",
    directSmartLink: "",
  },

  videoAds: {
    enabled: false,
    countdownSeconds: 0,
    allowSkip: true,
    videoType: "youtube" as "youtube" | "direct_video" | "custom_html",
    youtubeEmbedUrl: "",
    directVideoUrl: "",
    customVideoHtml: "",
    sponsorLink: "",
    sponsorButtonText: "",
    openSponsorOnDownload: false,
  },
};

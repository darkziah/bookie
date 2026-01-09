export default {
  providers: [
    {
      // If CONVEX_SITE_URL is not set, we fall back to the provided site URL.
      // In production, you MUST set CONVEX_SITE_URL in the Convex Dashboard.
      domain: process.env.CONVEX_SITE_URL ?? "https://polite-sturgeon-897.convex.site",
      applicationID: "convex",
    },
  ],
};


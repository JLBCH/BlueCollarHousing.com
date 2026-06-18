import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos are remote (placeholder host now, real landlord photo
    // host(s) later). next/image resizes them and serves WebP/AVIF so phones
    // on slow connections don't download full-size originals.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;

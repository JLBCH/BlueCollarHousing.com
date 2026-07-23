import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The pre-rebuild site was PHP; Bing/DuckDuckGo still index its URLs as
    // sitelinks ("Home", "Find a Place To Stay", "Landlords"), which land on
    // error pages here. Map the known ones to their new homes, then sweep any
    // other .php stragglers to the homepage. Permanent (308) so search engines
    // update their index.
    return [
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/home.php", destination: "/", permanent: true },
      { source: "/terms.php", destination: "/terms", permanent: true },
      { source: "/landlords.php", destination: "/landlords", permanent: true },
      { source: "/list_your_property.php", destination: "/list-your-property", permanent: true },
      { source: "/contact.php", destination: "/contact", permanent: true },
      { source: "/faq.php", destination: "/worker-faq", permanent: true },
      { source: "/rentals.php", destination: "/search", permanent: true },
      { source: "/properties.php", destination: "/search", permanent: true },
      { source: "/listings.php", destination: "/search", permanent: true },
      { source: "/search.php", destination: "/search", permanent: true },
      { source: "/login.php", destination: "/login", permanent: true },
      { source: "/signup.php", destination: "/register", permanent: true },
      // Old forgot/reset-password URLs (a DDG sitelink still points at one).
      { source: "/forgot_password.php", destination: "/forgot-password", permanent: true },
      { source: "/forgotpassword.php", destination: "/forgot-password", permanent: true },
      { source: "/reset_password.php", destination: "/forgot-password", permanent: true },
      { source: "/password.php", destination: "/forgot-password", permanent: true },
      // Catch-all for any other legacy .php URL still in a search index.
      { source: "/:path(.*\\.php)", destination: "/", permanent: true },
    ];
  },
  images: {
    // Listing photos are remote (placeholder host now, real landlord photo
    // host(s) later). next/image resizes them and serves WebP/AVIF so phones
    // on slow connections don't download full-size originals.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Supabase Storage (uploaded listing photos).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;

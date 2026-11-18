import type { NextConfig } from "next";

const privatePageHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/portal/:path*", headers: privatePageHeaders },
      { source: "/intake/:path*", headers: privatePageHeaders },
      { source: "/api/portal/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/intake/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;

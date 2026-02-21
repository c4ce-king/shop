import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ✅ dozvoli dev origin-e koje koristiš (localhost, 127.0.0.1 i LAN)
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.10.79:3000",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;

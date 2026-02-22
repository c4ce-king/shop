/** @type {import('next').NextConfig} */
function stripTrailingSlash(s) {
  return typeof s === "string" ? s.replace(/\/+$/, "") : s;
}

const backend = stripTrailingSlash(process.env.BACKEND_URL || "http://127.0.0.1:8000");

const nextConfig = {
  reactStrictMode: true,

  // ✅ Fix za: Blocked cross-origin request from 127.0.0.1 to /_next/*
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.10.79:3000",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
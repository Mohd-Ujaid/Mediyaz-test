import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.6",
    "192.168.1.6:3000",
    "192.168.1.6:3001",
    "192.168.1.6:3002",
    "192.168.1.60",
    "192.168.1.60:3000",
    "localhost",
    "localhost:3000",
    "localhost:3001",
    "localhost:3002",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "worker-src 'self' blob: data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' blob: data: https://images.unsplash.com https://ik.imagekit.io https://*.imagekit.io",
      "font-src 'self' https://fonts.gstatic.com data: blob:",
      "connect-src 'self' blob: data: https://ik.imagekit.io https://*.imagekit.io https://fonts.googleapis.com https://fonts.gstatic.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/admin/:path*",
        destination: "/:path*",
      },
    ];
  },
};

export default nextConfig;

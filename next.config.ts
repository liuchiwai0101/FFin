import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        output: "standalone",
        experimental: {
          proxyClientMaxBodySize: "10mb",
        },
      }),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  async headers() {
    if (staticExport) return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGIN || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-FFin-User-Id",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

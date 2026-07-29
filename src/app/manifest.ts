import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reading Track",
    short_name: "Reading Track",
    description: "個人書籍與文章追蹤",
    start_url: "/books",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#ffffff",
    lang: "zh-Hant",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

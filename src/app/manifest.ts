import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Bubblewrap 打包 TWA 時會以 id 認這個 app，之後不要再改
    id: "/books",
    name: "ReadingTrack",
    short_name: "ReadingTrack",
    description: "個人書籍與文章追蹤",
    start_url: "/books",
    // scope 決定哪些網址算「app 內」；超出範圍會跳出瀏覽器
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    categories: ["books", "productivity", "lifestyle"],
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#ffffff",
    lang: "zh-Hant",
    // Android 長按圖示會出現的捷徑
    shortcuts: [
      { name: "新增書籍", short_name: "新增", url: "/books/new" },
      { name: "閱讀統計", short_name: "統計", url: "/stats" },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

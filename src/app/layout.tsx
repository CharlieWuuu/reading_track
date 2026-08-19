import type { Metadata, Viewport } from "next";
import { Geist_Mono, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import { COMMIT_HOOK_INSTALLER } from "react-component-overlay";
import { AppShell } from "@/components/layout/AppShell";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";
import { SWRProvider } from "@/components/layout/SWRProvider";
import { AuthButton } from "@/features/auth/components/auth-button";
import { SessionProvider } from "@/features/auth/components/session-provider";
import { DebugSetup } from "./DebugSetup";

// 全站用明體：Noto Serif TC 帶正體中文字面，latin 由同一家族的西文補上
const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadingTrack",
  description: "個人書籍與文章追蹤",
  appleWebApp: {
    capable: true,
    title: "ReadingTrack",
    statusBarStyle: "default",
  },
  // 圖示都放 public/，這裡宣告；PNG 是給不吃 SVG 的舊瀏覽器的後備
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* render 計數的掛鉤要早於所有 bundle，所以直接寫在 head */}
      <head>
        {process.env.NODE_ENV === "development" && (
          <script dangerouslySetInnerHTML={{ __html: COMMIT_HOOK_INSTALLER }} />
        )}
      </head>
      <body className="flex h-full bg-gray-50 text-gray-900">
        <SessionProvider>
          <SWRProvider>
            <DebugSetup>
              <AppShell authSlot={<AuthButton />}>{children}</AppShell>
            </DebugSetup>
            <ServiceWorkerRegistrar />
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

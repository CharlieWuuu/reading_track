import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { COMMIT_HOOK_INSTALLER } from "react-component-overlay";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import { LockZoomInStandalone } from "@/components/layout/LockZoomInStandalone";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";
import { SWRProvider } from "@/components/layout/SWRProvider";
import { DebugSetup } from "./DebugSetup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
              <AppShell>{children}</AppShell>
            </DebugSetup>
            <ServiceWorkerRegistrar />
            <LockZoomInStandalone />
          </SWRProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

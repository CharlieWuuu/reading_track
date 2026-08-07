"use client";

import dynamic from "next/dynamic";

/** 動態載入才不會把疊層打包進正式版；正式版這個 chunk 永遠不會被請求 */
const DebugTools = dynamic(() => import("./DebugTools"), { ssr: false });

/** 開發時按 Shift+D 打開元件疊層 */
export function DebugSetup({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") return <>{children}</>;
  return <DebugTools>{children}</DebugTools>;
}

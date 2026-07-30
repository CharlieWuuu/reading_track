import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // 版本號以 package.json 為單一來源，避免 Android 端與網頁端各報各的
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
};

export default nextConfig;

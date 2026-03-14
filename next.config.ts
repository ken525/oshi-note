import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopackを無効化（next-pwaとの互換性のため）
  // 空のturbopack設定を追加してエラーを回避
  turbopack: {},
  // 型チェックをスキップ（ビルド時のみ）
  typescript: {
    ignoreBuildErrors: true,
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // 開発環境では無効化
});

export default pwaConfig(nextConfig);

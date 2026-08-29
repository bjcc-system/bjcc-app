import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  transpilePackages: ["@ionic/react", "@ionic/core", "ionicons"],
  turbopack: {}, // Silences the turbopack/webpack error in Next 16
  devIndicators: false
};

export default withSerwist(nextConfig);

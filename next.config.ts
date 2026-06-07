import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import type { NextConfig } from "next";

if (process.env.NODE_ENV === "development") {
  setupDevPlatform().catch((err) => console.error(err));
}

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;

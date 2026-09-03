import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone only when not on Vercel (e.g. for self-hosting / Docker)
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;

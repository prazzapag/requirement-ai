import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@inngest/agent-kit", "inngest"],
  /* config options here */
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: "3mb",
  //   },
  // },
};

export default nextConfig;
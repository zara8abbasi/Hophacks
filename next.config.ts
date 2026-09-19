import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preview and automated tests often hit 127.0.0.1; without this, Turbopack dev
  // blocks HMR/RSC client bootstrap and client components never hydrate.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;

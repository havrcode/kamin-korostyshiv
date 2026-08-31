import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public site is generated as ordinary static files. Cloudflare serves
  // these files directly; a separate Worker will later own only /api/* and
  // protected admin operations.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;

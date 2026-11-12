import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/run-lab/[[...asset]]": ["./src/run-lab-ui/**/*"],
    "/run-lab/*": ["./src/run-lab-ui/**/*"],
  },
};

export default nextConfig;

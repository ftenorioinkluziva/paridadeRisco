/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    // Temporarily disable for initial setup
    // typedRoutes: true,
  },
  // Output standalone para Docker
  output: 'standalone',
  // Disable ESLint during builds (run linting separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during builds (already checked in dev)
  typescript: {
    ignoreBuildErrors: false, // Keep this enabled to catch TypeScript errors
  },
};

export default config;
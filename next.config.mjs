/** @type {import('next').NextConfig} */
const nextConfig = {
  // Overridable so CI/verification builds don't fight the dev server
  // for .next file locks (Windows holds exclusive handles on .next/trace).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;

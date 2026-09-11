/** @type {import('next').NextConfig} */
const nextConfig = {
  // The self-hosted Docker build sets this to get a self-contained server.js.
  // Left unset everywhere else, so the Vercel build is unchanged.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
};
export default nextConfig;

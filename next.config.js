/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Old names -> the one real file
      { source: "/downloads/KnightAC.exe", destination: "/downloads/KnightRoot.exe" },
      { source: "/downloads/Knight.exe", destination: "/downloads/KnightRoot.exe" }
    ];
  }
};
module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Alternate exe names all serve the same real file (so /downloads/KnightRoot.exe works)
      { source: "/downloads/Knight.exe", destination: "/downloads/KnightAC.exe" },
      { source: "/downloads/KnightRoot.exe", destination: "/downloads/KnightAC.exe" }
    ];
  }
};
module.exports = nextConfig;

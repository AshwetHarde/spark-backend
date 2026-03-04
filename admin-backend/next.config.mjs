/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;

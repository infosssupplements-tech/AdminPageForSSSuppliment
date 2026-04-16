/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/admin-api/:path*",
        destination: "http://127.0.0.1:8000/admin-api/:path*",
      },
    ]
  },
}

export default nextConfig

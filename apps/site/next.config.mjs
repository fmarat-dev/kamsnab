/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kamsnab/ui", "@kamsnab/api-client"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost"
      },
      {
        protocol: "https",
        hostname: "cms.kamsnab.ru"
      }
    ]
  }
};

export default nextConfig;

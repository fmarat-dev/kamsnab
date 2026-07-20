import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Монорепо: standalone-трейсинг должен видеть packages/* в корне репо, а не
  // только apps/site — иначе в собранный образ не попадут файлы @kamsnab/ui и
  // @kamsnab/api-client.
  outputFileTracingRoot: path.join(__dirname, "../.."),
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

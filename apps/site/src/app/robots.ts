import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Персональные страницы без своего контента — крауту там нечего индексировать.
      disallow: ["/favorites", "/compare"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}

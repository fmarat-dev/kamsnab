import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // /favorites и /compare не закрываем: там meta robots noindex (их layout.tsx),
      // а Disallow помешал бы краулеру его увидеть.
      allow: "/"
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}

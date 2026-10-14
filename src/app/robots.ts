// app/robots.ts → /robots.txt

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/tracks/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/status"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

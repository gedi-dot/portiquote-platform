import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI answer engines are welcome on the public site — being cited in an
      // assistant's answer is a discovery channel, not a threat. Private areas
      // stay excluded for them exactly as for everyone else.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "PerplexityBot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/messages",
          "/admin",
          "/upgrade",
          "/auth/",
          "/rfq/",
        ],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/messages",
          "/admin",
          "/upgrade",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/rfq/",
          "/forwarders/new",
          "/*/edit",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spark-anitaxu716.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/auth/sign-up"],
      disallow: [
        "/account-status",
        "/admin",
        "/discover",
        "/moderation",
        "/notifications",
        "/onboarding",
        "/people",
        "/profile",
        "/requests",
        "/settings",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

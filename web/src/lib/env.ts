export interface SupabaseConfig {
  url: string;
  publishableKey: string;
  siteUrl: string;
}

export class ConfigurationError extends Error {
  constructor() {
    super("Spark is not connected to Supabase. Add the required environment variables and restart the application.");
    this.name = "ConfigurationError";
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  if (!url || !publishableKey) return null;

  try {
    const parsedUrl = new URL(url);
    const parsedSiteUrl = new URL(siteUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol) || !["http:", "https:"].includes(parsedSiteUrl.protocol)) {
      return null;
    }
  } catch {
    return null;
  }

  return { url, publishableKey, siteUrl };
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) throw new ConfigurationError();
  return config;
}

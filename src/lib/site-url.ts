const DEFAULT_SITE_URL = "http://localhost:3001";

export function normalizeSiteUrl(value: string | undefined, fallback = DEFAULT_SITE_URL) {
  const candidate = value?.trim();
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function getSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export type SocialPlatformId = "facebook" | "instagram" | "tiktok" | "youtube" | "x" | "external";

export type SocialPlatform = {
  id: SocialPlatformId;
  label: string;
};

const platformMatchers: Array<{ id: SocialPlatformId; label: string; patterns: RegExp[] }> = [
  { id: "facebook", label: "Facebook", patterns: [/facebook/i, /fb\.com/i] },
  { id: "instagram", label: "Instagram", patterns: [/instagram/i] },
  { id: "tiktok", label: "TikTok", patterns: [/tiktok/i] },
  { id: "youtube", label: "YouTube", patterns: [/youtube/i, /youtu\.be/i] },
  { id: "x", label: "X", patterns: [/\bx\b/i, /twitter/i] }
];

export function getSocialPlatform(label: string, href: string): SocialPlatform {
  const haystack = `${label} ${href}`;
  const match = platformMatchers.find((platform) =>
    platform.patterns.some((pattern) => pattern.test(haystack))
  );

  if (match) {
    return {
      id: match.id,
      label: match.label
    };
  }

  return {
    id: "external",
    label: titleCase(label)
  };
}

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

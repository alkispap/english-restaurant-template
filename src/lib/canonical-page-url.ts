export function canonicalPagePath(path: string) {
  const match = path.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] || "/";
  const suffix = match?.[2] || "";
  const normalizedPathname = `/${pathname.replace(/^\/+|\/+$/g, "")}`;

  return `${normalizedPathname === "/" ? "/" : `${normalizedPathname}/`}${suffix}`;
}

export function canonicalPageUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, "");
  const canonicalPath = canonicalPagePath(path);

  return canonicalPath === "/" ? base : `${base}${canonicalPath}`;
}

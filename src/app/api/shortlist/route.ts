import { NextResponse } from "next/server";
import { listings } from "@/data/listings";
import { getShortlistListingSummaries } from "@/lib/shortlist";

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const slugs = Array.isArray(body?.slugs)
    ? body.slugs.filter((slug: unknown): slug is string => typeof slug === "string")
    : [];

  return NextResponse.json({
    listings: getShortlistListingSummaries(slugs, listings)
  });
}

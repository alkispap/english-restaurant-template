import packedSearchIndexData from "../../../data/listing-search-index.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(packedSearchIndexData);
}

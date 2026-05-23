import Supercluster from "supercluster";
import type { BBox, Feature, Point } from "geojson";
import type { MapPoint } from "@/lib/listings-page";

export const MAX_VISIBLE_MAP_MARKERS = 250;

type ListingProperties = {
  cluster?: false;
  listing: MapPoint;
};

type ClusterProperties = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string | number;
};

type MarkerProperties = ListingProperties | ClusterProperties;

export type MapClusterIndex = Supercluster<ListingProperties, ClusterProperties>;

export type VisibleMapItem =
  | {
      kind: "listing";
      listing: MapPoint;
      latitude: number;
      longitude: number;
    }
  | {
      kind: "cluster";
      id: number;
      count: number;
      latitude: number;
      longitude: number;
    };

export function createMapClusterIndex(points: MapPoint[]) {
  const index = new Supercluster<ListingProperties, ClusterProperties>({
    radius: 72,
    maxZoom: 17
  });

  index.load(points.map(mapPointToFeature));
  return index;
}

export function getVisibleMapItems(index: MapClusterIndex, bounds: BBox, zoom: number): VisibleMapItem[] {
  const items = index.getClusters(bounds, Math.round(zoom)).map(featureToVisibleItem);

  if (items.length <= MAX_VISIBLE_MAP_MARKERS) return items;

  return items
    .sort((a, b) => itemPriority(b) - itemPriority(a))
    .slice(0, MAX_VISIBLE_MAP_MARKERS);
}

export function getClusterExpansionZoom(index: MapClusterIndex, clusterId: number) {
  return index.getClusterExpansionZoom(clusterId);
}

function mapPointToFeature(point: MapPoint): Feature<Point, ListingProperties> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [point.longitude, point.latitude]
    },
    properties: {
      cluster: false,
      listing: point
    }
  };
}

function featureToVisibleItem(feature: Feature<Point, MarkerProperties>): VisibleMapItem {
  const [longitude, latitude] = feature.geometry.coordinates;
  const properties = feature.properties;

  if (properties.cluster) {
    return {
      kind: "cluster",
      id: properties.cluster_id,
      count: properties.point_count,
      latitude,
      longitude
    };
  }

  return {
    kind: "listing",
    listing: properties.listing,
    latitude,
    longitude
  };
}

function itemPriority(item: VisibleMapItem) {
  if (item.kind === "cluster") return 1_000_000 + item.count;
  return Number(item.listing.rating ?? 0) * 10_000 + Number(item.listing.reviewCount ?? 0);
}

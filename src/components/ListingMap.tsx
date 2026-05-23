"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createMapClusterIndex,
  getClusterExpansionZoom,
  getVisibleMapItems,
  type VisibleMapItem
} from "@/lib/map-density";
import type { MapPoint } from "@/lib/listings-page";
import { listingDetailPath } from "@/lib/routes";

type ListingMapProps = {
  listings: MapPoint[];
};

export function ListingMap({ listings }: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const mapKey = useMemo(
    () => listings.map((listing) => `${listing.slug}:${listing.latitude},${listing.longitude}`).join("|"),
    [listings]
  );

  useEffect(() => {
    if (!mapRef.current || !listings.length) return;

    let map: L.Map | null = null;
    let markerLayer: L.LayerGroup | null = null;
    let isMounted = true;
    setLoaded(false);

    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current) return;

      const container = mapRef.current as HTMLDivElement & { _leaflet_id?: number | null };
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });

      const latitudes = listings.map((listing) => listing.latitude);
      const longitudes = listings.map((listing) => listing.longitude);
      const centerLat = latitudes.reduce((sum, latitude) => sum + latitude, 0) / latitudes.length;
      const centerLng = longitudes.reduce((sum, longitude) => sum + longitude, 0) / longitudes.length;

      map = L.map(mapRef.current, {
        scrollWheelZoom: false
      }).setView([centerLat, centerLng], 13);
      markerLayer = L.layerGroup().addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const index = createMapClusterIndex(listings);
      const renderVisibleMarkers = () => {
        if (!map || !markerLayer) return;
        const bounds = map.getBounds();
        const items = getVisibleMapItems(
          index,
          [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
          map.getZoom()
        );

        markerLayer.clearLayers();
        items.forEach((item) => {
          markerLayer?.addLayer(createMarker(L, item, index, map!));
        });
      };

      if (listings.length > 1) {
        const group = L.featureGroup(
          listings.map((listing) => L.marker([listing.latitude, listing.longitude]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }

      renderVisibleMarkers();
      map.on("moveend zoomend", renderVisibleMarkers);
      setLoaded(true);
    });

    return () => {
      isMounted = false;
      if (map) {
        map.off();
        markerLayer?.clearLayers();
        map.remove();
        map = null;
        markerLayer = null;
      }
    };
  }, [listings, mapKey]);

  if (!listings.length) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-lg border border-dashed border-line bg-white text-muted">
        No listings with map coordinates to display.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line shadow-soft">
      <div ref={mapRef} className="h-[500px] w-full lg:h-[600px]" style={{ zIndex: 0 }} />
      {!loaded ? (
        <div className="flex items-center justify-center bg-slate-50 p-4 text-sm text-muted">
          Loading map...
        </div>
      ) : null}
    </div>
  );
}

function createMarker(
  L: typeof import("leaflet"),
  item: VisibleMapItem,
  index: ReturnType<typeof createMapClusterIndex>,
  map: L.Map
) {
  if (item.kind === "cluster") {
    return L.marker([item.latitude, item.longitude], {
      icon: L.divIcon({
        className: "directory-map-cluster",
        html: `<span>${item.count.toLocaleString()}</span>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      })
    }).on("click", () => {
      map.setView([item.latitude, item.longitude], getClusterExpansionZoom(index, item.id), {
        animate: true
      });
    });
  }

  return L.marker([item.latitude, item.longitude]).bindPopup(buildPopupElement(item.listing));
}

function buildPopupElement(listing: MapPoint) {
  const wrapper = document.createElement("div");
  wrapper.style.minWidth = "180px";
  wrapper.style.maxWidth = "260px";
  wrapper.style.fontFamily = "system-ui,-apple-system,sans-serif";
  wrapper.style.color = "var(--color-ink)";

  const href = listingDetailPath(listing.slug);
  const title = document.createElement("a");
  title.href = href;
  title.textContent = listing.name;
  title.style.fontWeight = "700";
  title.style.fontSize = "15px";
  title.style.color = "var(--color-ink)";
  title.style.textDecoration = "none";
  title.style.display = "block";
  wrapper.appendChild(title);

  if (listing.rating) {
    const rating = document.createElement("div");
    rating.style.display = "flex";
    rating.style.alignItems = "center";
    rating.style.gap = "4px";
    rating.style.marginTop = "4px";
    rating.style.fontSize = "13px";
    rating.style.color = "var(--color-muted)";
    rating.textContent = listing.reviewCount
      ? `Rating ${listing.rating.toFixed(1)} (${listing.reviewCount.toLocaleString()})`
      : `Rating ${listing.rating.toFixed(1)}`;
    wrapper.appendChild(rating);
  }

  if (listing.categories.length) {
    const categories = document.createElement("div");
    categories.style.marginTop = "6px";
    categories.style.fontSize = "12px";
    categories.style.color = "var(--color-muted)";
    categories.textContent = listing.categories.slice(0, 2).join(", ");
    wrapper.appendChild(categories);
  }

  if (listing.area) {
    const area = document.createElement("div");
    area.style.fontSize = "12px";
    area.style.color = "var(--color-muted)";
    area.style.marginTop = "2px";
    area.textContent = listing.area;
    wrapper.appendChild(area);
  }

  const details = document.createElement("a");
  details.href = href;
  details.textContent = "View details ->";
  details.style.display = "inline-block";
  details.style.marginTop = "8px";
  details.style.padding = "5px 12px";
  details.style.background = "#e67e22";
  details.style.color = "#fff";
  details.style.borderRadius = "6px";
  details.style.fontSize = "12px";
  details.style.fontWeight = "700";
  details.style.textDecoration = "none";
  wrapper.appendChild(details);

  return wrapper;
}

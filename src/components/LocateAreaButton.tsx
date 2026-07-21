"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { directoryConfig } from "@/config/directory";
import { nearestAreaFromCoordinates, type AreaCentroid } from "@/lib/geo-area";
import { directorySearchPath } from "@/lib/routes";
import { buildSearchHref } from "@/lib/search-url";

type LocateAreaButtonProps = {
  areaCentroids: AreaCentroid[];
  basePath?: string;
};

type LocateStatus = "idle" | "locating" | "denied" | "unavailable" | "not-found";

export function LocateAreaButton({ areaCentroids, basePath = directorySearchPath() }: LocateAreaButtonProps) {
  const [locateStatus, setLocateStatus] = useState<LocateStatus>("idle");

  function findListingsNearUser() {
    if (!navigator.geolocation) {
      setLocateStatus("unavailable");
      return;
    }

    setLocateStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nearestAreaFromCoordinates(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          areaCentroids
        );

        if (!nearest) {
          setLocateStatus("not-found");
          return;
        }

        window.location.assign(
          buildSearchHref({
            q: "",
            area: nearest.slug
          }, basePath)
        );
      },
      (error) => {
        setLocateStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 10000
      }
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={findListingsNearUser}
        disabled={locateStatus === "locating"}
        className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-bold text-ink transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:text-muted"
      >
        <LocateFixed className="h-4 w-4 text-primary" aria-hidden />
        {locateStatus === "locating"
          ? "Finding your area..."
          : `Find ${directoryConfig.listingPluralLabel.toLowerCase()} near you`}
      </button>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={locateStatus !== "idle" && locateStatus !== "locating" ? "text-sm font-semibold text-muted" : "sr-only"}
      >
        {locateStatus === "locating"
          ? "Finding your area."
          : locateStatus === "idle"
            ? ""
            : locateStatusMessage[locateStatus]}
      </p>
    </div>
  );
}

const locateStatusMessage: Record<Exclude<LocateStatus, "idle" | "locating">, string> = {
  denied: "Location permission was blocked. Choose an area from the list instead.",
  unavailable: "Your browser could not get your location. Choose an area from the list instead.",
  "not-found": "I could not match your location to a directory area yet."
};

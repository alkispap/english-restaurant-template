"use client";

import type { FormEvent } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { directoryConfig } from "@/config/directory";
import { siteConfig } from "@/config/site";
import { directorySearchPath } from "@/lib/routes";
import { buildSearchHref } from "@/lib/search-url";
import { nearestAreaFromCoordinates, type AreaCentroid } from "@/lib/geo-area";
import { useState } from "react";

type AreaOption = {
  label: string;
  value: string;
};

type SearchBarClientProps = {
  compact?: boolean;
  defaultQuery?: string;
  defaultArea?: string;
  basePath?: string;
  areas: AreaOption[];
  areaCentroids: AreaCentroid[];
  hideAreaChoice?: boolean;
};

type LocateStatus = "idle" | "locating" | "denied" | "unavailable" | "not-found";

export function SearchBarClient({
  compact = false,
  defaultQuery = "",
  defaultArea = "",
  basePath = directorySearchPath(),
  areas,
  areaCentroids,
  hideAreaChoice = false
}: SearchBarClientProps) {
  const [locateStatus, setLocateStatus] = useState<LocateStatus>("idle");
  const gridClass = hideAreaChoice
    ? "md:grid-cols-[1fr_auto]"
    : compact
      ? "md:grid-cols-[1fr_180px_auto]"
      : "md:grid-cols-[1fr_220px_auto]";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    window.location.assign(
      buildSearchHref({
        q: String(formData.get("q") ?? ""),
        area: String(formData.get("area") ?? "")
      }, basePath)
    );
  }

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
    <div className="rounded-lg bg-white p-3 shadow-soft">
      <form
        action={basePath}
        onSubmit={handleSubmit}
        className={`grid gap-3 ${gridClass}`}
      >
        <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
          <Search className="h-5 w-5 text-primary" aria-hidden />
          <span className="sr-only">Search keywords</span>
          <input
            name="q"
            defaultValue={defaultQuery}
            placeholder={`${directoryConfig.listingLabel}, category, keyword...`}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        {hideAreaChoice ? null : (
          <label className="flex items-center gap-3 rounded-md border border-line px-4 py-3">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            <span className="sr-only">Choose area</span>
            <select name="area" defaultValue={defaultArea} className="w-full bg-transparent text-sm text-ink outline-none">
              <option value="">All {siteConfig.cityOrRegion}</option>
              {areas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="focus-ring rounded-md bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-800">
          Search
        </button>
      </form>
      {hideAreaChoice ? null : (
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
      )}
    </div>
  );
}

const locateStatusMessage: Record<Exclude<LocateStatus, "idle" | "locating">, string> = {
  denied: "Location permission was blocked. Choose an area from the list instead.",
  unavailable: "Your browser could not get your location. Choose an area from the list instead.",
  "not-found": "I could not match your location to a directory area yet."
};

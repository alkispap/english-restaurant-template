"use client";

import { useEffect, useState } from "react";
import type { OpeningHours } from "@/data/listings";
import { openingHoursDayIndex } from "@/lib/opening-hours";

type OpeningHoursListProps = {
  workingHours?: OpeningHours[];
};

export function OpeningHoursList({ workingHours }: OpeningHoursListProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);

  useEffect(() => {
    function updateCurrentDay() {
      setCurrentDayIndex(new Date().getDay());
    }

    updateCurrentDay();
    const interval = setInterval(updateCurrentDay, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!workingHours?.length) return null;

  return (
    <div className="mt-4 space-y-2">
      {workingHours.map((item) => {
        const isToday = currentDayIndex !== null && openingHoursDayIndex(item.day) === currentDayIndex;

        return (
          <div
            key={item.day}
            className={
              isToday
                ? "flex justify-between gap-4 rounded-md border border-primary bg-orange-50 px-3 py-2 text-sm shadow-sm"
                : "flex justify-between gap-4 px-3 py-1.5 text-sm"
            }
            aria-current={isToday ? "date" : undefined}
          >
            <span className="font-bold text-ink">
              {item.day}
              {isToday ? <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">Today</span> : null}
            </span>
            <span className={isToday ? "font-bold text-accent" : "text-muted"}>{item.hours}</span>
          </div>
        );
      })}
    </div>
  );
}

import type { OpeningHours } from "@/data/listings";

type TimeRange = { open: number; close: number };

type OpenStatusResult = {
  isOpen: boolean;
  label: string;
};

const dayIndexMap: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
  // Greek day names
  κυριακή: 0, κυριακη: 0,
  δευτέρα: 1, δευτερα: 1,
  τρίτη: 2, τριτη: 2,
  τετάρτη: 3, τεταρτη: 3,
  πέμπτη: 4, πεμπτη: 4,
  παρασκευή: 5, παρασκευη: 5,
  σάββατο: 6, σαββατο: 6,
};

/**
 * Determine whether a listing is currently open based on its working hours.
 */
export function isOpenNow(workingHours?: OpeningHours[], now?: Date): boolean {
  if (!workingHours?.length) return false;
  return openStatus(workingHours, now).isOpen;
}

/**
 * Return a human-friendly open/closed status with a descriptive label.
 *
 * Examples:
 *  - { isOpen: true, label: "Open · Closes at 6:00 PM" }
 *  - { isOpen: false, label: "Closed · Opens at 9:00 AM" }
 *  - { isOpen: true, label: "Open 24 hours" }
 */
export function openStatus(workingHours?: OpeningHours[], now?: Date): OpenStatusResult {
  if (!workingHours?.length) return { isOpen: false, label: "Hours unknown" };

  const current = now ?? new Date();
  const dayIndex = current.getDay();
  const minutesSinceMidnight = current.getHours() * 60 + current.getMinutes();

  const yesterdayIndex = (dayIndex + 6) % 7;
  const yesterdayEntry = workingHours.find((entry) => parseDayIndex(entry.day) === yesterdayIndex);
  const todayEntry = workingHours.find((entry) => parseDayIndex(entry.day) === dayIndex);

  // 1. Check if we are in yesterday's overflow (e.g., Tuesday 1:00 AM)
  if (yesterdayEntry && !isClosed(yesterdayEntry.hours)) {
    const ranges = parseTimeRanges(yesterdayEntry.hours);
    for (const range of ranges) {
      const isOvernight = range.close < range.open;
      if (isOvernight && minutesSinceMidnight < range.close) {
        return { isOpen: true, label: `Open · Closes at ${formatMinutes(range.close)}` };
      }
    }
  }

  // 2. Check today's ranges
  if (!todayEntry || isClosed(todayEntry.hours)) {
    const nextOpen = findNextOpenDay(workingHours, dayIndex);
    return { isOpen: false, label: nextOpen ? `Closed · Opens ${nextOpen}` : "Closed today" };
  }

  if (is24Hours(todayEntry.hours)) {
    return { isOpen: true, label: "Open 24 hours" };
  }

  const ranges = parseTimeRanges(todayEntry.hours);
  for (const range of ranges) {
    const isOvernight = range.close < range.open;
    const isOpenNow = isOvernight 
      ? minutesSinceMidnight >= range.open 
      : (minutesSinceMidnight >= range.open && minutesSinceMidnight < range.close);

    if (isOpenNow) {
      const closesAt = formatMinutes(range.close);
      const closeTotal = isOvernight ? range.close + 1440 : range.close;
      const minutesUntilClose = closeTotal - minutesSinceMidnight;
      
      if (minutesUntilClose <= 30) {
        return { isOpen: true, label: `Open · Closes soon (${closesAt})` };
      }
      return { isOpen: true, label: `Open · Closes at ${closesAt}` };
    }
  }

  // 3. Currently closed, find next opening
  const nextRangeToday = ranges.find((range) => range.open > minutesSinceMidnight);
  if (nextRangeToday) {
    return { isOpen: false, label: `Closed · Opens at ${formatMinutes(nextRangeToday.open)}` };
  }

  const nextOpenDay = findNextOpenDay(workingHours, dayIndex);
  return { isOpen: false, label: nextOpenDay ? `Closed · Opens ${nextOpenDay}` : "Closed" };
}

export function openingHoursDayIndex(day: string): number | undefined {
  return parseDayIndex(day);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseDayIndex(day: string): number | undefined {
  const normalized = day
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return dayIndexMap[normalized];
}

function isClosed(hours: string): boolean {
  const lower = hours.toLowerCase().trim();
  return /^(closed|κλειστ[αά]|fermé|geschlossen|cerrado|chiuso)$/i.test(lower);
}

function is24Hours(hours: string): boolean {
  return /24\s*(hours|ώρες|ωρες|hrs?|h)/i.test(hours) || /^open\s*24/i.test(hours) || /ανοι[χκ]τ[οό]\s*24/i.test(hours);
}

/**
 * Parse hours strings like:
 *  - "6:00AM-6:00PM"
 *  - "6:00π.μ.-6:00μ.μ."
 *  - "09:00-17:00"
 *  - "11:00AM-2:00PM, 5:00PM-10:00PM"
 */
function parseTimeRanges(hours: string): TimeRange[] {
  // Split on comma for multiple ranges
  const parts = hours.split(/,\s*/);
  const ranges: TimeRange[] = [];

  for (const part of parts) {
    // Try to find a range with a dash/hyphen separator
    // Match patterns like "6:00AM-6:00PM" or "6:00π.μ.-6:00μ.μ." or "09:00-17:00"
    const rangeMatch = part.match(
      /(\d{1,2}(?:[:.]\d{2})?)\s*(am|pm|π\.?μ\.?|μ\.?μ\.?)?\s*[-–—]\s*(\d{1,2}(?:[:.]\d{2})?)\s*(am|pm|π\.?μ\.?|μ\.?μ\.?)?/i
    );

    if (rangeMatch) {
      const openStr = rangeMatch[1];
      const openPeriod = rangeMatch[2];
      const closeStr = rangeMatch[3];
      const closePeriod = rangeMatch[4];

      // If the first time has no period but the second does, 
      // it often shares the same period (e.g., "4-10pm" -> "4pm-10pm")
      const effectiveOpenPeriod = openPeriod || closePeriod;

      const openMinutes = parseTimeToMinutes(openStr, effectiveOpenPeriod);
      const closeMinutes = parseTimeToMinutes(closeStr, closePeriod);

      if (openMinutes !== undefined && closeMinutes !== undefined) {
        ranges.push({ open: openMinutes, close: closeMinutes });
      }
    }
  }

  return ranges.sort((a, b) => a.open - b.open);
}

/**
 * Parse a time string like "6:00" with optional period "AM"/"PM"/"π.μ."/"μ.μ."
 * into minutes since midnight.
 */
function parseTimeToMinutes(time: string, period?: string): number | undefined {
  const match = time.match(/^(\d{1,2})(?:[:.:](\d{2}))?$/);
  if (!match) return undefined;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  if (period) {
    const normalized = period.toLowerCase().replace(/\./g, "").trim();
    const isPM = normalized === "pm" || normalized === "μμ";
    const isAM = normalized === "am" || normalized === "πμ";

    if (isPM && hours !== 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  } else {
    // No period specified — if hours <= 6 it's likely PM in a business context,
    // but we can't be sure. Treat as 24-hour format.
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return minutes === 0 ? `${displayHours} ${period}` : `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function findNextOpenDay(workingHours: OpeningHours[], currentDayIndex: number): string | undefined {
  for (let offset = 1; offset <= 7; offset++) {
    const checkIndex = (currentDayIndex + offset) % 7;
    const entry = workingHours.find((e) => parseDayIndex(e.day) === checkIndex);
    if (entry && !isClosed(entry.hours)) {
      const ranges = is24Hours(entry.hours) ? [{ open: 0, close: 1440 }] : parseTimeRanges(entry.hours);
      if (ranges.length) {
        const dayLabel = offset === 1 ? "tomorrow" : dayNames[checkIndex];
        return `${dayLabel} at ${formatMinutes(ranges[0].open)}`;
      }
    }
  }
  return undefined;
}

import assert from "node:assert/strict";
import { openStatus, openingHoursDayIndex } from "../src/lib/opening-hours";

function matchesFullWeekdayNames() {
  assert.equal(openingHoursDayIndex("Sunday"), 0);
  assert.equal(openingHoursDayIndex("Monday"), 1);
  assert.equal(openingHoursDayIndex("Tuesday"), 2);
  assert.equal(openingHoursDayIndex("Wednesday"), 3);
  assert.equal(openingHoursDayIndex("Thursday"), 4);
  assert.equal(openingHoursDayIndex("Friday"), 5);
  assert.equal(openingHoursDayIndex("Saturday"), 6);
}

function matchesShortWeekdayNames() {
  assert.equal(openingHoursDayIndex("Mon"), 1);
  assert.equal(openingHoursDayIndex("tue"), 2);
  assert.equal(openingHoursDayIndex(" SAT "), 6);
}

function ignoresUnknownLabels() {
  assert.equal(openingHoursDayIndex("Holiday"), undefined);
}

function labelsIncludeCloseAndOpenTimes() {
  const workingHours = [
    { day: "Monday", hours: "9am-5pm" },
    { day: "Tuesday", hours: "Closed" },
    { day: "Wednesday", hours: "10am-4pm" }
  ];

  assert.equal(openStatus(workingHours, new Date("2026-05-11T12:00:00")).label, "Open \u00b7 Closes at 5 PM");
  assert.equal(openStatus(workingHours, new Date("2026-05-13T08:00:00")).label, "Closed \u00b7 Opens at 10 AM");
}

matchesFullWeekdayNames();
matchesShortWeekdayNames();
ignoresUnknownLabels();
labelsIncludeCloseAndOpenTimes();

console.log("opening-hours current-day tests passed");

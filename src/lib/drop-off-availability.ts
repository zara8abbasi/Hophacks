import type { DisposalMethod } from "@/lib/disposal-method";
import {
  getResidentialHoursByObjectId,
  loadBaltimoreDropOffOfficial,
} from "@/lib/baltimore-drop-off-official";

const TZ = "America/New_York";

export type DropOffWarning = {
  severity: "warning" | "info";
  title: string;
  message: string;
  nextOpen?: string;
};

export type DropOffAvailabilityResult = {
  warnings: DropOffWarning[];
  centerHoursSummary: string | null;
  hhwSummary: string | null;
  dataLimitationNote: string | null;
};

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  return h * 60 + m;
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

function zonedParts(date: Date): {
  weekday: string;
  hour: number;
  minute: number;
  year: number;
  month: number;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday").toLowerCase();
  return {
    weekday,
    hour: Number.parseInt(get("hour"), 10),
    minute: Number.parseInt(get("minute"), 10),
    year: Number.parseInt(get("year"), 10),
    month: Number.parseInt(get("month"), 10),
    day: Number.parseInt(get("day"), 10),
  };
}

function isCenterOpenNow(
  centerObjectId: string,
  at: Date
): { open: boolean; reason?: string } {
  const hours = getResidentialHoursByObjectId(centerObjectId);
  if (!hours) {
    return {
      open: false,
      reason:
        "The city site does not list open days/hours for this location in our encoded residential center data.",
    };
  }
  const { weekday, hour, minute } = zonedParts(at);
  const nowMins = hour * 60 + minute;
  const openMins = parseTimeToMinutes(hours.hours.open);
  const closeMins = parseTimeToMinutes(hours.hours.close);
  if (!hours.openDays.includes(weekday)) {
    return { open: false, reason: `Closed on ${weekday}s.` };
  }
  if (nowMins < openMins || nowMins >= closeMins) {
    return {
      open: false,
      reason: `Outside today's posted hours (${formatTime12(hours.hours.open)}–${formatTime12(hours.hours.close)}).`,
    };
  }
  return { open: true };
}

function nextCenterOpenWindow(
  centerObjectId: string,
  from: Date
): string | undefined {
  const hours = getResidentialHoursByObjectId(centerObjectId);
  if (!hours) return undefined;

  for (let offset = 0; offset <= 14; offset++) {
    const candidate = new Date(from.getTime() + offset * 24 * 60 * 60 * 1000);
    const { weekday, year, month, day } = zonedParts(candidate);
    if (!hours.openDays.includes(weekday)) continue;
    const dayLabel =
      offset === 0
        ? "Today"
        : offset === 1
          ? "Tomorrow"
          : weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dateLabel =
      offset <= 1 ? dayLabel : `${month}/${day}/${year}`;
    return `${dateLabel}, ${formatTime12(hours.hours.open)}–${formatTime12(hours.hours.close)}`;
  }
  return undefined;
}

function firstWeekdayOfMonth(
  year: number,
  month: number,
  weekday: string
): number | null {
  const anchor = new Date(Date.UTC(year, month - 1, 1, 18, 0, 0));
  for (let i = 0; i < 40; i++) {
    const d = new Date(anchor.getTime() + i * 24 * 60 * 60 * 1000);
    const p = zonedParts(d);
    if (p.year > year || (p.year === year && p.month > month)) break;
    if (p.year === year && p.month === month && p.weekday === weekday) {
      return p.day;
    }
  }
  return null;
}

function hhwHoursLabelForMonth(
  month: number,
  official: NonNullable<ReturnType<typeof loadBaltimoreDropOffOfficial>>
): string {
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const name = monthNames[month - 1];
  for (const row of official.hhw.publishedDropOffDates2025) {
    if (row.label.toLowerCase().startsWith(name)) {
      return row.hours.replace(/AM/g, "am").replace(/PM/g, "pm");
    }
  }
  return month >= 10 ? "9am–5pm" : "9am–7pm";
}

/** First Friday/Saturday pair on or after `from` in America/New_York, June–December. */
function nextHhwWeekend(from: Date): {
  friday: Date;
  saturday: Date;
  hoursLabel: string;
} | null {
  const official = loadBaltimoreDropOffOfficial();
  if (!official) return null;

  const startParts = zonedParts(from);
  let year = startParts.year;
  let month = startParts.month;

  for (let m = 0; m < 24; m++) {
    if (month < 6 || month > 12) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      continue;
    }

    const firstFri = firstWeekdayOfMonth(year, month, "friday");
    const firstSat = firstWeekdayOfMonth(year, month, "saturday");
    if (firstFri === null || firstSat === null) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      continue;
    }

    const fridayAt = new Date(
      Date.UTC(year, month - 1, firstFri, 18, 0, 0)
    );
    if (fridayAt.getTime() < from.getTime() - 24 * 60 * 60 * 1000) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      continue;
    }

    const saturday = new Date(fridayAt.getTime() + 24 * 60 * 60 * 1000);
    const hoursLabel = hhwHoursLabelForMonth(month, official);
    return { friday: fridayAt, saturday, hoursLabel };
  }
  return null;
}

function isHhwCollectionDay(at: Date): boolean {
  const { weekday, year, month, day } = zonedParts(at);
  if (month < 6 || month > 12) return false;
  if (weekday === "friday") {
    const firstFri = firstWeekdayOfMonth(year, month, "friday");
    return firstFri !== null && day === firstFri;
  }
  if (weekday === "saturday") {
    const firstSat = firstWeekdayOfMonth(year, month, "saturday");
    return firstSat !== null && day === firstSat;
  }
  return false;
}

function itemNeedsHhw(method: DisposalMethod, classificationText: string): boolean {
  if (method === "hhw_drop_off") return true;
  const t = classificationText.toLowerCase();
  return /\b(paint|pesticide|herbicide|solvent|pool chemical|propane|fluorescent|battery|batteries|hhw|hazardous)\b/.test(
    t
  );
}

function itemIsTires(classificationText: string): boolean {
  return /\btire(s)?\b/.test(classificationText.toLowerCase());
}

function itemIsOysterShells(classificationText: string): boolean {
  return /\boyster\s*shell/.test(classificationText.toLowerCase());
}

export function evaluateDropOffAvailability(
  centerObjectId: string,
  centerName: string,
  disposalMethod: DisposalMethod,
  classificationText: string,
  at: Date = new Date()
): DropOffAvailabilityResult {
  const official = loadBaltimoreDropOffOfficial();
  const warnings: DropOffWarning[] = [];
  const hours = getResidentialHoursByObjectId(centerObjectId);

  let centerHoursSummary: string | null = null;
  if (hours) {
    const daysLabel = hours.openDays
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
      .join(", ");
    centerHoursSummary = `${daysLabel} · ${formatTime12(hours.hours.open)}–${formatTime12(hours.hours.close)}`;
  }

  const openState = isCenterOpenNow(centerObjectId, at);
  if (!openState.open) {
    const next = nextCenterOpenWindow(centerObjectId, at);
    warnings.push({
      severity: "warning",
      title: "Center may not be open right now",
      message: openState.reason ?? "This center appears closed at the current time.",
      nextOpen: next,
    });
  }

  if (!hours) {
    warnings.push({
      severity: "info",
      title: "Hours not on city residential list",
      message:
        official?.dataLimitations.openBaltimoreExtraSites ??
        "Confirm hours with DPW before visiting.",
    });
  }

  const haystack = classificationText;
  const needsHhw = itemNeedsHhw(disposalMethod, haystack);

  if (needsHhw && official) {
    const hhwAtSisson = centerObjectId === official.hhw.centerObjectId;
    const onHhwDay = isHhwCollectionDay(at);
    const rule = official.hhw.scheduleRule;

    if (!hhwAtSisson) {
      warnings.push({
        severity: "warning",
        title: "Household hazardous waste — wrong center",
        message: `HHW is collected at ${official.hhw.locationName} (${official.hhw.address}), not at ${centerName}. ${rule.when}, ${rule.months}.`,
        nextOpen: formatHhwNext(official, at),
      });
    } else if (!onHhwDay) {
      warnings.push({
        severity: "warning",
        title: "Not an HHW collection day",
        message: `Regular drop-off may be open, but household hazardous waste is only accepted ${rule.when} (${rule.months}). ${official.hhw.packagingRule}`,
        nextOpen: formatHhwNext(official, at),
      });
    }
  }

  if (itemIsTires(haystack) && centerObjectId === "8") {
    warnings.push({
      severity: "warning",
      title: "Tires not accepted at Sisson Street",
      message:
        "City hard-to-recycle guidance: tires are not accepted at Sisson Street. Use another Residential Recycling Center (up to four off-rim tires per month).",
    });
  }

  if (itemIsOysterShells(haystack) && centerObjectId !== "8") {
    warnings.push({
      severity: "warning",
      title: "Oyster shells — Sisson Street only",
      message:
        "The drop-off center guide lists oyster shell recycling at the Sisson Street Drop-Off Center only.",
    });
  }

  if (
    disposalMethod !== "hhw_drop_off" &&
    official &&
    needsHhw === false &&
    /\b(paint|battery|fluorescent|pesticide)\b/i.test(haystack)
  ) {
    warnings.push({
      severity: "info",
      title: "May need HHW collection",
      message: official.generalDropOff.hhwNote,
    });
  }

  return {
    warnings,
    centerHoursSummary,
    hhwSummary: official
      ? `${official.hhw.scheduleRule.when} · ${official.hhw.scheduleRule.months} at ${official.hhw.address}`
      : null,
    dataLimitationNote: official?.dataLimitations.perSiteDailyMaterialCalendar ?? null,
  };
}

function formatHhwNext(
  official: NonNullable<ReturnType<typeof loadBaltimoreDropOffOfficial>>,
  from: Date
): string | undefined {
  const next = nextHhwWeekend(from);
  if (!next) return undefined;
  const f = zonedParts(next.friday);
  const s = zonedParts(next.saturday);
  return `Next collection weekend: Fri ${f.month}/${f.day} & Sat ${s.month}/${s.day} (${next.hoursLabel} per city HHW page)`;
}

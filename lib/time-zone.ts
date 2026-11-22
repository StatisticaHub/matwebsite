export const DEFAULT_TIME_ZONE =
  "Europe/London";

export type TimeZoneOption = {
  value: string;
  label: string;
};

export type TimeZoneGroup = {
  label: string;
  options: TimeZoneOption[];
};

/*
 * Friendly choices shown first.
 *
 * IMPORTANT:
 * We store IANA zone identifiers, never abbreviations such as EST or BST.
 * That lets future session dates switch correctly between standard time and DST.
 */
export const POPULAR_TIME_ZONES: TimeZoneOption[] = [
  {
    value: "Europe/London",
    label: "UK — GMT / BST",
  },
  {
    value: "Europe/Dublin",
    label: "Ireland — GMT / IST",
  },

  {
    value: "America/New_York",
    label: "US / Canada Eastern — EST / EDT",
  },
  {
    value: "America/Chicago",
    label: "US / Canada Central — CST / CDT",
  },
  {
    value: "America/Denver",
    label: "US / Canada Mountain — MST / MDT",
  },
  {
    value: "America/Phoenix",
    label: "Arizona — MST",
  },
  {
    value: "America/Los_Angeles",
    label: "US / Canada Pacific — PST / PDT",
  },
  {
    value: "America/Anchorage",
    label: "Alaska — AKST / AKDT",
  },
  {
    value: "Pacific/Honolulu",
    label: "Hawaii — HST",
  },

  {
    value: "America/Halifax",
    label: "Canada Atlantic — AST / ADT",
  },
  {
    value: "America/St_Johns",
    label: "Newfoundland — NST / NDT",
  },
  {
    value: "America/Regina",
    label: "Saskatchewan — CST",
  },

  {
    value: "Europe/Paris",
    label: "Central Europe — CET / CEST",
  },
  {
    value: "Europe/Athens",
    label: "Eastern Europe — EET / EEST",
  },

  {
    value: "Asia/Kolkata",
    label: "India — IST",
  },
  {
    value: "Asia/Karachi",
    label: "Pakistan — PKT",
  },
  {
    value: "Asia/Dhaka",
    label: "Bangladesh — BST",
  },
  {
    value: "Asia/Kathmandu",
    label: "Nepal — NPT",
  },
  {
    value: "Asia/Colombo",
    label: "Sri Lanka — SLST",
  },
  {
    value: "Asia/Dubai",
    label: "UAE / Gulf — GST",
  },
  {
    value: "Asia/Riyadh",
    label: "Saudi Arabia — AST",
  },
  {
    value: "Asia/Singapore",
    label: "Singapore — SGT",
  },
  {
    value: "Asia/Hong_Kong",
    label: "Hong Kong — HKT",
  },
  {
    value: "Asia/Shanghai",
    label: "China — China Standard Time",
  },
  {
    value: "Asia/Tokyo",
    label: "Japan — JST",
  },
  {
    value: "Asia/Seoul",
    label: "South Korea — KST",
  },

  {
    value: "Australia/Sydney",
    label: "Australia Eastern — AEST / AEDT",
  },
  {
    value: "Australia/Adelaide",
    label: "Australia Central — ACST / ACDT",
  },
  {
    value: "Australia/Brisbane",
    label: "Queensland — AEST",
  },
  {
    value: "Australia/Darwin",
    label: "Northern Territory — ACST",
  },
  {
    value: "Australia/Perth",
    label: "Australia Western — AWST",
  },

  {
    value: "Pacific/Auckland",
    label: "New Zealand — NZST / NZDT",
  },
  {
    value: "Pacific/Chatham",
    label: "Chatham Islands — CHAST / CHADT",
  },

  {
    value: "Africa/Johannesburg",
    label: "South Africa — SAST",
  },
  {
    value: "Africa/Nairobi",
    label: "East Africa — EAT",
  },

  {
    value: "UTC",
    label: "UTC",
  },
];

export function isValidTimeZone(
  value: unknown,
): value is string {
  const candidate =
    String(value || "").trim();

  if (
    !candidate ||
    candidate.length > 120
  ) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: candidate,
      },
    ).format(
      new Date(),
    );

    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(
  value: unknown,
  fallback = DEFAULT_TIME_ZONE,
) {
  const candidate =
    String(value || "").trim();

  return isValidTimeZone(
    candidate,
  )
    ? candidate
    : fallback;
}

function supportedValuesOfTimeZone() {
  const intlWithSupportedValues =
    Intl as typeof Intl & {
      supportedValuesOf?: (
        key: string,
      ) => string[];
    };

  if (
    typeof intlWithSupportedValues
      .supportedValuesOf ===
    "function"
  ) {
    try {
      return intlWithSupportedValues
        .supportedValuesOf(
          "timeZone",
        )
        .filter(
          (value) =>
            isValidTimeZone(
              value,
            ),
        );
    } catch {
      return [];
    }
  }

  return [];
}

function readableZoneName(
  zone: string,
) {
  return zone
    .replaceAll(
      "_",
      " ",
    )
    .replaceAll(
      "/",
      " · ",
    );
}

function currentShortZoneName(
  zone: string,
) {
  try {
    const part =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone:
            zone,
          timeZoneName:
            "short",
        },
      )
        .formatToParts(
          new Date(),
        )
        .find(
          (item) =>
            item.type ===
            "timeZoneName",
        )
        ?.value;

    if (
      !part ||
      part === zone
    ) {
      return "";
    }

    return part;
  } catch {
    return "";
  }
}

export function genericTimeZoneLabel(
  zone: string,
) {
  const readable =
    readableZoneName(
      zone,
    );

  const shortName =
    currentShortZoneName(
      zone,
    );

  return shortName
    ? `${readable} — ${shortName}`
    : readable;
}

function broadRegion(
  zone: string,
) {
  if (
    zone.startsWith(
      "Europe/",
    )
  ) {
    return "Europe";
  }

  if (
    zone.startsWith(
      "Asia/",
    )
  ) {
    return "Asia";
  }

  if (
    zone.startsWith(
      "Australia/",
    )
  ) {
    return "Australia";
  }

  if (
    zone.startsWith(
      "Pacific/",
    )
  ) {
    return "New Zealand & Pacific";
  }

  if (
    zone.startsWith(
      "Africa/",
    )
  ) {
    return "Africa";
  }

  if (
    zone.startsWith(
      "America/",
    )
  ) {
    return "Americas";
  }

  if (
    zone.startsWith(
      "Atlantic/",
    )
  ) {
    return "Atlantic";
  }

  if (
    zone.startsWith(
      "Indian/",
    )
  ) {
    return "Indian Ocean";
  }

  if (
    zone.startsWith(
      "Antarctica/",
    )
  ) {
    return "Antarctica";
  }

  return "Other";
}

export function getTimeZoneGroups(): TimeZoneGroup[] {
  const popularValues =
    new Set(
      POPULAR_TIME_ZONES.map(
        (option) =>
          option.value,
      ),
    );

  const allZones =
    supportedValuesOfTimeZone();

  const grouped =
    new Map<
      string,
      TimeZoneOption[]
    >();

  for (
    const zone of allZones
  ) {
    if (
      popularValues.has(
        zone,
      )
    ) {
      continue;
    }

    const group =
      broadRegion(
        zone,
      );

    const options =
      grouped.get(
        group,
      ) || [];

    options.push({
      value:
        zone,
      label:
        genericTimeZoneLabel(
          zone,
        ),
    });

    grouped.set(
      group,
      options,
    );
  }

  const order = [
    "Europe",
    "Asia",
    "Australia",
    "New Zealand & Pacific",
    "Americas",
    "Africa",
    "Atlantic",
    "Indian Ocean",
    "Antarctica",
    "Other",
  ];

  return order
    .map(
      (label) => ({
        label,
        options:
          (
            grouped.get(
              label,
            ) ||
            []
          ).sort(
            (a, b) =>
              a.label.localeCompare(
                b.label,
              ),
          ),
      }),
    )
    .filter(
      (group) =>
        group.options.length >
        0,
    );
}

export function friendlyTimeZoneLabel(
  value: unknown,
) {
  const zone =
    normalizeTimeZone(
      value,
    );

  return (
    POPULAR_TIME_ZONES.find(
      (option) =>
        option.value ===
        zone,
    )?.label ||
    genericTimeZoneLabel(
      zone,
    )
  );
}

export function formatDateTimeInTimeZone(
  value:
    | string
    | Date
    | null
    | undefined,
  timeZone: unknown =
    DEFAULT_TIME_ZONE,
) {
  if (!value) {
    return "Not scheduled";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
      timeZone:
        normalizeTimeZone(
          timeZone,
        ),
    },
  ).format(
    date,
  );
}

export function dateKeyInTimeZone(
  value:
    | string
    | Date,
  timeZone: unknown =
    DEFAULT_TIME_ZONE,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          normalizeTimeZone(
            timeZone,
          ),
        year:
          "numeric",
        month:
          "2-digit",
        day:
          "2-digit",
      },
    ).formatToParts(
      date,
    );

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  return `${values.year}-${values.month}-${values.day}`;
}

/* ==========================================================================
   BACKWARD-COMPATIBILITY API

   Existing MAT session-request and reschedule components expect:
   - timeZoneOptions() -> string[]
   - timeZoneOffsetLabel(zone, date?)
   - zonedLocalDateTimeToUtc(...) -> { ok, iso, error }

   These wrappers preserve the current MAT API while the full IANA
   timezone catalogue remains the source of truth.
   ========================================================================== */

export function timeZoneOptions(): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  const add = (value: string) => {
    if (!value || seen.has(value)) {
      return;
    }

    seen.add(value);
    values.push(value);
  };

  for (const option of POPULAR_TIME_ZONES) {
    add(option.value);
  }

  for (const group of getTimeZoneGroups()) {
    for (const option of group.options) {
      add(option.value);
    }
  }

  return values;
}

export function timeZoneOffsetLabel(
  timeZone: string,
  at: string | Date = new Date(),
) {
  const zone = normalizeTimeZone(timeZone);

  const date =
    at instanceof Date
      ? at
      : new Date(at);

  const safeDate =
    Number.isNaN(date.getTime())
      ? new Date()
      : date;

  try {
    const label =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: zone,
          timeZoneName: "shortOffset",
          hour: "2-digit",
        },
      )
        .formatToParts(safeDate)
        .find(
          (part) =>
            part.type ===
            "timeZoneName",
        )
        ?.value;

    if (label) {
      return label;
    }
  } catch {
    // Numeric fallback below.
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(safeDate);

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  const representedAsUtc =
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

  const offsetMinutes =
    Math.round(
      (
        representedAsUtc -
        safeDate.getTime()
      ) /
        60000,
    );

  if (offsetMinutes === 0) {
    return "UTC";
  }

  const sign =
    offsetMinutes >= 0
      ? "+"
      : "-";

  const absolute =
    Math.abs(offsetMinutes);

  const hours =
    Math.floor(
      absolute / 60,
    );

  const minutes =
    absolute % 60;

  return minutes
    ? `UTC${sign}${hours}:${String(
        minutes,
      ).padStart(
        2,
        "0",
      )}`
    : `UTC${sign}${hours}`;
}

function zoneParts(
  date: Date,
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(date);

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function offsetMilliseconds(
  date: Date,
  timeZone: string,
) {
  const parts =
    zoneParts(
      date,
      timeZone,
    );

  const representedAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

  return (
    representedAsUtc -
    date.getTime()
  );
}

type ZonedLocalInput = {
  date?: string;
  time?: string;
  dateTime?: string;
  localDateTime?: string;
  timeZone?: string;
  timezone?: string;
};

export type ZonedDateTimeConversionResult =
  | {
      ok: true;
      iso: string;
      error: null;
    }
  | {
      ok: false;
      iso: null;
      error: string;
    };

export function zonedLocalDateTimeToUtc(
  dateOrInput:
    | string
    | ZonedLocalInput,
  timeOrZone?: string,
  maybeTimeZone?: string,
): ZonedDateTimeConversionResult {
  let localDateTime = "";
  let timeZone = "";

  if (
    typeof dateOrInput ===
    "object"
  ) {
    const date =
      String(
        dateOrInput.date ||
          "",
      ).trim();

    const time =
      String(
        dateOrInput.time ||
          "",
      ).trim();

    localDateTime =
      String(
        dateOrInput.dateTime ||
          dateOrInput.localDateTime ||
          (
            date &&
            time
              ? `${date}T${time}`
              : ""
          ),
      ).trim();

    timeZone =
      String(
        dateOrInput.timeZone ||
          dateOrInput.timezone ||
          "",
      ).trim();
  } else if (maybeTimeZone) {
    localDateTime =
      `${String(
        dateOrInput,
      ).trim()}T${String(
        timeOrZone ||
          "",
      ).trim()}`;

    timeZone =
      String(
        maybeTimeZone,
      ).trim();
  } else {
    localDateTime =
      String(
        dateOrInput,
      ).trim();

    timeZone =
      String(
        timeOrZone ||
          "",
      ).trim();
  }

  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return {
      ok: false,
      iso: null,
      error:
        "Please choose a valid timezone.",
    };
  }

  const match =
    localDateTime.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
    );

  if (!match) {
    return {
      ok: false,
      iso: null,
      error:
        "Please choose a valid date and time.",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(
    match[6] || "0",
  );

  const wallClockCheck =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        hour,
        minute,
        second,
      ),
    );

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59 ||
    wallClockCheck.getUTCFullYear() !==
      year ||
    wallClockCheck.getUTCMonth() !==
      month - 1 ||
    wallClockCheck.getUTCDate() !==
      day
  ) {
    return {
      ok: false,
      iso: null,
      error:
        "Please choose a valid date and time.",
    };
  }

  const localAsUtc =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second,
    );

  let instant =
    new Date(localAsUtc);

  for (
    let index = 0;
    index < 4;
    index += 1
  ) {
    const offset =
      offsetMilliseconds(
        instant,
        timeZone,
      );

    const next =
      new Date(
        localAsUtc -
          offset,
      );

    if (
      Math.abs(
        next.getTime() -
          instant.getTime(),
      ) <
      1000
    ) {
      instant = next;
      break;
    }

    instant = next;
  }

  const check =
    zoneParts(
      instant,
      timeZone,
    );

  if (
    check.year !== year ||
    check.month !== month ||
    check.day !== day ||
    check.hour !== hour ||
    check.minute !== minute ||
    check.second !== second
  ) {
    return {
      ok: false,
      iso: null,
      error:
        "That local time does not exist in the selected timezone because of a daylight-saving clock change. Please choose another time.",
    };
  }

  return {
    ok: true,
    iso:
      instant.toISOString(),
    error: null,
  };
}

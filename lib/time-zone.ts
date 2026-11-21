export const DEFAULT_TIME_ZONE =
  "Europe/London";

type SupportedIntl =
  typeof Intl & {
    supportedValuesOf?: (
      key: "timeZone",
    ) => string[];
  };


export function timeZoneOptions() {
  const fn =
    (
      Intl as SupportedIntl
    ).supportedValuesOf;

  const zones =
    fn
      ? fn.call(
          Intl,
          "timeZone",
        )
      : [];

  return Array.from(
    new Set([
      "UTC",
      ...zones,
    ]),
  ).sort();
}


export function isValidTimeZone(
  value:
    | string
    | null
    | undefined,
): value is string {
  if (!value) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          value,
      },
    ).format(
      new Date(),
    );

    return true;
  } catch {
    return false;
  }
}


function zonedParts(
  instantMs: number,
  timeZone: string,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hourCycle:
          "h23",
      },
    ).formatToParts(
      new Date(
        instantMs,
      ),
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


  return {
    year:
      Number(
        values.year,
      ),

    month:
      Number(
        values.month,
      ),

    day:
      Number(
        values.day,
      ),

    hour:
      Number(
        values.hour,
      ),

    minute:
      Number(
        values.minute,
      ),

    second:
      Number(
        values.second,
      ),
  };
}


function offsetAt(
  instantMs: number,
  timeZone: string,
) {
  const parts =
    zonedParts(
      instantMs,
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
    instantMs
  );
}


export function zonedLocalDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
):
  | {
      ok: true;
      iso: string;
    }
  | {
      ok: false;
      error: string;
    } {
  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return {
      ok: false,

      error:
        "Please choose a valid time zone.",
    };
  }


  const dateMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      date,
    );


  const timeMatch =
    /^(\d{2}):(\d{2})$/.exec(
      time,
    );


  if (
    !dateMatch ||
    !timeMatch
  ) {
    return {
      ok: false,

      error:
        "Please choose a valid date and time.",
    };
  }


  const year =
    Number(
      dateMatch[1],
    );

  const month =
    Number(
      dateMatch[2],
    );

  const day =
    Number(
      dateMatch[3],
    );

  const hour =
    Number(
      timeMatch[1],
    );

  const minute =
    Number(
      timeMatch[2],
    );


  const wallClockUtc =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
    );


  /*
   * Gather possible offsets around
   * the requested date. This handles
   * DST changes and half/quarter-hour
   * time zones.
   */
  const offsets =
    new Set<number>();


  for (
    const hours
    of [
      -48,
      -24,
      -12,
      0,
      12,
      24,
      48,
    ]
  ) {
    offsets.add(
      offsetAt(
        wallClockUtc +
          hours *
            60 *
            60 *
            1000,

        timeZone,
      ),
    );
  }


  const candidates:
    number[] =
    [];


  for (
    const offset
    of offsets
  ) {
    const candidate =
      wallClockUtc -
      offset;


    const parts =
      zonedParts(
        candidate,
        timeZone,
      );


    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute ===
        minute
    ) {
      candidates.push(
        candidate,
      );
    }
  }


  const unique =
    Array.from(
      new Set(
        candidates,
      ),
    ).sort(
      (a, b) =>
        a - b,
    );


  if (!unique.length) {
    return {
      ok: false,

      error:
        "That local time does not exist in this time zone because of a daylight-saving change. Please choose another time.",
    };
  }


  if (
    unique.length > 1
  ) {
    return {
      ok: false,

      error:
        "That local time occurs twice because of a daylight-saving change. Please choose another nearby time so the booking is unambiguous.",
    };
  }


  return {
    ok: true,

    iso:
      new Date(
        unique[0],
      ).toISOString(),
  };
}


export function formatDateTimeInTimeZone(
  value:
    | string
    | null
    | undefined,
  timeZone: string,
) {
  if (!value) {
    return "Not scheduled";
  }


  const zone =
    isValidTimeZone(
      timeZone,
    )
      ? timeZone
      : DEFAULT_TIME_ZONE;


  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        zone,
    },
  ).format(
    new Date(value),
  );
}


export function timeZoneOffsetLabel(
  timeZone: string,
) {
  if (
    !isValidTimeZone(
      timeZone,
    )
  ) {
    return "";
  }


  try {
    const name =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone,

          timeZoneName:
            "shortOffset",

          hour:
            "2-digit",
        },
      )
        .formatToParts(
          new Date(),
        )
        .find(
          (part) =>
            part.type ===
            "timeZoneName",
        )
        ?.value;


    return (
      name?.replace(
        "GMT",
        "UTC",
      ) ||
      ""
    );
  } catch {
    return "";
  }
}

"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  isValidTimeZone,
} from "@/lib/time-zone";


export default function ViewerLocalDateTime({
  value,
  fallbackTimeZone,
}: {
  value:
    | string
    | null
    | undefined;

  fallbackTimeZone?:
    string | null;
}) {
  const [
    timeZone,
    setTimeZone,
  ] =
    useState(
      isValidTimeZone(
        fallbackTimeZone,
      )
        ? fallbackTimeZone
        : DEFAULT_TIME_ZONE,
    );


  useEffect(
    () => {
      const detected =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone;


      if (
        isValidTimeZone(
          detected,
        )
      ) {
        setTimeZone(
          detected,
        );
      }
    },
    [],
  );


  return (
    <span
      title={
        timeZone
      }
    >
      {formatDateTimeInTimeZone(
        value,
        timeZone,
      )}
    </span>
  );
}

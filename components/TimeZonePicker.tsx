"use client";

import {
  useId,
  useMemo,
} from "react";

import {
  isValidTimeZone,
  timeZoneOffsetLabel,
  timeZoneOptions,
} from "@/lib/time-zone";


export default function TimeZonePicker({
  value,
  onChange,
  label =
    "Your time zone",
}: {
  value: string;

  onChange:
    (
      value: string,
    ) => void;

  label?: string;
}) {
  const id =
    useId();

  const zones =
    useMemo(
      () =>
        timeZoneOptions(),
      [],
    );


  const valid =
    isValidTimeZone(
      value,
    );


  return (
    <label className="portal-time-zone-picker">

      <span>
        {label}
      </span>


      <input
        type="search"
        list={
          `${id}-zones`
        }
        value={
          value
        }
        required
        autoComplete="off"
        spellCheck={
          false
        }
        placeholder="Search e.g. Asia/Kolkata"
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
      />


      <datalist
        id={
          `${id}-zones`
        }
      >
        {zones.map(
          (zone) => (
            <option
              key={
                zone
              }
              value={
                zone
              }
            />
          ),
        )}
      </datalist>


      <small
        className={
          valid
            ? ""
            : "is-error"
        }
      >
        {valid
          ? `${timeZoneOffsetLabel(
              value,
            )} · ${value}`
          : "Choose an exact IANA time zone from the list."}
      </small>

    </label>
  );
}

"use client";

import {
  DEFAULT_TIME_ZONE,
  POPULAR_TIME_ZONES,
  friendlyTimeZoneLabel,
  getTimeZoneGroups,
  isValidTimeZone,
} from "@/lib/time-zone";

type Props = {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (
    value: string,
  ) => void;
};

export default function TimeZoneSelect({
  name = "timezone",
  id,
  value,
  defaultValue,
  required = false,
  disabled = false,
  className,
  onChange,
}: Props) {
  const selected =
    value ??
    defaultValue ??
    DEFAULT_TIME_ZONE;

  const groups =
    getTimeZoneGroups();

  const availableValues =
    new Set([
      ...POPULAR_TIME_ZONES.map(
        (option) =>
          option.value,
      ),
      ...groups.flatMap(
        (group) =>
          group.options.map(
            (option) =>
              option.value,
          ),
      ),
    ]);

  const custom =
    selected &&
    isValidTimeZone(
      selected,
    ) &&
    !availableValues.has(
      selected,
    )
      ? selected
      : null;

  return (
    <select
      id={id}
      name={name}
      value={value}
      defaultValue={
        value === undefined
          ? selected
          : undefined
      }
      required={required}
      disabled={disabled}
      className={className}
      onChange={
        onChange
          ? (event) =>
              onChange(
                event.target
                  .value,
              )
          : undefined
      }
    >
      {custom && (
        <option
          value={custom}
        >
          {
            friendlyTimeZoneLabel(
              custom,
            )
          }
        </option>
      )}

      <optgroup label="Popular time zones">
        {POPULAR_TIME_ZONES.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </optgroup>

      {groups.map(
        (group) => (
          <optgroup
            key={
              group.label
            }
            label={
              `All — ${group.label}`
            }
          >
            {group.options.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </optgroup>
        ),
      )}
    </select>
  );
}

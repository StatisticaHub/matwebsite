const MINUTE_MS =
  60 * 1000;


/**
 * Expected end time for a scheduled tutoring session.
 *
 * Sessions should not enter the close-out queue merely because
 * their start time has passed. They become due after:
 *
 *   scheduled start + planned duration
 *
 * If an old/incomplete record has no usable duration, use a
 * conservative 60-minute fallback rather than immediately
 * treating it as overdue.
 */
export function expectedSessionEndMs(
  scheduledFor:
    | string
    | null
    | undefined,
  durationMinutes:
    | number
    | null
    | undefined,
) {
  if (!scheduledFor) {
    return Number.POSITIVE_INFINITY;
  }


  const startMs =
    new Date(
      scheduledFor,
    ).getTime();


  if (
    !Number.isFinite(
      startMs,
    )
  ) {
    return Number.POSITIVE_INFINITY;
  }


  const parsedDuration =
    Number(
      durationMinutes,
    );


  const duration =
    Number.isFinite(
      parsedDuration,
    ) &&
    parsedDuration >
      0
      ? parsedDuration
      : 60;


  return (
    startMs +
    duration *
      MINUTE_MS
  );
}

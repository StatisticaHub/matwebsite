import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createZoomMeeting,
  deleteZoomMeeting,
  isZoomConfigured,
  zoomHostUserId,
} from "@/lib/zoom";


type AdminClient =
  ReturnType<
    typeof createAdminClient
  >;


export type ManagedZoomMeeting = {
  meetingUrl: string;
  zoomMeetingId: string;
  zoomMeetingUuid: string | null;
  zoomHostUserId: string;
  zoomSyncedAt: string;
};


function formatUkDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    },
  ).format(
    new Date(value),
  );
}


export async function assertManagedZoomSlotAvailable({
  supabase,
  scheduledFor,
  durationMinutes,
  excludeSessionId = null,
}: {
  supabase: AdminClient;
  scheduledFor: string;
  durationMinutes: number;
  excludeSessionId?: string | null;
}) {
  const start =
    new Date(
      scheduledFor,
    ).getTime();


  if (
    Number.isNaN(start)
  ) {
    throw new Error(
      "Invalid Zoom session time.",
    );
  }


  const end =
    start +
    durationMinutes *
      60 *
      1000;


  /*
   * MAT currently uses one shared licensed
   * Zoom host.
   *
   * Therefore managed Zoom sessions across
   * all tutors/courses must not overlap.
   */
  const windowStart =
    new Date(
      start -
        24 *
          60 *
          60 *
          1000,
    ).toISOString();


  const windowEnd =
    new Date(
      end +
        24 *
          60 *
          60 *
          1000,
    ).toISOString();


  let query =
    supabase
      .from(
        "tutoring_sessions",
      )
      .select(`
        id,
        topic,
        scheduled_for,
        duration_minutes,
        zoom_meeting_id
      `)
      .eq(
        "status",
        "planned",
      )
      .not(
        "scheduled_for",
        "is",
        null,
      )
      .not(
        "zoom_meeting_id",
        "is",
        null,
      )
      .gte(
        "scheduled_for",
        windowStart,
      )
      .lte(
        "scheduled_for",
        windowEnd,
      );


  if (
    excludeSessionId
  ) {
    query =
      query.neq(
        "id",
        excludeSessionId,
      );
  }


  const {
    data,
    error,
  } =
    await query;


  if (error) {
    throw new Error(
      error.message,
    );
  }


  const conflict =
    (
      data ||
      []
    ).find(
      (item) => {
        if (
          !item.scheduled_for
        ) {
          return false;
        }


        const existingStart =
          new Date(
            item.scheduled_for,
          ).getTime();


        const existingEnd =
          existingStart +
          Number(
            item.duration_minutes ||
              60,
          ) *
            60 *
            1000;


        return (
          start <
            existingEnd &&
          existingStart <
            end
        );
      },
    );


  if (conflict) {
    throw new Error(
      `Zoom scheduling conflict: "${conflict.topic}" is already using the shared MAT Zoom host from ${formatUkDateTime(
        conflict.scheduled_for,
      )} for ${conflict.duration_minutes} minutes. Choose a non-overlapping time.`,
    );
  }
}


export async function createManagedZoomMeeting({
  supabase,
  topic,
  scheduledFor,
  durationMinutes,
}: {
  supabase: AdminClient;
  topic: string;
  scheduledFor: string;
  durationMinutes: number;
}): Promise<ManagedZoomMeeting> {
  if (
    !isZoomConfigured()
  ) {
    throw new Error(
      "MAT Zoom is not configured on this server.",
    );
  }


  const hostUserId =
    zoomHostUserId();


  if (!hostUserId) {
    throw new Error(
      "ZOOM_HOST_USER_ID is not configured.",
    );
  }


  await assertManagedZoomSlotAvailable({
    supabase,
    scheduledFor,
    durationMinutes,
  });


  /*
   * Use the exact same Zoom helper and
   * meeting naming convention as Admin.
   */
  const meeting =
    await createZoomMeeting({
      topic:
        `My Academic Tutor — ${topic}`,

      scheduledFor,

      durationMinutes,
    });


  return {
    meetingUrl:
      meeting.joinUrl,

    zoomMeetingId:
      meeting.id,

    zoomMeetingUuid:
      meeting.uuid,

    zoomHostUserId:
      hostUserId,

    zoomSyncedAt:
      new Date()
        .toISOString(),
  };
}


export async function cleanupManagedZoomMeeting(
  meetingId:
    | string
    | null,
) {
  if (!meetingId) {
    return;
  }


  try {
    await deleteZoomMeeting(
      meetingId,
    );

  } catch (
    error
  ) {
    console.error(
      "Could not clean up Zoom meeting after session creation failure:",
      error,
    );
  }
}

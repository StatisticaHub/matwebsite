import {
  createHash,
  randomBytes,
} from "node:crypto";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import type {
  Homework,
  LearningPlanItem,
  LearningResource,
  Student,
  TutoringEngagement,
  TutoringSession,
} from "@/lib/delivery-data";

import type {
  ProgressReport,
} from "@/lib/progress";


/* ==========================================================================
   SUPPORT REQUESTS
   ========================================================================== */

export const portalSupportCategories = [
  "general",
  "lesson",
  "homework",
  "resource",
  "technical",
  "session_request",
] as const;


export type PortalSupportCategory =
  (typeof portalSupportCategories)[number];


export const portalSupportStatuses = [
  "new",
  "in_progress",
  "resolved",
] as const;


export type PortalSupportStatus =
  (typeof portalSupportStatuses)[number];


/* ==========================================================================
   PORTAL TYPES
   ========================================================================== */

export type StudentPortalLink = {
  id: string;
  created_at: string;
  updated_at: string;

  student_id: string;

  token_hash: string;
  token_preview: string;

  expires_at: string | null;
  revoked_at: string | null;

  last_accessed_at: string | null;

  created_by_email: string | null;
  label: string | null;
};


export type HomeworkSubmission = {
  id: string;
  created_at: string;
  updated_at: string;

  homework_id: string;
  student_id: string;

  portal_link_id: string | null;

  note: string | null;
  submission_url: string | null;

  submitted_at: string;
};


export type StudentSupportRequest = {
  id: string;
  created_at: string;
  updated_at: string;

  student_id: string;
  engagement_id: string | null;
  portal_link_id: string | null;

  category: PortalSupportCategory;
  message: string;

  status: PortalSupportStatus;

  admin_note: string | null;
  resolved_at: string | null;
};


export type PortalSupportRequest = Pick<
  StudentSupportRequest,
  | "id"
  | "created_at"
  | "category"
  | "message"
  | "status"
  | "resolved_at"
>;


export type PortalOnboarding = {
  status:
    | "awaiting_intake"
    | "review"
    | "ready"
    | "complete";

  timezone: string | null;

  target_outcome: string | null;
  target_date: string | null;

  intake_completed_at: string | null;
  reviewed_at: string | null;
};


export type PortalTutor = {
  name: string;
  headline: string | null;
  timezone: string | null;
  verified: boolean;
};


export type PortalSession =
  TutoringSession & {
    meeting_url: string | null;
  };


export type PortalContext = {
  link: StudentPortalLink;

  student: Student;

  engagement:
    | TutoringEngagement
    | null;

  plan: LearningPlanItem[];

  sessions: PortalSession[];

  homework: Homework[];

  resources: LearningResource[];

  submissions: HomeworkSubmission[];

  tutorName:
    | string
    | null;

  tutor:
    | PortalTutor
    | null;

  onboarding:
    | PortalOnboarding
    | null;

  supportRequests:
    PortalSupportRequest[];

  progressReports:
    ProgressReport[];
};


/* ==========================================================================
   PORTAL TOKEN HELPERS
   ========================================================================== */

const tokenPattern =
  /^[A-Za-z0-9_-]{40,128}$/;


export function generatePortalToken() {
  return randomBytes(32)
    .toString("base64url");
}


export function normalizePortalToken(
  value: string
) {
  const token =
    String(
      value || ""
    ).trim();

  return tokenPattern.test(
    token
  )
    ? token
    : null;
}


export function hashPortalToken(
  token: string
) {
  return createHash(
    "sha256"
  )
    .update(token)
    .digest("hex");
}


export function portalTokenPreview(
  token: string
) {
  return `${token.slice(
    0,
    5
  )}…${token.slice(-4)}`;
}


/* ==========================================================================
   URL SAFETY
   ========================================================================== */

export function safeExternalUrl(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return null;
  }

  try {
    const url =
      new URL(value);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}


/* ==========================================================================
   PORTAL LINK VALIDATION
   ========================================================================== */

export function isPortalLinkExpired(
  link: Pick<
    StudentPortalLink,
    "expires_at"
  >
) {
  if (!link.expires_at) {
    return false;
  }

  return (
    new Date(
      link.expires_at
    ).getTime() <=
    Date.now()
  );
}


/* ==========================================================================
   RESOLVE PORTAL LINK
   ========================================================================== */

export async function resolvePortalLink(
  tokenInput: string
) {
  const token =
    normalizePortalToken(
      tokenInput
    );

  if (!token) {
    return null;
  }


  const supabase =
    createAdminClient();


  const tokenHash =
    hashPortalToken(
      token
    );


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "student_portal_links"
      )
      .select("*")
      .eq(
        "token_hash",
        tokenHash
      )
      .is(
        "revoked_at",
        null
      )
      .maybeSingle();


  if (
    error ||
    !data
  ) {
    return null;
  }


  const link =
    data as StudentPortalLink;


  if (
    isPortalLinkExpired(
      link
    )
  ) {
    return null;
  }


  return link;
}


/* ==========================================================================
   GET STUDENT PORTAL CONTEXT
   ========================================================================== */

export async function getPortalContext(
  tokenInput: string
): Promise<
  PortalContext | null
> {
  /* ------------------------------------------------------------------------
     RESOLVE ACCESS LINK
     ------------------------------------------------------------------------ */

  const link =
    await resolvePortalLink(
      tokenInput
    );


  if (!link) {
    return null;
  }


  const supabase =
    createAdminClient();


  /* ------------------------------------------------------------------------
     BASE STUDENT DATA
     ------------------------------------------------------------------------ */

  const [
    studentResult,
    engagementResult,
    onboardingResult,
    supportResult,
  ] =
    await Promise.all([
      supabase
        .from("students")
        .select(
          `
            id,
            created_at,
            updated_at,
            source_lead_id,
            name,
            email,
            phone,
            country,
            academic_level,
            institution,
            programme,
            curriculum,
            status,
            notes
          `
        )
        .eq(
          "id",
          link.student_id
        )
        .single(),

      supabase
        .from(
          "tutoring_engagements"
        )
        .select(
          `
            id,
            created_at,
            updated_at,
            student_id,
            source_lead_id,
            tutor_id,
            subject,
            title,
            module,
            goal,
            target,
            start_date,
            end_date,
            status,
            frequency,
            session_duration_minutes,
            currency,
            current_focus,
            confidence,
            upcoming_deadline,
            preferred_learning_style,
            weak_topics,
            assessment_summary,
            notes,
            student_rate,
            tutor_rate
          `
        )
        .eq(
          "student_id",
          link.student_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from(
          "student_onboarding"
        )
        .select(
          `
            status,
            target_outcome,
            target_date,
            intake_completed_at,
            reviewed_at
          `
        )
        .eq(
          "student_id",
          link.student_id
        )
        .maybeSingle(),

      supabase
        .from(
          "student_support_requests"
        )
        .select(
          `
            id,
            created_at,
            category,
            message,
            status,
            resolved_at
          `
        )
        .eq(
          "student_id",
          link.student_id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(12),
    ]);


  /* ------------------------------------------------------------------------
     STUDENT MUST EXIST
     ------------------------------------------------------------------------ */

  if (
    studentResult.error ||
    !studentResult.data
  ) {
    return null;
  }


  const student =
    studentResult.data as Student;


  const engagements =
    (
      engagementResult.data ||
      []
    ) as TutoringEngagement[];


  /*
   * Prefer the currently active tutoring engagement.
   * If none is active, use the most recently created engagement.
   */
  const engagement =
    engagements.find(
      (item) =>
        item.status ===
        "active"
    ) ||
    engagements[0] ||
    null;


  const onboarding =
    (
      onboardingResult.data ||
      null
    ) as PortalOnboarding | null;


  const supportRequests =
    (
      supportResult.data ||
      []
    ) as PortalSupportRequest[];


  /* ------------------------------------------------------------------------
     DEFAULT PORTAL DATA
     ------------------------------------------------------------------------ */

  let plan:
    LearningPlanItem[] =
    [];

  let sessions:
    PortalSession[] =
    [];

  let homework:
    Homework[] =
    [];

  let resources:
    LearningResource[] =
    [];

  let submissions:
    HomeworkSubmission[] =
    [];

  let tutorName:
    | string
    | null =
    null;

  let tutor:
    | PortalTutor
    | null =
    null;

  let progressReports:
    ProgressReport[] =
    [];


  /* ------------------------------------------------------------------------
     ENGAGEMENT DATA
     ------------------------------------------------------------------------ */

  if (engagement) {
    const [
      planResult,
      sessionResult,
      homeworkResult,
      resourceResult,
      submissionResult,
      progressResult,
    ] =
      await Promise.all([
        /* ------------------------------------------------------------------
           LEARNING PLAN
           ------------------------------------------------------------------ */

        supabase
          .from(
            "learning_plan_items"
          )
          .select(
            `
              id,
              created_at,
              updated_at,
              engagement_id,
              topic,
              objective,
              priority,
              progress_status,
              mastery_percent,
              last_assessed_at,
              strength_note,
              next_step,
              sort_order,
              notes
            `
          )
          .eq(
            "engagement_id",
            engagement.id
          )
          .order(
            "sort_order"
          )
          .order(
            "created_at"
          ),

        /* ------------------------------------------------------------------
           SESSIONS
           ------------------------------------------------------------------ */

        supabase
          .from(
            "tutoring_sessions"
          )
          .select(
            `
              id,
              created_at,
              updated_at,
              engagement_id,
              tutor_id,
              scheduled_for,
              completed_at,
              duration_minutes,
              status,
              topic,
              lesson_notes,
              understanding_rating,
              next_topic,
              homework_summary,
              meeting_url,
              currency,
              student_rate,
              tutor_rate
            `
          )
          .eq(
            "engagement_id",
            engagement.id
          )
          .order(
            "scheduled_for",
            {
              ascending: false,
              nullsFirst:
                false,
            }
          ),

        /* ------------------------------------------------------------------
           HOMEWORK
           ------------------------------------------------------------------ */

        supabase
          .from("homework")
          .select(
            `
              id,
              created_at,
              updated_at,
              engagement_id,
              session_id,
              title,
              description,
              due_date,
              status,
              tutor_feedback
            `
          )
          .eq(
            "engagement_id",
            engagement.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        /* ------------------------------------------------------------------
           LEARNING RESOURCES
           ------------------------------------------------------------------ */

        supabase
          .from(
            "learning_resources"
          )
          .select(
            `
              id,
              created_at,
              engagement_id,
              session_id,
              title,
              resource_type,
              url,
              note
            `
          )
          .eq(
            "engagement_id",
            engagement.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          ),

        /* ------------------------------------------------------------------
           HOMEWORK SUBMISSIONS
           ------------------------------------------------------------------ */

        supabase
          .from(
            "homework_submissions"
          )
          .select(
            `
              id,
              created_at,
              updated_at,
              homework_id,
              student_id,
              portal_link_id,
              note,
              submission_url,
              submitted_at
            `
          )
          .eq(
            "student_id",
            link.student_id
          )
          .order(
            "submitted_at",
            {
              ascending: false,
            }
          ),

        /* ------------------------------------------------------------------
           PROGRESS REPORTS
           ------------------------------------------------------------------ */

        supabase
          .from(
            "progress_reports"
          )
          .select("*")
          .eq(
            "engagement_id",
            engagement.id
          )
          .eq(
            "student_visible",
            true
          )
          .order(
            "period_end",
            {
              ascending: false,
            }
          )
          .limit(12),
      ]);


    plan =
      (
        planResult.data ||
        []
      ) as LearningPlanItem[];


    sessions =
      (
        sessionResult.data ||
        []
      ) as PortalSession[];


    homework =
      (
        homeworkResult.data ||
        []
      ) as Homework[];


    resources =
      (
        resourceResult.data ||
        []
      ) as LearningResource[];


    submissions =
      (
        submissionResult.data ||
        []
      ) as HomeworkSubmission[];


    progressReports =
      (
        progressResult.data ||
        []
      ) as ProgressReport[];


    /* ----------------------------------------------------------------------
       TUTOR INFORMATION
       ---------------------------------------------------------------------- */

    if (
      engagement.tutor_id
    ) {
      const {
        data: tutorData,
      } =
        await supabase
          .from("tutors")
          .select(
            `
              name,
              headline,
              timezone,
              verified
            `
          )
          .eq(
            "id",
            engagement.tutor_id
          )
          .maybeSingle();


      if (tutorData) {
        tutor =
          tutorData as PortalTutor;

        tutorName =
          tutor.name;
      }
    }
  }


  /* ------------------------------------------------------------------------
     UPDATE LAST PORTAL ACCESS
     ------------------------------------------------------------------------ */

  const accessedAt =
    new Date()
      .toISOString();


  await supabase
    .from(
      "student_portal_links"
    )
    .update({
      last_accessed_at:
        accessedAt,

      updated_at:
        accessedAt,
    })
    .eq(
      "id",
      link.id
    );


  /* ------------------------------------------------------------------------
     RETURN PORTAL CONTEXT
     ------------------------------------------------------------------------ */

  return {
    link,

    student,

    engagement,

    plan,

    sessions,

    homework,

    resources,

    submissions,

    tutorName,

    tutor,

    onboarding,

    supportRequests,

    progressReports,
  };
}

/* ==========================================================================
   MULTI-COURSE STUDENT PORTAL CONTEXT
   ========================================================================== */

export type PortalCourseOption = {
  id: string;

  subject: string;
  title: string;

  module: string | null;
  current_focus: string | null;

  tutor_id: string | null;
  tutorName: string | null;
};


export type PortalCourseContext =
  PortalContext & {
    courses:
      PortalCourseOption[];
  };


export async function getPortalCourseContext(
  tokenInput: string,
  requestedEngagementId?:
    | string
    | null,
): Promise<
  PortalCourseContext | null
> {
  /*
   * Start with the existing secure
   * student-level portal validation.
   */
  const base =
    await getPortalContext(
      tokenInput,
    );


  if (!base) {
    return null;
  }


  const supabase =
    createAdminClient();


  /*
   * One student may have multiple
   * active course engagements.
   */
  const {
    data:
      engagementData,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select("*")
      .eq(
        "student_id",
        base.student.id,
      )
      .eq(
        "status",
        "active",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );


  if (engagementError) {
    throw new Error(
      engagementError.message,
    );
  }


  const engagements =
    (
      engagementData ||
      []
    ) as TutoringEngagement[];


  const requested =
    requestedEngagementId
      ? engagements.find(
          (item) =>
            item.id ===
            requestedEngagementId,
        )
      : null;


  const selected =
    requested ||
    engagements.find(
      (item) =>
        item.id ===
        base.engagement?.id,
    ) ||
    engagements[0] ||
    base.engagement ||
    null;


  /*
   * Tutor names for the course switcher.
   */
  const tutorIds =
    [
      ...new Set(
        engagements
          .map(
            (item) =>
              item.tutor_id,
          )
          .filter(
            Boolean,
          ) as string[],
      ),
    ];


  const {
    data:
      courseTutorData,
    error:
      courseTutorError,
  } =
    tutorIds.length
      ? await supabase
          .from(
            "tutors",
          )
          .select(
            "id,name",
          )
          .in(
            "id",
            tutorIds,
          )
      : {
          data:
            [] as Array<{
              id: string;
              name: string;
            }>,

          error: null,
        };


  if (courseTutorError) {
    throw new Error(
      courseTutorError.message,
    );
  }


  const tutorNameById =
    new Map(
      (
        courseTutorData ||
        []
      ).map(
        (item) => [
          item.id,
          item.name,
        ],
      ),
    );


  const courses:
    PortalCourseOption[] =
    engagements.map(
      (item) => ({
        id:
          item.id,

        subject:
          item.subject,

        title:
          item.title,

        module:
          item.module,

        current_focus:
          item.current_focus,

        tutor_id:
          item.tutor_id,

        tutorName:
          item.tutor_id
            ? tutorNameById.get(
                item.tutor_id,
              ) ||
              null
            : null,
      }),
    );


  if (!selected) {
    return {
      ...base,
      courses,
    };
  }


  /*
   * Every item below is loaded only
   * for the selected engagement/course.
   */
  const [
    planResult,
    sessionResult,
    homeworkResult,
    resourceResult,
    progressResult,
    tutorResult,
    supportResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "learning_plan_items",
        )
        .select("*")
        .eq(
          "engagement_id",
          selected.id,
        )
        .order(
          "sort_order",
        )
        .order(
          "created_at",
        ),

      supabase
        .from(
          "tutoring_sessions",
        )
        .select("*")
        .eq(
          "engagement_id",
          selected.id,
        )
        .order(
          "scheduled_for",
          {
            ascending:
              false,

            nullsFirst:
              false,
          },
        ),

      supabase
        .from(
          "homework",
        )
        .select("*")
        .eq(
          "engagement_id",
          selected.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        ),

      supabase
        .from(
          "learning_resources",
        )
        .select("*")
        .eq(
          "engagement_id",
          selected.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        ),

      supabase
        .from(
          "progress_reports",
        )
        .select("*")
        .eq(
          "engagement_id",
          selected.id,
        )
        .eq(
          "student_visible",
          true,
        )
        .order(
          "period_end",
          {
            ascending:
              false,
          },
        ),

      selected.tutor_id
        ? supabase
            .from(
              "tutors",
            )
            .select(
              "name,headline,timezone,verified",
            )
            .eq(
              "id",
              selected.tutor_id,
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      supabase
        .from(
          "student_support_requests",
        )
        .select(
          `
            id,
            created_at,
            category,
            message,
            status,
            resolved_at
          `,
        )
        .eq(
          "student_id",
          base.student.id,
        )
        .eq(
          "engagement_id",
          selected.id,
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          },
        )
        .limit(20),
    ]);


  const queryError =
    [
      planResult.error,
      sessionResult.error,
      homeworkResult.error,
      resourceResult.error,
      progressResult.error,
      tutorResult.error,
      supportResult.error,
    ].find(Boolean);


  if (queryError) {
    throw new Error(
      queryError.message,
    );
  }


  const homeworkRows =
    (
      homeworkResult.data ||
      []
    ) as Homework[];


  const homeworkIds =
    homeworkRows.map(
      (item) =>
        item.id,
    );


  const submissionResult =
    homeworkIds.length
      ? await supabase
          .from(
            "homework_submissions",
          )
          .select("*")
          .eq(
            "student_id",
            base.student.id,
          )
          .in(
            "homework_id",
            homeworkIds,
          )
      : {
          data:
            [] as HomeworkSubmission[],

          error: null,
        };


  if (
    submissionResult.error
  ) {
    throw new Error(
      submissionResult.error.message,
    );
  }


  const selectedTutor =
    tutorResult.data as
      | PortalTutor
      | null;


  return {
    ...base,

    courses,

    engagement:
      selected,

    plan:
      (
        planResult.data ||
        []
      ) as LearningPlanItem[],

    sessions:
      (
        sessionResult.data ||
        []
      ) as PortalSession[],

    homework:
      homeworkRows,

    resources:
      (
        resourceResult.data ||
        []
      ) as LearningResource[],

    submissions:
      (
        submissionResult.data ||
        []
      ) as HomeworkSubmission[],

    tutorName:
      selectedTutor?.name ||
      null,

    tutor:
      selectedTutor,

    supportRequests:
      (
        supportResult.data ||
        []
      ) as PortalSupportRequest[],

    progressReports:
      (
        progressResult.data ||
        []
      ) as ProgressReport[],
  };
}

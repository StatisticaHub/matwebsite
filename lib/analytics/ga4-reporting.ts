import {
  createSign,
} from "node:crypto";


const GA4_SCOPE =
  "https://www.googleapis.com/auth/analytics.readonly";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";


export const tutoringFunnelEvents = [
  {
    eventName: "tutoring_form_view",
    label: "Form views",
  },
  {
    eventName: "tutoring_form_start",
    label: "Form starts",
  },
  {
    eventName: "tutoring_support_selected",
    label: "Support selected",
  },
  {
    eventName: "tutoring_requirements_started",
    label: "Requirements started",
  },
  {
    eventName: "tutoring_contact_reached",
    label: "Contact reached",
  },
  {
    eventName: "tutoring_submit_attempt",
    label: "Submit attempted",
  },
  {
    eventName: "generate_lead",
    label: "Successful lead",
  },
] as const;


type Ga4Stage = {
  eventName: string;
  label: string;
  users: number;
  events: number;
};


export type Ga4TutoringFunnelReport = {
  configured: boolean;
  propertyId: string;
  days: number;
  stages: Ga4Stage[];
  submitErrors: {
    users: number;
    events: number;
  };
  error?: string;
};


function reportingConfig() {
  return {
    propertyId:
      process.env.GA4_PROPERTY_ID?.trim() ||
      "",
    clientEmail:
      process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() ||
      "",
    privateKey:
      (
        process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY ||
        ""
      )
        .replace(/\\n/g, "\n")
        .trim(),
  };
}


export function ga4ReportingConfigStatus() {
  const config = reportingConfig();

  return {
    propertyConfigured:
      Boolean(config.propertyId),
    serviceAccountConfigured:
      Boolean(
        config.clientEmail &&
        config.privateKey
      ),
  };
}


function base64Url(
  input: string | Buffer,
) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}


async function accessToken() {
  const config = reportingConfig();

  if (
    !config.clientEmail ||
    !config.privateKey
  ) {
    throw new Error(
      "GA4 reporting service account is not configured."
    );
  }

  const now =
    Math.floor(Date.now() / 1000);

  const header = base64Url(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );

  const payload = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: GA4_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const unsigned =
    `${header}.${payload}`;

  const signer =
    createSign("RSA-SHA256");

  signer.update(unsigned);
  signer.end();

  const signature = base64Url(
    signer.sign(config.privateKey),
  );

  const assertion =
    `${unsigned}.${signature}`;

  const response =
    await fetch(
      GOOGLE_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams({
            grant_type:
              "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
          }),
        cache: "no-store",
      },
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.access_token
  ) {
    throw new Error(
      data.error_description ||
      data.error ||
      `Google OAuth returned HTTP ${response.status}.`
    );
  }

  return String(
    data.access_token
  );
}


export async function getGa4TutoringFunnel(
  days = 30,
): Promise<Ga4TutoringFunnelReport> {
  const config =
    reportingConfig();

  const configured =
    Boolean(
      config.propertyId &&
      config.clientEmail &&
      config.privateKey
    );

  const emptyStages =
    tutoringFunnelEvents.map(
      (stage) => ({
        ...stage,
        users: 0,
        events: 0,
      }),
    );

  if (!configured) {
    return {
      configured: false,
      propertyId:
        config.propertyId,
      days,
      stages:
        emptyStages,
      submitErrors: {
        users: 0,
        events: 0,
      },
    };
  }

  try {
    const token =
      await accessToken();

    const eventNames = [
      ...tutoringFunnelEvents.map(
        (stage) =>
          stage.eventName,
      ),
      "tutoring_submit_error",
    ];

    const response =
      await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
          config.propertyId,
        )}:runReport`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              dateRanges: [
                {
                  startDate:
                    `${Math.max(
                      days - 1,
                      0,
                    )}daysAgo`,
                  endDate:
                    "today",
                },
              ],
              dimensions: [
                {
                  name:
                    "eventName",
                },
              ],
              metrics: [
                {
                  name:
                    "totalUsers",
                },
                {
                  name:
                    "eventCount",
                },
              ],
              dimensionFilter: {
                filter: {
                  fieldName:
                    "eventName",
                  inListFilter: {
                    values:
                      eventNames,
                  },
                },
              },
              limit: 100,
            }),
          cache: "no-store",
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        `GA4 Data API returned HTTP ${response.status}.`
      );
    }

    const values =
      new Map<
        string,
        {
          users: number;
          events: number;
        }
      >();

    for (
      const row of
      data.rows || []
    ) {
      const eventName =
        String(
          row.dimensionValues?.[0]
            ?.value || "",
        );

      const users =
        Number(
          row.metricValues?.[0]
            ?.value || 0,
        );

      const events =
        Number(
          row.metricValues?.[1]
            ?.value || 0,
        );

      values.set(
        eventName,
        {
          users:
            Number.isFinite(users)
              ? users
              : 0,
          events:
            Number.isFinite(events)
              ? events
              : 0,
        },
      );
    }

    const stages =
      tutoringFunnelEvents.map(
        (stage) => ({
          ...stage,
          users:
            values.get(
              stage.eventName,
            )?.users || 0,
          events:
            values.get(
              stage.eventName,
            )?.events || 0,
        }),
      );

    const submitErrors =
      values.get(
        "tutoring_submit_error",
      ) || {
        users: 0,
        events: 0,
      };

    return {
      configured: true,
      propertyId:
        config.propertyId,
      days,
      stages,
      submitErrors,
    };
  } catch (error) {
    return {
      configured: true,
      propertyId:
        config.propertyId,
      days,
      stages:
        emptyStages,
      submitErrors: {
        users: 0,
        events: 0,
      },
      error:
        error instanceof Error
          ? error.message
          : "Unknown GA4 reporting error.",
    };
  }
}


import {
  cookies,
} from "next/headers";

import {
  DEFAULT_TIME_ZONE,
  normalizeTimeZone,
} from "@/lib/time-zone";

export const ADMIN_TIME_ZONE_COOKIE =
  "mat_admin_timezone";

export async function getAdminTimeZone() {
  const store =
    await cookies();

  return normalizeTimeZone(
    store.get(
      ADMIN_TIME_ZONE_COOKIE,
    )?.value,
    DEFAULT_TIME_ZONE,
  );
}

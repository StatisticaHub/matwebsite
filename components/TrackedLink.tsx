"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

type Props = Omit<ComponentProps<typeof Link>, "children"> & {
  children: ReactNode;
  trackingId: string;
  contentType?: string;
};

export default function TrackedLink({ children, trackingId, contentType = "tutoring_cta", onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        const analyticsWindow = window as AnalyticsWindow;
        analyticsWindow.gtag?.("event", "select_content", {
          content_type: contentType,
          item_id: trackingId,
          page_location: window.location.pathname,
        });
      }}
    >
      {children}
    </Link>
  );
}

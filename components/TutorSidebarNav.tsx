"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import TutorSignOutButton from "@/components/TutorSignOutButton";

type Props = {
  tutorName: string;
  email: string;
};

const primaryLinks = [
  {
    href: "/tutor",
    label: "Dashboard",
  },
  {
    href: "/tutor/students",
    label: "My Students",
  },
  {
    href: "/tutor/sessions",
    label: "Sessions",
  },
  {
    href: "/tutor/progress",
    label: "Progress",
  },
  {
    href: "/tutor/availability",
    label: "Availability",
  },
];

export default function TutorSidebarNav({
  tutorName,
  email,
}: Props) {
  const pathname = usePathname();

  function active(href: string) {
    if (href === "/tutor") {
      return pathname === "/tutor";
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <nav
        className="tutor-university-nav"
        aria-label="Tutor portal"
      >
        <span className="tutor-nav-label">
          Teaching
        </span>

        {primaryLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              active(item.href)
                ? "is-active"
                : undefined
            }
          >
            {item.label}
          </Link>
        ))}

        <span className="tutor-nav-label tutor-nav-label-secondary">
          Additional
        </span>

        <Link
          href="/tutor/trials"
          className={
            active("/tutor/trials")
              ? "is-active"
              : undefined
          }
        >
          Trial Sessions
        </Link>
      </nav>

      <div className="tutor-sidebar-footer">
        <div className="tutor-account-avatar">
          {tutorName
            .trim()
            .slice(0, 1)
            .toUpperCase() || "T"}
        </div>

        <div className="tutor-account-copy">
          <strong>
            {tutorName}
          </strong>

          <small>
            {email}
          </small>
        </div>

        <TutorSignOutButton />
      </div>
    </>
  );
}

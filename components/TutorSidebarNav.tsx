"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import TutorSignOutButton from "@/components/TutorSignOutButton";

type Props = {
  tutorName: string;
  email: string;
};

const mainItems = [
  { href: "/tutor", label: "Dashboard" },
  { href: "/tutor/students", label: "Students" },
  { href: "/tutor/sessions", label: "Calendar" },
  { href: "/tutor/assignments", label: "Assignments" },
  { href: "/tutor/materials", label: "Resources" },
  { href: "/tutor/progress", label: "Progress" },
  { href: "/tutor/availability", label: "Availability" },
  { href: "/tutor/trials", label: "Trials" },
];

export default function TutorSidebarNav({
  tutorName,
  email,
}: Props) {
  const pathname =
    usePathname();

  return (
    <>
      <nav
        className="tutor-sidebar-nav"
        aria-label="Tutor workspace"
      >
        {mainItems.map((item) => {
          const active =
            item.href === "/tutor"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

          return (
            <Link
              href={item.href}
              className={
                active
                  ? "is-active"
                  : undefined
              }
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="tutor-sidebar-nav-divider" />

        <Link
          href="/"
          target="_blank"
        >
          View website ↗
        </Link>
      </nav>

      <div className="tutor-sidebar-footer">
        <span>{tutorName}</span>
        <small>{email}</small>
        <TutorSignOutButton />
      </div>
    </>
  );
}

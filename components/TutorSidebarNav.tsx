"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import TutorSignOutButton from "@/components/TutorSignOutButton";

type NavItem = {
  href: string;
  label: string;
  external?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        href: "/tutor",
        label: "Overview",
      },
    ],
  },

  {
    label: "Teaching",
    items: [
      {
        href: "/tutor/sessions",
        label: "Sessions",
      },
      {
        href: "/tutor/students",
        label: "Students",
      },
      {
        href: "/tutor/materials",
        label: "Materials",
      },
    ],
  },

  {
    label: "Learning",
    items: [
      {
        href: "/tutor/progress",
        label: "Progress",
      },
      {
        href: "/tutor/retention",
        label: "Retention",
      },
    ],
  },

  {
    label: "Work",
    items: [
      {
        href: "/tutor/trials",
        label: "Trials",
      },
      {
        href: "/tutor/availability",
        label: "Availability",
      },
    ],
  },

  {
    label: "MAT",
    items: [
      {
        href: "/",
        label: "View website ↗",
        external: true,
      },
    ],
  },
];

function isActive(
  pathname: string,
  href: string,
) {
  if (href === "/tutor") {
    return pathname === "/tutor";
  }

  if (href === "/") {
    return false;
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export default function TutorSidebarNav({
  tutorName,
  email,
}: {
  tutorName: string;
  email: string;
}) {
  const pathname =
    usePathname();

  const [
    open,
    setOpen,
  ] = useState(false);

  return (
    <>
      <button
        className="tutor-mobile-menu-button"
        type="button"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (value) => !value,
          )
        }
      >
        <span>
          Navigation
        </span>

        <strong>
          {open ? "Close" : "Menu"}
        </strong>
      </button>

      <div
        className={`tutor-sidebar-content ${
          open
            ? "is-open"
            : ""
        }`}
      >
        <nav
          className="tutor-workspace-nav"
          aria-label="Tutor portal"
        >
          {groups.map(
            (group) => (
              <div
                className="tutor-nav-group"
                key={group.label}
              >
                <span className="tutor-nav-group-label">
                  {group.label}
                </span>

                <div className="tutor-nav-links">
                  {group.items.map(
                    (item) => {
                      const active =
                        isActive(
                          pathname,
                          item.href,
                        );

                      return (
                        <Link
                          key={
                            item.href
                          }
                          href={
                            item.href
                          }
                          target={
                            item.external
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            item.external
                              ? "noreferrer"
                              : undefined
                          }
                          className={
                            active
                              ? "is-active"
                              : undefined
                          }
                          onClick={() =>
                            setOpen(
                              false,
                            )
                          }
                        >
                          <span>
                            {
                              item.label
                            }
                          </span>

                          {!item.external &&
                            active && (
                              <i
                                aria-hidden="true"
                              />
                            )}
                        </Link>
                      );
                    },
                  )}
                </div>
              </div>
            ),
          )}
        </nav>

        <div className="tutor-sidebar-footer">
          <div className="tutor-account-copy">
            <span>
              {tutorName}
            </span>

            <small>
              {email}
            </small>
          </div>

          <TutorSignOutButton />
        </div>
      </div>
    </>
  );
}

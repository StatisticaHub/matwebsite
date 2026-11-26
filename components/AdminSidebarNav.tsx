"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  openSessionRequests: number;
  openGeneralSupport: number;
};

type NavItem = {
  href: string;
  label: string;
  badge?: number;
  external?: boolean;
};

export default function AdminSidebarNav({
  openSessionRequests,
  openGeneralSupport,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: Array<{
    label: string;
    items: NavItem[];
  }> = [
    {
      label: "CRM",
      items: [
        { href: "/admin", label: "Lead inbox" },
        { href: "/admin/follow-ups", label: "Follow-ups" },
        { href: "/admin/matching", label: "Tutor matching" },
      ],
    },
    {
      label: "Teaching",
      items: [
        { href: "/admin/students", label: "Students" },
        { href: "/admin/onboarding", label: "Student onboarding" },
        { href: "/admin/student-access", label: "Student access" },
        {
          href: "/admin/sessions",
          label: "Sessions",
          badge: openSessionRequests,
        },
        { href: "/admin/progress", label: "Progress" },
        { href: "/admin/retention", label: "Retention" },
      ],
    },
    {
      label: "Tutors",
      items: [
        { href: "/admin/tutors", label: "Tutor records" },
        {
          href: "/admin/tutor-applications",
          label: "Tutor applications",
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          href: "/admin/academic-knowledge",
          label: "Academic knowledge",
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          href: "/admin/portals",
          label: "Student portals",
          badge: openGeneralSupport,
        },
        { href: "/admin/notifications", label: "Notifications" },
        { href: "/admin/testimonials", label: "Testimonials" },
        { href: "/admin/nurture", label: "Lead nurture" },
      ],
    },
    {
      label: "Growth",
      items: [
        { href: "/admin/content-growth", label: "Content growth" },
        { href: "/admin/analytics", label: "Analytics" },
        {
          href: "/admin/business-intelligence",
          label: "Business intelligence",
        },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/system-health", label: "System health" },
        {
          href: "/",
          label: "View website ↗",
          external: true,
        },
      ],
    },
  ];

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <button
        type="button"
        className="admin-nav-toggle"
        aria-expanded={open}
        aria-controls="admin-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Navigation</span>
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>

      <nav
        id="admin-navigation"
        className={`admin-nav ${open ? "is-open" : ""}`}
        aria-label="Admin navigation"
      >
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <div className="admin-nav-group-title">
              {group.label}
            </div>

            <div className="admin-nav-group-links">
              {group.items.map((item) => {
                const active =
                  !item.external && isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={
                      item.external
                        ? "noreferrer"
                        : undefined
                    }
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={`admin-nav-link ${
                      active ? "is-active" : ""
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.label}</span>

                    {Boolean(item.badge) && (
                      <strong className="admin-nav-badge">
                        {item.badge}
                      </strong>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

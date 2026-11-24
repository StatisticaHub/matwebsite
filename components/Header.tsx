"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/learn", label: "Learn" },
  { href: "/subjects", label: "Subjects" },
  { href: "/tutoring", label: "Tutoring" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  const internalArea =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/portal" ||
    pathname.startsWith("/portal/") ||
    pathname === "/tutor" ||
    pathname.startsWith("/tutor/");

  if (internalArea) {
    return null;
  }

  return (
    <header className="mat-public-header">
      <div className="shell mat-public-header-inner">
        <Link
          href="/"
          className="mat-public-brand"
          aria-label="My Academic Tutor home"
        >
          <span className="mat-public-brand-mark">MAT</span>

          <span className="mat-public-brand-copy">
            <strong>My Academic Tutor</strong>
            <small>Learn with understanding.</small>
          </span>
        </Link>

        <nav
          className="mat-public-nav"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mat-public-actions">
          <Link
            href="/portal/login"
            className="mat-public-portal-link"
          >
            Student portal
          </Link>

          <Link
            href="/tutor/login"
            className="mat-public-portal-link"
          >
            Tutor portal
          </Link>

          <Link
            href="/find-a-tutor"
            className="mat-public-request"
          >
            Request tutoring
          </Link>
        </div>

        <details className="mat-mobile-menu">
          <summary>
            <span>Menu</span>
            <span className="mat-mobile-menu-icon">
              <i />
              <i />
              <i />
            </span>
          </summary>

          <div className="mat-mobile-menu-panel">
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mat-mobile-menu-divider" />

            <span className="mat-mobile-menu-label">
              Existing students & tutors
            </span>

            <Link
              href="/portal/login"
              className="mat-mobile-portal"
            >
              Student portal
              <span>→</span>
            </Link>

            <Link
              href="/tutor/login"
              className="mat-mobile-portal"
            >
              Tutor portal
              <span>→</span>
            </Link>

            <Link
              href="/find-a-tutor"
              className="button button-primary"
            >
              Request tutoring
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

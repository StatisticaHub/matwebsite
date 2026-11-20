import Image from "next/image";
import Link from "next/link";

const nav = [
  ["Subjects", "/subjects"],
  ["Tutoring", "/tutoring"],
  ["Learning Hub", "/learn"],
  ["About", "/about"],
] as const;

import TrackedLink from "@/components/TrackedLink";
export default function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="My Academic Tutor home">
          <Image
            src="/logo.png"
            width={42}
            height={42}
            alt=""
            className="brand-logo"
            priority
          />
          <span>My Academic Tutor</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>

        <TrackedLink
          className="button button-primary header-cta"
          href="/find-a-tutor"
          trackingId="header_request_tutoring"
        >
          Request tutoring
        </TrackedLink>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">Menu</summary>

          <nav>
            {nav.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}

            <TrackedLink
              href="/find-a-tutor"
              trackingId="mobile_menu_request_tutoring"
            >
              <strong>Request tutoring</strong>
            </TrackedLink>
          </nav>
        </details>
      </div>
    </header>
  );
}

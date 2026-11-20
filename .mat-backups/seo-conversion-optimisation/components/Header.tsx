import Image from "next/image";
import Link from "next/link";

const nav = [
  ["Subjects", "/subjects"],
  ["Tutoring", "/tutoring"],
  ["Learning Hub", "/learn"],
  ["About", "/about"],
] as const;

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

        <Link className="button button-primary header-cta" href="/find-a-tutor">
          Request tutoring
        </Link>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">Menu</summary>

          <nav>
            {nav.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}

            <Link href="/find-a-tutor">
              <strong>Request tutoring</strong>
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}

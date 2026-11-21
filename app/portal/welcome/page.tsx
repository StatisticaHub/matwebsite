import Link from "next/link";

import StudentPasswordSetupForm from "@/components/StudentPasswordSetupForm";

export const metadata = {
  title: "Activate Student Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  token_hash?: string;
  type?: string;
}>;

export default async function StudentWelcomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;

  return (
    <main className="tutor-auth-shell">
      <div className="tutor-auth-card">
        <Link href="/" className="tutor-wordmark">
          My Academic Tutor
        </Link>

        <span className="tutor-kicker">
          Student Portal setup
        </span>

        <h1>
          Activate your learning portal
        </h1>

        <p>
          Choose a secure password to finish setting up
          your MAT student account.
        </p>

        <StudentPasswordSetupForm
          tokenHash={String(query.token_hash || "")}
          type={String(query.type || "")}
        />
      </div>
    </main>
  );
}

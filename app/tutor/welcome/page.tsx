import Link from "next/link";
import TutorPasswordSetupForm from "@/components/TutorPasswordSetupForm";

export const metadata = {
  title: "Set up tutor portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  token_hash?: string;
  type?: string;
}>;

export default async function TutorWelcomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const tokenHash = String(query.token_hash || "");
  const type = String(query.type || "");

  return (
    <main className="tutor-auth-shell">
      <div className="tutor-auth-card">
        <Link href="/" className="tutor-wordmark">
          My Academic Tutor
        </Link>
        <span className="tutor-kicker">Tutor portal setup</span>
        <h1>Choose your portal password</h1>
        <p>Set a secure password to continue to your tutor profile and onboarding.</p>
        <TutorPasswordSetupForm tokenHash={tokenHash} type={type} />
      </div>
    </main>
  );
}

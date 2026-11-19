"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function TutorSignOutButton() {
  const router = useRouter();
  return <button className="tutor-signout" type="button" onClick={async () => {
    await createClient().auth.signOut();
    router.push("/tutor/login");
    router.refresh();
  }}>Sign out</button>;
}

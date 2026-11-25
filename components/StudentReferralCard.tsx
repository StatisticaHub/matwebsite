"use client";

import {
  useState,
} from "react";


type Props = {
  referralUrl: string;
};


export default function StudentReferralCard({
  referralUrl,
}: Props) {
  const [
    copied,
    setCopied,
  ] = useState(false);


  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(
        referralUrl,
      );


      setCopied(true);


      window.setTimeout(
        () =>
          setCopied(false),
        2200,
      );
    } catch {
      setCopied(false);
    }
  }


  return (
    <section
      className="portal-referral-compact"
      aria-label="Refer someone to My Academic Tutor"
    >

      <div className="portal-referral-compact-copy">

        <span>
          Refer someone to MAT
        </span>

        <div>
          <strong>
            Know someone who could use tutoring?
          </strong>

          <p>
            Share your personal MAT link and help them get started.
          </p>
        </div>

      </div>


      <button
        type="button"
        onClick={
          copyReferralLink
        }
        className="portal-referral-compact-button"
      >
        {copied
          ? "Copied ✓"
          : "Copy link"}
      </button>

    </section>
  );
}

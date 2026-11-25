"use client";

import {
  useState,
} from "react";

type Props = {
  referralCode: string;
  referralUrl: string;
};

export default function StudentReferralCard({
  referralCode,
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
        () => setCopied(false),
        2200,
      );
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="portal-panel portal-referral-card">
      <div className="portal-referral-copy">
        <span className="portal-referral-eyebrow">
          REFER SOMEONE TO MAT
        </span>

        <h2>
          Know someone who could use
          one-to-one tutoring?
        </h2>

        <p>
          Share your personal MAT referral
          link. They can explain what they
          are studying and request tutoring
          in the usual way.
        </p>

        <small>
          Referral code:{" "}
          <strong>
            {referralCode}
          </strong>
        </small>
      </div>

      <div className="portal-referral-action">
        <div>
          {referralUrl}
        </div>

        <button
          type="button"
          onClick={copyReferralLink}
          className="portal-referral-button"
        >
          {copied
            ? "Copied"
            : "Copy referral link"}
        </button>
      </div>

      <p className="portal-referral-note">
        There is currently no cash reward
        or referral credit attached to this
        link. It simply helps MAT understand
        how new students found us.
      </p>
    </section>
  );
}

"use client";

import {
  useEffect,
  useState,
} from "react";


const greetings = [
  {
    language: "HI",
    text: "वापसी पर स्वागत है",
  },
  {
    language: "FR",
    text: "Bon retour",
  },
  {
    language: "ES",
    text: "Bienvenido de nuevo",
  },
  {
    language: "AR",
    text: "مرحبًا بعودتك",
  },
  {
    language: "DE",
    text: "Willkommen zurück",
  },
  {
    language: "EN",
    text: "Welcome back",
  },
];


export default function StudentWelcomeGreeting({
  name,
  animate = true,
}: {
  name: string;
  animate?: boolean;
}) {
  const firstName =
    String(name || "")
      .trim()
      .split(/\s+/)[0] ||
    "there";


  const finalIndex =
    greetings.length - 1;


  const [
    index,
    setIndex,
  ] =
    useState(
      finalIndex,
    );


  const [
    transitioning,
    setTransitioning,
  ] =
    useState(false);


  useEffect(
    () => {
      if (!animate) {
        setIndex(
          finalIndex,
        );

        return;
      }


      const reducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;


      const alreadyPlayed =
        window.sessionStorage.getItem(
          "mat-welcome-sequence-v1",
        ) === "played";


      if (
        reducedMotion ||
        alreadyPlayed
      ) {
        setIndex(
          finalIndex,
        );

        return;
      }


      setIndex(0);
      setTransitioning(
        true,
      );


      let current = 0;

      const timer =
        window.setInterval(
          () => {
            current += 1;

            if (
              current >=
              finalIndex
            ) {
              setIndex(
                finalIndex,
              );

              setTransitioning(
                false,
              );

              window.sessionStorage.setItem(
                "mat-welcome-sequence-v1",
                "played",
              );

              window.clearInterval(
                timer,
              );

              return;
            }


            setIndex(
              current,
            );
          },
          430,
        );


      return () => {
        window.clearInterval(
          timer,
        );
      };
    },
    [
      animate,
      finalIndex,
    ],
  );


  const greeting =
    greetings[index];


  return (
    <div
      className={[
        "portal-welcome-greeting",
        transitioning
          ? "is-transitioning"
          : "is-settled",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
    >
      <div className="portal-welcome-language">
        <span>
          {
            greeting.language
          }
        </span>

        <i
          aria-hidden="true"
        />
      </div>


      <h1
        key={
          greeting.language
        }
        className="portal-welcome-greeting-text"
      >
        {
          greeting.text
        }

        {index ===
          finalIndex && (
          <>
            ,{" "}
            <span>
              {
                firstName
              }
            </span>
            .
          </>
        )}
      </h1>


      <p className="portal-welcome-greeting-caption">
        {transitioning
          ? "Your learning space, wherever you learn from."
          : "Good to have you back. Here’s where to continue."}
      </p>
    </div>
  );
}

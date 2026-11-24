import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { subjects } from "@/lib/tutoring-data";


const matSans = Manrope({
  subsets: ["latin"],
  variable: "--mat-font-sans",
  display: "swap",
});

const matSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--mat-font-serif",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: "My Academic Tutor",

  title: {
    default: "My Academic Tutor | Online Learning, Courses & Personalised Tutoring",
    template: "%s | My Academic Tutor",
  },

  description:
    "Online learning, free educational resources and personalised one-to-one tutoring for school, university, Master's and research-level students across Mathematics, Statistics, Science, Data Science, Computer Science, Bioinformatics and Research Methods.",

  creator: "My Academic Tutor",
  publisher: "My Academic Tutor",

  category: "education",

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "My Academic Tutor",
    title: "My Academic Tutor | Online Learning, Courses & Personalised Tutoring",
    description:
      "Personalised online tutoring designed to build understanding, confidence and independent problem-solving from school to postgraduate study.",
  },

  twitter: {
    card: "summary",
    title: "My Academic Tutor | Online Learning, Courses & Personalised Tutoring",
    description:
      "One-to-one online tutoring from school to postgraduate and research-level study.",
  },
};

const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${siteUrl}/#organisation`,
  name: "My Academic Tutor",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  email: "Contact@myacademictutor.com",
  description:
    "Online learning, educational resources and personalised one-to-one tutoring for school, university, postgraduate and research-level learners.",
  areaServed: "Worldwide",
  knowsAbout: subjects.map((subject) => subject.name),
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "My Academic Tutor",
  publisher: {
    "@id": `${siteUrl}/#organisation`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${matSans.variable} ${matSerif.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organisationSchema).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />

        <Header />

        <main>{children}</main>

        <Footer />
      </body>

      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
        <GoogleAnalytics
          gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
        />
      ) : null}
    </html>
  );
}

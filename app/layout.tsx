import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.myacademictutor.com"),
  title: {
    default: "My Academic Tutor | Personalised 1:1 Online Tutoring",
    template: "%s | My Academic Tutor",
  },
  description: "Personalised one-to-one online tutoring from secondary school to postgraduate study, with learning resources, subject support, exam preparation, statistics, coding and research guidance.",
  openGraph: {
    title: "My Academic Tutor",
    description: "Personalised tutoring for deeper understanding — from school study to university, postgraduate and research-level learning.",
    type: "website",
    siteName: "My Academic Tutor",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header /><main>{children}</main><Footer /></body></html>;
}

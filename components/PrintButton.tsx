"use client";

export default function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return <button className="button button-secondary progress-print-button" type="button" onClick={() => window.print()}>{label}</button>;
}

import type { Metadata } from "next";

import { SubmissionForm } from "@/components/SubmissionForm";

export const metadata: Metadata = {
  title: "Trimite un text",
  description:
    "Trimite compunerea ta doamnei profesoare. Apare pe site după ce o aprobă.",
};

export default function PaginaTrimite() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-scris text-4xl leading-tight">Trimite un text</h1>
      <p className="mt-4 max-w-lectura font-scris text-lg leading-relaxed text-cerneala-slaba">
        Scrie compunerea ta aici. Ajunge la doamna profesoară, care o citește
        înainte să apară pe site.
      </p>
      <SubmissionForm />
    </main>
  );
}

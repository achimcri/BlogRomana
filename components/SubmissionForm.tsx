"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { trimitePostareElev } from "@/actions/submissions";
import type { RezultatActiune } from "@/lib/types";

export function SubmissionForm() {
  const [stare, actiune] = useActionState<RezultatActiune | null, FormData>(
    trimitePostareElev,
    null,
  );

  if (stare?.ok) {
    return <Confirmare />;
  }

  const eroriCamp = stare && !stare.ok ? (stare.erori ?? {}) : {};

  return (
    <form action={actiune} className="mt-10">
      {stare && !stare.ok && stare.mesajGeneral ? (
        <p
          role="alert"
          className="mb-6 border-l-2 border-pix bg-pix-deschis px-4 py-3 text-sm"
        >
          {stare.mesajGeneral}
        </p>
      ) : null}

      <fieldset className="border-l border-liniatura pl-5">
        <legend className="sr-only">Cine ești</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Camp
            nume="studentFirstName"
            eticheta="Prenume"
            eroare={eroriCamp.studentFirstName}
            autoComplete="given-name"
          />
          <Camp
            nume="studentLastName"
            eticheta="Nume de familie"
            eroare={eroriCamp.studentLastName}
            autoComplete="family-name"
          />
        </div>
        <div className="mt-5 sm:max-w-56">
          <Camp
            nume="studentClass"
            eticheta="Clasa"
            exemplu="a VI-a B"
            eroare={eroriCamp.studentClass}
          />
        </div>
        <p className="mt-4 max-w-lectura text-sm leading-relaxed text-cerneala-stinsa">
          Doamna profesoară vede numele tău întreg. Pe site apari cu prenumele
          și inițiala numelui, de exemplu „Maria P.”
        </p>
      </fieldset>

      <div className="mt-10">
        <Camp
          nume="title"
          eticheta="Titlul textului"
          eroare={eroriCamp.title}
          mare
        />
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium">Textul</p>
        <RichTextEditor placeholder="Scrie aici compunerea ta…" />
        {eroriCamp.contentHtml ? (
          <p role="alert" className="mt-2 text-sm text-pix">
            {eroriCamp.contentHtml}
          </p>
        ) : null}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-5">
        <ButonTrimite />
        <p className="text-sm text-cerneala-stinsa">
          Textul ajunge la doamna profesoară și apare pe site după ce îl aprobă.
        </p>
      </div>
    </form>
  );
}

function ButonTrimite() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-cerneala bg-cerneala px-6 py-3 text-sm font-medium text-hartie transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Se trimite…" : "Trimite textul"}
    </button>
  );
}

function Camp({
  nume,
  eticheta,
  eroare,
  exemplu,
  autoComplete,
  mare = false,
}: {
  nume: string;
  eticheta: string;
  eroare?: string;
  exemplu?: string;
  autoComplete?: string;
  mare?: boolean;
}) {
  const idEroare = `${nume}-eroare`;
  return (
    <div>
      <label htmlFor={nume} className="block text-sm font-medium">
        {eticheta}
      </label>
      <input
        id={nume}
        name={nume}
        type="text"
        required
        placeholder={exemplu}
        autoComplete={autoComplete}
        aria-invalid={eroare ? true : undefined}
        aria-describedby={eroare ? idEroare : undefined}
        className={`mt-1.5 w-full border bg-hartie px-3 py-2 ${
          mare ? "font-scris text-xl" : ""
        } ${eroare ? "border-pix" : "border-liniatura focus:border-cerneala"}`}
      />
      {eroare ? (
        <p id={idEroare} role="alert" className="mt-1.5 text-sm text-pix">
          {eroare}
        </p>
      ) : null}
    </div>
  );
}

function Confirmare() {
  return (
    <div className="mt-10 border-l-2 border-stilou bg-stilou-deschis px-6 py-6">
      <h2 className="font-scris text-2xl">Textul a ajuns la doamna profesoară</h2>
      <p className="mt-3 max-w-lectura leading-relaxed text-cerneala-slaba">
        Îl va citi și, dacă îl aprobă, va apărea pe pagina principală. Până
        atunci nu este vizibil pentru nimeni altcineva.
      </p>
      <a
        href="/trimite"
        className="mt-6 inline-block border-b border-stilou pb-0.5 text-stilou"
      >
        Trimite încă un text
      </a>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { actualizeazaSetari } from "@/actions/posts";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { RezultatActiune } from "@/lib/types";

export function SettingsForm({
  setari,
}: {
  setari: { siteTitle: string; siteTagline: string; aboutHtml: string };
}) {
  const [stare, actiune] = useActionState<RezultatActiune | null, FormData>(
    actualizeazaSetari,
    null,
  );

  const eroriCamp = stare && !stare.ok ? (stare.erori ?? {}) : {};

  return (
    <form action={actiune}>
      {stare?.ok && stare.mesaj ? (
        <p
          role="status"
          className="mb-6 border-l-2 border-stilou bg-stilou-deschis px-4 py-3 text-sm"
        >
          {stare.mesaj}
        </p>
      ) : null}

      <div>
        <label htmlFor="siteTitle" className="block text-sm font-medium">
          Titlul site-ului
        </label>
        <input
          id="siteTitle"
          name="siteTitle"
          type="text"
          required
          defaultValue={setari.siteTitle}
          className={`mt-1.5 w-full border bg-hartie px-3 py-2 ${
            eroriCamp.siteTitle
              ? "border-pix"
              : "border-liniatura focus:border-cerneala"
          }`}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="siteTagline" className="block text-sm font-medium">
          Subtitlu
        </label>
        <p className="mt-1 text-sm text-cerneala-stinsa">
          Apare pe pagina principală când nu există încă niciun text publicat.
        </p>
        <input
          id="siteTagline"
          name="siteTagline"
          type="text"
          defaultValue={setari.siteTagline}
          className="mt-1.5 w-full border border-liniatura bg-hartie px-3 py-2 focus:border-cerneala"
        />
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium">Pagina „Despre”</p>
        <RichTextEditor
          numeCamp="aboutHtml"
          continutInitial={setari.aboutHtml}
          placeholder="Scrie câteva rânduri despre acest blog…"
        />
      </div>

      <ButonSalvare />
    </form>
  );
}

function ButonSalvare() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 border border-cerneala bg-cerneala px-6 py-2.5 text-sm font-medium text-hartie transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Se salvează…" : "Salvează setările"}
    </button>
  );
}

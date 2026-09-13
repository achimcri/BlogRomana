"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { actualizeazaPostare, creeazaPostare } from "@/actions/posts";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { PostStatus, RezultatActiune } from "@/lib/types";

/**
 * Formularul de scriere/editare al profesoarei.
 *
 * Acelasi component pentru creare si editare: singura diferenta este daca
 * primeste `postare`. Asta tine cele doua ecrane identice, deci nu pot
 * diverge in timp.
 */
export function PostEditor({
  postare,
}: {
  postare?: {
    id: string;
    title: string;
    contentHtml: string;
    status: string;
  };
}) {
  const esteEditare = Boolean(postare);

  const [stare, actiune] = useActionState<RezultatActiune | null, FormData>(
    esteEditare ? actualizeazaPostare : creeazaPostare,
    null,
  );

  const eroriCamp = stare && !stare.ok ? (stare.erori ?? {}) : {};

  return (
    <form action={actiune}>
      {postare ? <input type="hidden" name="id" value={postare.id} /> : null}

      {stare && !stare.ok && stare.mesajGeneral ? (
        <p
          role="alert"
          className="mb-6 border-l-2 border-pix bg-pix-deschis px-4 py-3 text-sm"
        >
          {stare.mesajGeneral}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Titlu
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={postare?.title}
          className={`mt-1.5 w-full border bg-hartie px-3 py-2 font-scris text-2xl ${
            eroriCamp.title
              ? "border-pix"
              : "border-liniatura focus:border-cerneala"
          }`}
        />
        {eroriCamp.title ? (
          <p role="alert" className="mt-1.5 text-sm text-pix">
            {eroriCamp.title}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium">Text</p>
        <RichTextEditor continutInitial={postare?.contentHtml ?? ""} />
        {eroriCamp.contentHtml ? (
          <p role="alert" className="mt-2 text-sm text-pix">
            {eroriCamp.contentHtml}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-5">
        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Stare
          </label>
          <select
            id="status"
            name="status"
            defaultValue={(postare?.status as PostStatus) ?? "DRAFT"}
            className="mt-1.5 border border-liniatura bg-hartie px-3 py-2 text-sm focus:border-cerneala"
          >
            <option value="DRAFT">Ciornă — nu apare pe site</option>
            <option value="PUBLISHED">Publicată — apare pe site</option>
          </select>
        </div>
        <ButonSalvare esteEditare={esteEditare} />
      </div>
    </form>
  );
}

function ButonSalvare({ esteEditare }: { esteEditare: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-cerneala bg-cerneala px-6 py-2.5 text-sm font-medium text-hartie transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending
        ? "Se salvează…"
        : esteEditare
          ? "Salvează modificările"
          : "Salvează postarea"}
    </button>
  );
}

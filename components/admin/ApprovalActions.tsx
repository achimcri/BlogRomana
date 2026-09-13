"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { aprobaPostare, respingePostare } from "@/actions/submissions";
import type { RezultatActiune } from "@/lib/types";

/**
 * Acțiunile de moderare pentru un text în așteptare.
 *
 * Numele public este un câmp editabil, precompletat cu prenumele și inițiala.
 * Profesoara îl poate schimba, dar trebuie să-l vadă înainte să publice --
 * de asta e un input vizibil, nu o valoare ascunsă: publicăm date despre un
 * minor, iar decizia trebuie să fie conștientă.
 */
export function ApprovalActions({
  postId,
  numePublicPropus,
}: {
  postId: string;
  numePublicPropus: string;
}) {
  const [arataRespingere, setArataRespingere] = useState(false);

  const [stareAprobare, actiuneAprobare] = useActionState<
    RezultatActiune | null,
    FormData
  >(aprobaPostare, null);

  const [stareRespingere, actiuneRespingere] = useActionState<
    RezultatActiune | null,
    FormData
  >(respingePostare, null);

  const mesajEroare =
    (stareAprobare && !stareAprobare.ok
      ? (stareAprobare.mesajGeneral ?? stareAprobare.erori?.displayName)
      : null) ??
    (stareRespingere && !stareRespingere.ok
      ? stareRespingere.mesajGeneral
      : null);

  return (
    <div className="mt-6 border-t border-liniatura pt-5">
      {mesajEroare ? (
        <p role="alert" className="mb-4 text-sm text-pix">
          {mesajEroare}
        </p>
      ) : null}

      <form action={actiuneAprobare} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="postId" value={postId} />
        <div>
          <label
            htmlFor={`nume-${postId}`}
            className="block text-sm font-medium"
          >
            Apare pe site ca
          </label>
          <input
            id={`nume-${postId}`}
            name="displayName"
            type="text"
            required
            defaultValue={numePublicPropus}
            className="mt-1.5 w-56 border border-liniatura bg-hartie px-3 py-2 text-sm focus:border-cerneala"
          />
        </div>
        <ButonAprobare />
        <button
          type="button"
          onClick={() => setArataRespingere((v) => !v)}
          className="border border-liniatura px-4 py-2 text-sm transition-colors hover:border-pix hover:text-pix"
        >
          Respinge
        </button>
      </form>

      {arataRespingere ? (
        <form action={actiuneRespingere} className="mt-5 max-w-lectura">
          <input type="hidden" name="postId" value={postId} />
          <label
            htmlFor={`motiv-${postId}`}
            className="block text-sm font-medium"
          >
            Motivul respingerii
          </label>
          <p className="mt-1 text-sm text-cerneala-stinsa">
            Rămâne doar pentru tine. Elevul nu îl vede, pentru că nu are cont.
          </p>
          <textarea
            id={`motiv-${postId}`}
            name="rejectionReason"
            rows={2}
            className="mt-2 w-full border border-liniatura bg-hartie px-3 py-2 text-sm focus:border-cerneala"
          />
          <ButonRespingere />
        </form>
      ) : null}
    </div>
  );
}

function ButonAprobare() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-cerneala bg-cerneala px-5 py-2 text-sm font-medium text-hartie transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Se publică…" : "Aprobă și publică"}
    </button>
  );
}

function ButonRespingere() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 border border-pix px-4 py-2 text-sm text-pix transition-colors hover:bg-pix hover:text-hartie disabled:opacity-50"
    >
      {pending ? "Se respinge…" : "Confirmă respingerea"}
    </button>
  );
}
